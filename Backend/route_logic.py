import json
import math
import re
import unicodedata
from heapq import heappop, heappush
import urllib.parse
import urllib.request

import polyline
from shapely.geometry import LineString, Point, Polygon

EARTH_RADIUS_M = 6_371_000
OSRM_BASE_URL = "https://router.project-osrm.org/route/v1/driving"

LOCAL_PLACES = {
    "ciudad de mexico": (19.432608, -99.133209, "Ciudad de Mexico"),
    "cdmx": (19.432608, -99.133209, "Ciudad de Mexico"),
    "zocalo": (19.43263, -99.13318, "Zocalo, Ciudad de Mexico"),
    "angel de la independencia": (19.42698, -99.16766, "Angel de la Independencia"),
    "aicm": (19.43608, -99.07191, "Aeropuerto Internacional de la Ciudad de Mexico"),
    "aeropuerto benito juarez": (19.43608, -99.07191, "Aeropuerto Internacional de la Ciudad de Mexico"),
    "auditorio nacional": (19.42486, -99.19488, "Auditorio Nacional"),
    "bellas artes": (19.43523, -99.14124, "Palacio de Bellas Artes"),
    "chapultepec": (19.42044, -99.1819, "Bosque de Chapultepec"),
    "polanco": (19.43347, -99.19073, "Polanco"),
    "condesa": (19.41289, -99.17129, "Condesa"),
    "roma norte": (19.41879, -99.16287, "Roma Norte"),
    "santa fe": (19.36057, -99.29162, "Santa Fe"),
    "coyoacan": (19.3467, -99.16174, "Coyoacan"),
    "unam": (19.33225, -99.18874, "Ciudad Universitaria UNAM"),
}


def normalize_text(value: str) -> str:
    value = unicodedata.normalize("NFD", value.strip().lower())
    value = "".join(char for char in value if unicodedata.category(char) != "Mn")
    return re.sub(r"\s+", " ", value)


def haversine_distance_m(lat1, lng1, lat2, lng2):
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlng / 2) ** 2
    )
    return 2 * EARTH_RADIUS_M * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def manhattan_distance(lat1, lng1, lat2, lng2):
    lat_mid = math.radians((lat1 + lat2) / 2)
    dx = abs(lng2 - lng1) * 111.32 * math.cos(lat_mid)
    dy = abs(lat2 - lat1) * 111.32
    return dx + dy


def polyline_to_coords(polyline_str):
    points = polyline.decode(polyline_str)
    return [[lng, lat] for lat, lng in points]


def coords_to_polyline(coords):
    points = [(lat, lng) for lng, lat in coords]
    return polyline.encode(points)


def fetch_osrm_routes(points, alternatives=True, timeout=10):
    coordinate_text = ";".join(f"{lng},{lat}" for lat, lng in points)
    params = urllib.parse.urlencode({
        "overview": "full",
        "geometries": "polyline",
        "alternatives": "true" if alternatives and len(points) == 2 else "false",
        "steps": "false",
    })
    url = f"{OSRM_BASE_URL}/{coordinate_text}?{params}"
    request = urllib.request.Request(url, headers={"User-Agent": "GPS-Location-Demo/1.0"})

    with urllib.request.urlopen(request, timeout=timeout) as response:
        data = json.loads(response.read().decode("utf-8"))

    if data.get("code") != "Ok" or not data.get("routes"):
        raise RuntimeError(data.get("message") or "OSRM no devolvio ruta")

    routes = []
    for route in data["routes"]:
        encoded = route["geometry"]
        routes.append({
            "polyline": encoded,
            "coords": polyline_to_coords(encoded),
            "distance": float(route.get("distance") or 0),
            "duration": float(route.get("duration") or 0),
        })
    return routes


def route_intersects_red_zone(route_points_lnglat, red_zones, exempt_points=None):
    if not route_points_lnglat or len(route_points_lnglat) < 2:
        return None

    exempt_points = exempt_points or []
    line = LineString(route_points_lnglat)
    for zone in red_zones:
        try:
            polygon = Polygon(zone["polygon"])
            if any(polygon.contains(Point(lng, lat)) for lat, lng in exempt_points):
                continue
            if line.intersects(polygon):
                return zone["name"]
        except Exception as exc:
            print(f"Error verificando zona {zone['name']}: {exc}")
    return None


def point_inside_red_zone(lat, lng, red_zones):
    point = Point(lng, lat)
    return any(Polygon(zone["polygon"]).contains(point) for zone in red_zones)


def interpolate_segment(start, end, max_step_m=250):
    distance = haversine_distance_m(start[0], start[1], end[0], end[1])
    steps = max(1, math.ceil(distance / max_step_m))
    points = []

    for index in range(steps + 1):
        ratio = index / steps
        lat = start[0] + (end[0] - start[0]) * ratio
        lng = start[1] + (end[1] - start[1]) * ratio
        points.append([lng, lat])

    return points


def normalize_lnglat_points(coords):
    cleaned = []
    for lng, lat in coords:
        if cleaned and abs(cleaned[-1][0] - lng) < 0.000001 and abs(cleaned[-1][1] - lat) < 0.000001:
            continue
        cleaned.append([lng, lat])
    return cleaned


def segment_intersects_red_zone(start, end, red_zones, exempt_points=None):
    if not red_zones:
        return False

    exempt_points = exempt_points or []
    line = LineString([[start[1], start[0]], [end[1], end[0]]])
    for zone in red_zones:
        polygon = Polygon(zone["polygon"])
        if any(polygon.contains(Point(lng, lat)) for lat, lng in exempt_points):
            continue
        if line.intersects(polygon):
            return True
    return False


def road_like_dogleg_segment(start, end, red_zones=None):
    candidates = [
        [start, (start[0], end[1]), end],
        [start, (end[0], start[1]), end],
    ]
    best = None
    for candidate in candidates:
        coords = []
        blocked = False
        for current, nxt in zip(candidate, candidate[1:]):
            if segment_intersects_red_zone(current, nxt, red_zones, exempt_points=[start, end]):
                blocked = True
            segment = interpolate_segment(current, nxt)
            if coords:
                segment = segment[1:]
            coords.extend(segment)
        score = route_distance_m(coords) + (1_000_000_000 if blocked else 0)
        if best is None or score < best[0]:
            best = (score, coords)
    return best[1]


def orthogonal_connector(start, end, red_zones=None):
    candidates = [
        [start, (start[0], end[1]), end],
        [start, (end[0], start[1]), end],
    ]
    best = None
    for candidate in candidates:
        coords = [[lng, lat] for lat, lng in candidate]
        blocked = any(
            segment_intersects_red_zone(current, nxt, red_zones, exempt_points=[start, end])
            for current, nxt in zip(candidate, candidate[1:])
        )
        score = route_distance_m(coords) + (1_000_000_000 if blocked else 0)
        if best is None or score < best[0]:
            best = (score, coords)
    return best[1]


def grid_bounds(start, end, red_zones, padding=0.018):
    lats = [start[0], end[0]]
    lngs = [start[1], end[1]]
    for zone in red_zones or []:
        for lng, lat in zone["polygon"]:
            lats.append(lat)
            lngs.append(lng)

    return {
        "min_lat": min(lats) - padding,
        "max_lat": max(lats) + padding,
        "min_lng": min(lngs) - padding,
        "max_lng": max(lngs) + padding,
    }


def route_grid_segment(start, end, red_zones=None, step=0.003):
    red_zones = red_zones or []
    bounds = grid_bounds(start, end, red_zones)

    def to_node(point):
        lat_index = round((point[0] - bounds["min_lat"]) / step)
        lng_index = round((point[1] - bounds["min_lng"]) / step)
        return lat_index, lng_index

    def to_point(node):
        return bounds["min_lat"] + node[0] * step, bounds["min_lng"] + node[1] * step

    start_node = to_node(start)
    end_node = to_node(end)
    max_lat_index = math.ceil((bounds["max_lat"] - bounds["min_lat"]) / step)
    max_lng_index = math.ceil((bounds["max_lng"] - bounds["min_lng"]) / step)
    frontier = []
    heappush(frontier, (0, start_node))
    came_from = {start_node: None}
    cost_so_far = {start_node: 0}
    neighbors = [(1, 0), (-1, 0), (0, 1), (0, -1)]

    while frontier:
        _, current = heappop(frontier)
        if current == end_node:
            break

        current_point = to_point(current)
        for dlat, dlng in neighbors:
            nxt = (current[0] + dlat, current[1] + dlng)
            if nxt[0] < 0 or nxt[1] < 0 or nxt[0] > max_lat_index or nxt[1] > max_lng_index:
                continue

            next_point = to_point(nxt)
            if point_inside_red_zone(next_point[0], next_point[1], red_zones):
                continue
            if segment_intersects_red_zone(current_point, next_point, red_zones, exempt_points=[start, end]):
                continue

            segment_cost = haversine_distance_m(current_point[0], current_point[1], next_point[0], next_point[1])
            new_cost = cost_so_far[current] + segment_cost
            if nxt not in cost_so_far or new_cost < cost_so_far[nxt]:
                cost_so_far[nxt] = new_cost
                heuristic = manhattan_distance(next_point[0], next_point[1], end[0], end[1]) * 1000
                heappush(frontier, (new_cost + heuristic, nxt))
                came_from[nxt] = current

    if end_node not in came_from:
        return road_like_dogleg_segment(start, end, red_zones)

    nodes = []
    current = end_node
    while current is not None:
        nodes.append(current)
        current = came_from[current]
    nodes.reverse()

    node_points = [to_point(node) for node in nodes]
    coords = [[start[1], start[0]]]

    if node_points:
        first = node_points[0]
        coords.extend(orthogonal_connector(start, first, red_zones)[1:])

        for point in node_points[1:]:
            coords.append([point[1], point[0]])

        last = node_points[-1]
        coords.extend(orthogonal_connector(last, end, red_zones)[1:])

    return normalize_lnglat_points(coords)


def build_route_coords(points, red_zones=None):
    coords = []
    for index in range(len(points) - 1):
        segment = route_grid_segment(points[index], points[index + 1], red_zones=red_zones)
        if index:
            segment = segment[1:]
        coords.extend(segment)
    return coords


def route_distance_m(coords):
    total = 0
    for current, nxt in zip(coords, coords[1:]):
        total += haversine_distance_m(current[1], current[0], nxt[1], nxt[0])
    return total


def intersecting_red_zones(route_points_lnglat, red_zones, exempt_points=None):
    if not route_points_lnglat or len(route_points_lnglat) < 2:
        return []

    exempt_points = exempt_points or []
    line = LineString(route_points_lnglat)
    hits = []
    for zone in red_zones:
        try:
            polygon = Polygon(zone["polygon"])
            if any(polygon.contains(Point(lng, lat)) for lat, lng in exempt_points):
                continue
            if line.intersects(polygon):
                hits.append(zone)
        except Exception as exc:
            print(f"Error verificando zona {zone['name']}: {exc}")
    return hits


def route_objective(coords, red_zones, exempt_points=None):
    distance = route_distance_m(coords)
    red_hits = intersecting_red_zones(coords, red_zones, exempt_points=exempt_points)
    red_penalty = len(red_hits) * 1_000_000_000
    turns_penalty = max(0, len(coords) - 2) * 0.02
    return distance + red_penalty + turns_penalty


def candidate_waypoints_for_zone(zone, padding=0.008):
    lngs = [point[0] for point in zone["polygon"]]
    lats = [point[1] for point in zone["polygon"]]
    min_lng, max_lng = min(lngs) - padding, max(lngs) + padding
    min_lat, max_lat = min(lats) - padding, max(lats) + padding
    mid_lng = (min_lng + max_lng) / 2
    mid_lat = (min_lat + max_lat) / 2

    return [
        (max_lat, mid_lng),
        (min_lat, mid_lng),
        (mid_lat, max_lng),
        (mid_lat, min_lng),
        (max_lat, max_lng),
        (max_lat, min_lng),
        (min_lat, max_lng),
        (min_lat, min_lng),
    ]


def find_safe_waypoint(origin, destination, red_zones):
    direct_coords = build_route_coords([origin, destination], red_zones=red_zones)
    hit_zones = intersecting_red_zones(direct_coords, red_zones, exempt_points=[origin, destination])
    if not hit_zones:
        return None

    best = None

    for hit_zone in hit_zones:
        for waypoint in candidate_waypoints_for_zone(hit_zone):
            if point_inside_red_zone(waypoint[0], waypoint[1], red_zones):
                continue

            coords = build_route_coords([origin, waypoint, destination], red_zones=red_zones)
            objective = route_objective(coords, red_zones, exempt_points=[origin, destination])
            if best is None or objective < best[0]:
                best = (objective, waypoint)

    return best[1] if best else None


def hill_climb_waypoints(points, red_zones, exempt_points=None):
    if len(points) <= 2:
        return points

    best_points = points[:]
    best_coords = build_route_coords(best_points, red_zones=red_zones)
    best_score = route_objective(best_coords, red_zones, exempt_points=exempt_points)

    for step in (0.006, 0.003, 0.0012):
        improved = True
        while improved:
            improved = False
            for index in range(1, len(best_points) - 1):
                lat, lng = best_points[index]
                candidates = [
                    (lat + step, lng),
                    (lat - step, lng),
                    (lat, lng + step),
                    (lat, lng - step),
                    (lat + step, lng + step),
                    (lat + step, lng - step),
                    (lat - step, lng + step),
                    (lat - step, lng - step),
                ]

                for candidate in candidates:
                    if point_inside_red_zone(candidate[0], candidate[1], red_zones):
                        continue

                    next_points = best_points[:]
                    next_points[index] = candidate
                    coords = build_route_coords(next_points, red_zones=red_zones)
                    score = route_objective(coords, red_zones, exempt_points=exempt_points)
                    if score < best_score:
                        best_points = next_points
                        best_score = score
                        improved = True
                        break
                if improved:
                    break

    return best_points


def score_road_route(route, red_zones, exempt_points=None):
    hits = intersecting_red_zones(route["coords"], red_zones, exempt_points=exempt_points)
    return route["distance"] + len(hits) * 1_000_000_000, hits


def road_route_candidates(origin, destination, red_zones):
    exempt_points = [origin, destination]
    candidates = []

    try:
        for route in fetch_osrm_routes([origin, destination], alternatives=True):
            score, hits = score_road_route(route, red_zones, exempt_points=exempt_points)
            candidates.append({
                **route,
                "score": score,
                "hit_zones": hits,
                "waypoints": [],
            })
    except Exception as exc:
        raise RuntimeError(f"No se pudo consultar OSRM: {exc}") from exc

    hit_zones = []
    for candidate in candidates:
        for zone in candidate["hit_zones"]:
            if zone["name"] not in {item["name"] for item in hit_zones}:
                hit_zones.append(zone)

    for zone in hit_zones:
        for waypoint in candidate_waypoints_for_zone(zone, padding=0.012):
            if point_inside_red_zone(waypoint[0], waypoint[1], red_zones):
                continue
            try:
                for route in fetch_osrm_routes([origin, waypoint, destination], alternatives=False):
                    score, hits = score_road_route(route, red_zones, exempt_points=exempt_points)
                    candidates.append({
                        **route,
                        "score": score,
                        "hit_zones": hits,
                        "waypoints": [waypoint],
                    })
            except Exception:
                continue

    return candidates


def calculate_road_network_route(origin, destination, red_zones, avoid_tolls=False, avoid_highways=False, traffic_context=None):
    exempt_points = [origin, destination]
    candidates = road_route_candidates(origin, destination, red_zones)
    if not candidates:
        raise RuntimeError("No se encontraron rutas por carretera")

    best = min(candidates, key=lambda item: item["score"])
    unresolved_zones = [zone["name"] for zone in best["hit_zones"]]
    direct_line = build_route_coords([origin, destination], red_zones=[])
    avoided_zones = [
        zone["name"]
        for zone in red_zones
        if route_intersects_red_zone(direct_line, [zone], exempt_points=exempt_points)
        and zone["name"] not in unresolved_zones
    ]

    distance = best["distance"]
    duration = best["duration"]
    if avoid_highways:
        duration *= 1.12
    if avoid_tolls:
        distance *= 1.04

    traffic_factor = 1.0
    traffic_source = "local_model"
    traffic_level = "normal"
    if traffic_context:
        traffic_factor = max(1.0, min(float(traffic_context.get("traffic_factor", 1.0)), 2.5))
        traffic_source = traffic_context.get("source", "google_optional")
        traffic_level = traffic_context.get("traffic_level", traffic_level)

    duration *= traffic_factor
    risk_score = min(100, 18 + len(avoided_zones) * 14 + len(unresolved_zones) * 32 + int((traffic_factor - 1) * 35))

    return {
        "polyline": best["polyline"],
        "distance": distance,
        "duration": duration,
        "waypoints": best["waypoints"],
        "route_model": "osrm_road_network_manhattan_penalty",
        "optimization": {
            "models": ["osrm_road_graph", "manhattan_heuristic", "red_zone_penalty", "alternative_selection"],
            "traffic_factor": traffic_factor,
            "traffic_source": traffic_source,
            "traffic_level": traffic_level,
        },
        "avoided_zones": avoided_zones,
        "unresolved_zones": unresolved_zones,
        "risk_score": risk_score,
    }


def calculate_local_route(origin, destination, red_zones, avoid_tolls=False, avoid_highways=False, traffic_context=None):
    points = [origin, destination]
    waypoints = []
    coords = build_route_coords(points, red_zones=red_zones)
    exempt_points = [origin, destination]

    for _ in range(5):
        hit_zones = intersecting_red_zones(coords, red_zones, exempt_points=exempt_points)
        if not hit_zones:
            break

        waypoint = find_safe_waypoint(points[-2], points[-1], red_zones)
        if not waypoint:
            names = ", ".join(zone["name"] for zone in hit_zones)
            return {"error": f"No se pudo evitar la zona roja: {names}"}

        points.insert(-1, waypoint)
        waypoints.append(waypoint)
        coords = build_route_coords(points, red_zones=red_zones)
    else:
        return {"error": "No se encontro una ruta segura con los limites actuales"}

    points = hill_climb_waypoints(points, red_zones, exempt_points=exempt_points)
    waypoints = points[1:-1]
    coords = build_route_coords(points, red_zones=red_zones)
    avoided_zones = [
        zone["name"]
        for zone in red_zones
        if route_intersects_red_zone(build_route_coords([origin, destination], red_zones=[]), [zone], exempt_points=exempt_points)
    ]
    unresolved_zones = [
        zone["name"]
        for zone in intersecting_red_zones(coords, red_zones, exempt_points=exempt_points)
    ]

    distance = route_distance_m(coords)
    speed_kmh = 34
    if avoid_highways:
        speed_kmh = 26
    if avoid_tolls:
        distance *= 1.04

    traffic_factor = 1.0
    traffic_source = "local_model"
    traffic_level = "normal"
    if traffic_context:
        traffic_factor = max(1.0, min(float(traffic_context.get("traffic_factor", 1.0)), 2.5))
        traffic_source = traffic_context.get("source", "google_optional")
        traffic_level = traffic_context.get("traffic_level", traffic_level)

    duration = (distance / (speed_kmh * 1000 / 3600)) * traffic_factor
    risk_score = min(100, 22 + len(avoided_zones) * 18 + len(unresolved_zones) * 28 + int((traffic_factor - 1) * 35))

    return {
        "polyline": coords_to_polyline(coords),
        "distance": distance,
        "duration": duration,
        "waypoints": waypoints,
        "route_model": "manhattan_detour_hill_climbing",
        "optimization": {
            "models": ["manhattan_distance", "red_zone_penalty", "hill_climbing"],
            "traffic_factor": traffic_factor,
            "traffic_source": traffic_source,
            "traffic_level": traffic_level,
        },
        "avoided_zones": avoided_zones,
        "unresolved_zones": unresolved_zones,
        "risk_score": risk_score,
    }


async def geocode_local(query: str):
    normalized = normalize_text(query)

    if "," in normalized:
        parts = [part.strip() for part in normalized.split(",")]
        if len(parts) >= 2:
            try:
                return float(parts[0]), float(parts[1]), "Coordenadas manuales"
            except ValueError:
                pass

    if normalized in LOCAL_PLACES:
        lat, lng, display = LOCAL_PLACES[normalized]
        return lat, lng, display

    for key, value in LOCAL_PLACES.items():
        if key in normalized or normalized in key:
            return value

    return None
