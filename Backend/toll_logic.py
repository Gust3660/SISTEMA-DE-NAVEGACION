from route_logic import haversine_distance_m


TOLL_CORRIDORS = [
    {
        "name": "Mexico-Cuernavaca",
        "anchor": (18.9261, -99.23075),
        "cost_mxn": 136,
    },
    {
        "name": "Mexico-Puebla",
        "anchor": (19.04144, -98.20627),
        "cost_mxn": 216,
    },
    {
        "name": "Mexico-Queretaro",
        "anchor": (20.58879, -100.38989),
        "cost_mxn": 204,
    },
    {
        "name": "Mexico-Toluca",
        "anchor": (19.28261, -99.65567),
        "cost_mxn": 105,
    },
]


def estimate_toll_cost(origin, destination, distance_km, avoid_tolls=False):
    if avoid_tolls or distance_km < 35:
        return {
            "cost_mxn": 0.0,
            "source": "automatic_local",
            "matched_corridors": [],
            "auto": True,
        }

    matched = []
    for corridor in TOLL_CORRIDORS:
        origin_distance_km = haversine_distance_m(
            origin[0],
            origin[1],
            corridor["anchor"][0],
            corridor["anchor"][1],
        ) / 1000
        destination_distance_km = haversine_distance_m(
            destination[0],
            destination[1],
            corridor["anchor"][0],
            corridor["anchor"][1],
        ) / 1000

        if min(origin_distance_km, destination_distance_km) <= 32:
            matched.append(corridor)

    cost = sum(corridor["cost_mxn"] for corridor in matched)
    return {
        "cost_mxn": float(cost),
        "source": "automatic_local_inegi_rnc_ready",
        "matched_corridors": [corridor["name"] for corridor in matched],
        "auto": True,
    }
