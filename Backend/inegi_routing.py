import json
import os
import urllib.parse
import urllib.request
import gzip

import polyline


SAKBE_BASE_URL = "https://gaia.inegi.org.mx/sakbe_v3.1"
DEFAULT_SAKBE_KEY = "kqvCNH1V-keUF-rSVa-O1tf-gdqFN6DynMNN"


class InegiRoutingError(RuntimeError):
    pass


def _sakbe_key():
    return os.getenv("INEGI_RUTEO_KEY") or os.getenv("SAKBE_API_KEY") or DEFAULT_SAKBE_KEY


def _post_json(endpoint, payload, timeout=12):
    data = urllib.parse.urlencode(payload).encode("utf-8")
    request = urllib.request.Request(
        f"{SAKBE_BASE_URL}/{endpoint}",
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )

    with urllib.request.urlopen(request, timeout=timeout) as response:
        body = response.read()
        if response.headers.get("Content-Encoding") == "gzip" or body[:2] == b"\x1f\x8b":
            body = gzip.decompress(body)
        raw = body.decode("utf-8")

    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise InegiRoutingError("Respuesta invalida de INEGI") from exc


def _data_or_error(response):
    status = response.get("response") or {}
    success = status.get("succes", status.get("success", True))
    if success is False:
        raise InegiRoutingError(status.get("message") or "INEGI rechazo la solicitud")

    data = response.get("data")
    if not data:
        raise InegiRoutingError("INEGI no devolvio datos")
    return data


def _nearest_line(lat, lng):
    last_error = None
    data = None
    for scale in (10000, 25000, 50000, 100000, 250000):
        try:
            data = _data_or_error(_post_json("buscalinea", {
                "type": "json",
                "key": _sakbe_key(),
                "proj": "GRS80",
                "escala": scale,
                "x": lng,
                "y": lat,
            }))
            break
        except InegiRoutingError as exc:
            last_error = exc

    if data is None:
        raise last_error or InegiRoutingError("No se encontro linea cercana en INEGI")

    return {
        "id": data["id_routing_net"],
        "source": data["source"],
        "target": data["target"],
        "name": data.get("nombre", "Linea INEGI"),
    }


def _flatten_line_coords(geometry):
    coords = geometry.get("coordinates") or []
    geom_type = geometry.get("type")

    if geom_type == "LineString":
        return coords
    if geom_type == "MultiLineString":
        return [point for line in coords for point in line]
    raise InegiRoutingError(f"Geometria no soportada: {geom_type}")


def _geojson_to_polyline(geojson_value):
    geometry = json.loads(geojson_value) if isinstance(geojson_value, str) else geojson_value
    lng_lat_points = _flatten_line_coords(geometry)
    lat_lng_points = [(lat, lng) for lng, lat in lng_lat_points]
    return polyline.encode(lat_lng_points), lng_lat_points


def route_with_inegi(origin, destination, avoid_tolls=False, avoid_highways=False):
    origin_line = _nearest_line(origin[0], origin[1])
    destination_line = _nearest_line(destination[0], destination[1])
    endpoint = "libre" if (avoid_tolls or avoid_highways) else "optima"

    payload = {
        "type": "json",
        "key": _sakbe_key(),
        "proj": "GRS80",
        "id_i": origin_line["id"],
        "source_i": origin_line["source"],
        "target_i": origin_line["target"],
        "id_f": destination_line["id"],
        "source_f": destination_line["source"],
        "target_f": destination_line["target"],
        "v": 1,
        "e": 0,
    }

    data = _data_or_error(_post_json(endpoint, payload))
    encoded_polyline, coords = _geojson_to_polyline(data["geojson"])
    distance_km = float(data.get("long_km") or 0)
    duration_min = float(data.get("tiempo_min") or 0)
    toll_cost = float(data.get("costo_caseta") or 0)

    return {
        "polyline": encoded_polyline,
        "coords": coords,
        "distance": distance_km * 1000,
        "duration": duration_min * 60,
        "toll_cost": 0 if avoid_tolls else toll_cost,
        "toll_source": "inegi_sakbe",
        "toll_corridors": [origin_line["name"], destination_line["name"]],
        "warning": data.get("advertencia"),
        "engine": f"inegi_sakbe_{endpoint}",
    }
