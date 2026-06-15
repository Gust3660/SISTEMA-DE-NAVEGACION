import json
import os
import re
import urllib.request


GOOGLE_ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes"


def _duration_to_seconds(value):
    if not value:
        return None
    match = re.match(r"^(\d+(?:\.\d+)?)s$", value)
    if not match:
        return None
    return float(match.group(1))


def get_google_traffic_context(origin, destination):
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        return {
            "source": "local_model",
            "traffic_factor": 1.0,
            "traffic_level": "normal",
            "warning": "GOOGLE_MAPS_API_KEY no configurada; trafico estimado localmente.",
        }

    body = {
        "origin": {
            "location": {
                "latLng": {"latitude": origin[0], "longitude": origin[1]}
            }
        },
        "destination": {
            "location": {
                "latLng": {"latitude": destination[0], "longitude": destination[1]}
            }
        },
        "travelMode": "DRIVE",
        "routingPreference": "TRAFFIC_AWARE",
        "computeAlternativeRoutes": False,
        "languageCode": "es-MX",
        "units": "METRIC",
    }

    request = urllib.request.Request(
        GOOGLE_ROUTES_URL,
        data=json.dumps(body).encode("utf-8"),
        method="POST",
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": "routes.duration,routes.staticDuration",
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=6) as response:
            data = json.loads(response.read().decode("utf-8"))
    except Exception as exc:
        return {
            "source": "local_model",
            "traffic_factor": 1.0,
            "traffic_level": "normal",
            "warning": f"No se pudo consultar Google Routes: {exc}",
        }

    route = (data.get("routes") or [{}])[0]
    traffic_seconds = _duration_to_seconds(route.get("duration"))
    static_seconds = _duration_to_seconds(route.get("staticDuration"))
    if not traffic_seconds or not static_seconds:
        return {
            "source": "google_routes",
            "traffic_factor": 1.0,
            "traffic_level": "normal",
            "warning": "Google Routes no regreso duraciones de trafico suficientes.",
        }

    factor = max(1.0, min(traffic_seconds / max(static_seconds, 1), 2.5))
    if factor >= 1.45:
        level = "pesado"
    elif factor >= 1.18:
        level = "moderado"
    else:
        level = "normal"

    return {
        "source": "google_routes",
        "traffic_factor": factor,
        "traffic_level": level,
        "warning": None,
    }
