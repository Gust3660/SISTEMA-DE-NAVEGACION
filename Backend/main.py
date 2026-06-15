import json
import os
import urllib.parse
import urllib.request
from typing import Any, Optional

import uvicorn
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from dotenv import load_dotenv
from pydantic import BaseModel

from route_logic import (
    calculate_road_network_route,
    geocode_local,
    haversine_distance_m,
    intersecting_red_zones,
    manhattan_distance,
)
from inegi_routing import route_with_inegi
from toll_logic import estimate_toll_cost
from storage import init_db, list_routes, save_route
from google_context import get_google_traffic_context

load_dotenv()

app = FastAPI(title="GPS LOCATION API", version="2.0.0")
templates = Jinja2Templates(directory="templates")

with open("red_zones.json", "r", encoding="utf-8") as f:
    RED_ZONES = json.load(f)["zones"]

vehicles_state = {}
ws_connections: list[WebSocket] = []
alerts_history = []


class TelemetryData(BaseModel):
    vehicle_id: str
    lat: float
    lng: float
    speed: Optional[float] = None
    fuel_level: Optional[float] = None
    timestamp: float


class RouteRequest(BaseModel):
    origin_lat: float
    origin_lng: float
    dest_lat: float
    dest_lng: float
    vehicle_consumption: float = 8.0
    fuel_price_per_liter: float = 23.5
    toll_cost_mxn: float = 0.0
    avoid_tolls: bool = False
    avoid_highways: bool = False


class GeocodeQuery(BaseModel):
    query: str


class StoredRoute(BaseModel):
    name: str
    originName: Optional[str] = "Punto de partida"
    origin: dict[str, float]
    destination: dict[str, float]
    form: dict[str, Any]
    distance: float = 0
    duration: float = 0
    tollCost: float = 0
    vehicle: Optional[str] = None
    batteryLevel: Optional[float] = None


@app.on_event("startup")
async def startup():
    init_db()


def search_photon_places(query: str, lat: Optional[float] = None, lng: Optional[float] = None, limit: int = 6):
    params = {
        "q": query,
        "limit": max(1, min(limit, 10)),
    }
    if lat is not None and lng is not None:
        params["lat"] = lat
        params["lon"] = lng

    url = f"https://photon.komoot.io/api/?{urllib.parse.urlencode(params)}"
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "GPS-Location-Demo/1.0"},
    )

    with urllib.request.urlopen(request, timeout=8) as response:
      data = json.loads(response.read().decode("utf-8"))

    suggestions = []
    for feature in data.get("features", []):
        coords = feature.get("geometry", {}).get("coordinates", [])
        props = feature.get("properties", {})
        if len(coords) < 2:
            continue

        parts = [
            props.get("name"),
            props.get("street"),
            props.get("city"),
            props.get("state"),
            props.get("country"),
        ]
        display_name = ", ".join(dict.fromkeys(part for part in parts if part))
        if not display_name:
            display_name = props.get("osm_value") or "Lugar sin nombre"

        suggestions.append({
            "lat": coords[1],
            "lng": coords[0],
            "display_name": display_name,
            "name": props.get("name") or display_name,
            "country": props.get("country"),
            "engine": "photon_osm",
        })

    return suggestions


def apply_traffic_context(duration: float, traffic_context: dict[str, Any]):
    factor = max(1.0, min(float(traffic_context.get("traffic_factor", 1.0)), 2.5))
    return duration * factor, {
        "traffic_factor": factor,
        "traffic_source": traffic_context.get("source", "local_model"),
        "traffic_level": traffic_context.get("traffic_level", "normal"),
    }


def inegi_result_to_route(origin, destination, inegi_result, traffic_context):
    exempt_points = [origin, destination]
    unresolved = [
        zone["name"]
        for zone in intersecting_red_zones(
            inegi_result["coords"],
            RED_ZONES,
            exempt_points=exempt_points,
        )
    ]
    duration, traffic = apply_traffic_context(inegi_result["duration"], traffic_context)

    return {
        "polyline": inegi_result["polyline"],
        "distance": inegi_result["distance"],
        "duration": duration,
        "waypoints": [],
        "route_model": inegi_result["engine"],
        "optimization": {
            "models": ["inegi_sakbe_road_graph", "red_zone_penalty"],
            **traffic,
        },
        "avoided_zones": [],
        "unresolved_zones": unresolved,
        "risk_score": min(100, 22 + len(unresolved) * 32 + int((traffic["traffic_factor"] - 1) * 35)),
        "toll_cost": inegi_result.get("toll_cost"),
        "toll_source": inegi_result.get("toll_source"),
        "toll_corridors": inegi_result.get("toll_corridors", []),
        "warning": inegi_result.get("warning"),
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "engine": "osrm_road_network + inegi_sakbe + local_emergency_fallback",
        "google_traffic_api": bool(os.getenv("GOOGLE_MAPS_API_KEY")),
        "red_zones": len(RED_ZONES),
        "vehicles": len(vehicles_state),
    }


@app.post("/route")
async def get_route(req: RouteRequest):
    origin = (req.origin_lat, req.origin_lng)
    destination = (req.dest_lat, req.dest_lng)
    traffic_context = get_google_traffic_context(origin, destination)
    try:
        result = calculate_road_network_route(
            origin,
            destination,
            RED_ZONES,
            avoid_tolls=req.avoid_tolls,
            avoid_highways=req.avoid_highways,
            traffic_context=traffic_context,
        )
    except Exception as osrm_exc:
        try:
            inegi_result = route_with_inegi(
                origin,
                destination,
                avoid_tolls=req.avoid_tolls,
                avoid_highways=req.avoid_highways,
            )
            result = inegi_result_to_route(origin, destination, inegi_result, traffic_context)
            result["fallback_reason"] = f"OSRM no disponible: {osrm_exc}"
        except Exception as inegi_exc:
            return {
                "error": (
                    "No se pudo calcular una ruta por carretera. "
                    f"OSRM: {osrm_exc}; INEGI: {inegi_exc}"
                )
            }

    if result.get("error"):
        return {"error": result["error"]}

    distance_km = result["distance"] / 1000
    fuel_used = (req.vehicle_consumption / 100) * distance_km
    fuel_price = req.fuel_price_per_liter or 23.5
    fuel_cost = fuel_used * fuel_price
    if result.get("toll_cost") is not None:
        toll_cost = 0 if req.avoid_tolls else float(result["toll_cost"])
        toll_source = result.get("toll_source", "inegi_sakbe")
        toll_corridors = result.get("toll_corridors", [])
    else:
        auto_toll = estimate_toll_cost(
            origin,
            destination,
            distance_km,
            avoid_tolls=req.avoid_tolls,
        )
        toll_cost = 0 if req.avoid_tolls else auto_toll["cost_mxn"]
        toll_source = auto_toll["source"]
        toll_corridors = auto_toll["matched_corridors"]

    total_cost = fuel_cost + toll_cost
    manhattan_km = manhattan_distance(
        req.origin_lat,
        req.origin_lng,
        req.dest_lat,
        req.dest_lng,
    )

    return {
        "polyline": result["polyline"],
        "distance_meters": round(result["distance"], 1),
        "distance_km": round(distance_km, 2),
        "duration_seconds": round(result["duration"], 1),
        "duration_minutes": round(result["duration"] / 60, 1),
        "toll_cost_mxn": round(toll_cost, 2),
        "toll_cost_source": toll_source,
        "toll_cost_auto": True,
        "toll_corridors": toll_corridors,
        "fuel_consumption_liters": round(fuel_used, 2),
        "fuel_cost_mxn": round(fuel_cost, 2),
        "total_cost_mxn": round(total_cost, 2),
        "fuel_price_per_liter": round(fuel_price, 2),
        "manhattan_distance_km": round(manhattan_km, 2),
        "waypoints": result.get("waypoints", []),
        "engine": result.get("route_model", "manhattan_detour_hill_climbing"),
        "optimization": result.get("optimization"),
        "google_warning": traffic_context.get("warning"),
        "red_zones": RED_ZONES,
        "map_layers": {
            "red_zones": RED_ZONES,
            "traffic": {
                "level": result.get("optimization", {}).get("traffic_level", "normal"),
                "source": result.get("optimization", {}).get("traffic_source", "local_model"),
                "factor": result.get("optimization", {}).get("traffic_factor", 1.0),
            },
            "avoided_zones": result.get("avoided_zones", []),
        },
        "avoided_zones": result.get("avoided_zones", []),
        "unresolved_zones": result.get("unresolved_zones", []),
        "risk_score": result.get("risk_score", 32),
        "traffic_level": result.get("optimization", {}).get("traffic_level", "normal"),
        "fallback_reason": result.get("fallback_reason"),
        "summary": "Ruta por red vial real; OSRM como motor principal, INEGI Sakbe como respaldo en Mexico y modelo local solo como emergencia.",
    }


@app.post("/geocode")
async def geocode(q: GeocodeQuery):
    result = await geocode_local(q.query)
    if result:
        lat, lng, display_name = result
        return {
            "lat": lat,
            "lng": lng,
            "display_name": display_name,
            "engine": "local_dictionary",
        }

    return {"error": "Direccion no encontrada en el catalogo local"}


@app.get("/geocode/suggest")
async def geocode_suggest(query: str, lat: Optional[float] = None, lng: Optional[float] = None):
    value = query.strip()
    if len(value) < 3:
        return []

    try:
        return search_photon_places(value, lat=lat, lng=lng)
    except Exception:
        normalized = value.lower()
        local = []
        for key, (place_lat, place_lng, display) in geocode_local.__globals__["LOCAL_PLACES"].items():
            if normalized in key or key in normalized:
                local.append({
                    "lat": place_lat,
                    "lng": place_lng,
                    "display_name": display,
                    "name": display,
                    "country": "Mexico",
                    "engine": "local_dictionary",
                })
        return local[:6]


@app.post("/telemetry")
async def receive_telemetry(data: TelemetryData):
    global vehicles_state, alerts_history
    vehicle_id = data.vehicle_id
    now = data.timestamp
    speed = data.speed

    if speed is None and vehicle_id in vehicles_state:
        last = vehicles_state[vehicle_id]
        dt = now - last["timestamp"]
        if dt > 0:
            dist_m = haversine_distance_m(last["lat"], last["lng"], data.lat, data.lng)
            speed = (dist_m / 1000) / (dt / 3600)
        else:
            speed = 0.0
    elif speed is None:
        speed = 0.0

    prev = vehicles_state.get(vehicle_id)
    vehicles_state[vehicle_id] = {
        "lat": data.lat,
        "lng": data.lng,
        "speed": speed,
        "fuel_level": data.fuel_level,
        "timestamp": now,
    }

    if data.fuel_level is not None and prev is not None:
        stopped = speed < 2
        fuel_drop = (
            prev.get("fuel_level") is not None
            and prev["fuel_level"] - data.fuel_level > 1.0
        )

        if stopped and fuel_drop:
            alert = {
                "vehicle_id": vehicle_id,
                "lat": data.lat,
                "lng": data.lng,
                "speed": round(speed, 1),
                "fuel_level": data.fuel_level,
                "timestamp": now,
                "message": (
                    f"Alerta: vehiculo {vehicle_id} detenido con descarga de "
                    f"combustible en {data.lat:.5f}, {data.lng:.5f}"
                ),
            }
            alerts_history.append(alert)

            for ws in ws_connections[:]:
                try:
                    await ws.send_json(alert)
                except Exception:
                    pass

    return {"status": "ok", "calculated_speed_kmh": round(speed, 1)}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    ws_connections.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in ws_connections:
            ws_connections.remove(websocket)


@app.get("/", response_class=HTMLResponse)
async def dashboard(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/alerts")
async def get_alerts():
    return alerts_history[-50:]


@app.get("/routes/saved")
async def get_saved_routes():
    return list_routes("saved")


@app.post("/routes/saved")
async def create_saved_route(route: StoredRoute):
    return save_route("saved", route.dict())


@app.get("/routes/recent")
async def get_recent_routes():
    return list_routes("recent")


@app.post("/routes/recent")
async def create_recent_route(route: StoredRoute):
    return save_route("recent", route.dict())


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
