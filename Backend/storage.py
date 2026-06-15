import json
import sqlite3
from pathlib import Path
from typing import Any


DB_PATH = Path(__file__).with_name("gps_data.sqlite3")


def _connect():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    with _connect() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS routes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                kind TEXT NOT NULL CHECK(kind IN ('saved', 'recent')),
                name TEXT NOT NULL,
                origin_name TEXT,
                origin_lat REAL NOT NULL,
                origin_lng REAL NOT NULL,
                destination_lat REAL NOT NULL,
                destination_lng REAL NOT NULL,
                form_json TEXT NOT NULL,
                distance REAL DEFAULT 0,
                duration REAL DEFAULT 0,
                toll_cost REAL DEFAULT 0,
                vehicle TEXT,
                battery_level REAL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        connection.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_routes_kind_updated
            ON routes(kind, updated_at DESC)
            """
        )


def _route_from_row(row: sqlite3.Row) -> dict[str, Any]:
    form = json.loads(row["form_json"])
    timestamp_key = "savedAt" if row["kind"] == "saved" else "usedAt"
    return {
        "id": row["id"],
        "name": row["name"],
        "originName": row["origin_name"] or "Punto de partida",
        timestamp_key: row["created_at"],
        "origin": {
            "lat": row["origin_lat"],
            "lng": row["origin_lng"],
        },
        "destination": {
            "lat": row["destination_lat"],
            "lng": row["destination_lng"],
        },
        "form": form,
        "distance": row["distance"] or 0,
        "duration": row["duration"] or 0,
        "tollCost": row["toll_cost"] or 0,
        "vehicle": row["vehicle"],
        "batteryLevel": row["battery_level"],
    }


def list_routes(kind: str, limit: int = 20) -> list[dict[str, Any]]:
    with _connect() as connection:
        rows = connection.execute(
            """
            SELECT * FROM routes
            WHERE kind = ?
            ORDER BY updated_at DESC, id DESC
            LIMIT ?
            """,
            (kind, limit),
        ).fetchall()
    return [_route_from_row(row) for row in rows]


def save_route(kind: str, route: dict[str, Any], limit: int = 20) -> dict[str, Any]:
    origin = route.get("origin") or {}
    destination = route.get("destination") or {}
    form = route.get("form") or {}

    with _connect() as connection:
        if kind == "recent":
            connection.execute(
                """
                DELETE FROM routes
                WHERE kind = ?
                  AND name = ?
                  AND origin_lat = ?
                  AND origin_lng = ?
                  AND destination_lat = ?
                  AND destination_lng = ?
                """,
                (
                    kind,
                    route.get("name") or "Ruta",
                    origin.get("lat"),
                    origin.get("lng"),
                    destination.get("lat"),
                    destination.get("lng"),
                ),
            )

        cursor = connection.execute(
            """
            INSERT INTO routes (
                kind, name, origin_name, origin_lat, origin_lng,
                destination_lat, destination_lng, form_json,
                distance, duration, toll_cost, vehicle, battery_level
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                kind,
                route.get("name") or "Ruta",
                route.get("originName") or "Punto de partida",
                float(origin.get("lat")),
                float(origin.get("lng")),
                float(destination.get("lat")),
                float(destination.get("lng")),
                json.dumps(form),
                route.get("distance") or 0,
                route.get("duration") or 0,
                route.get("tollCost") or 0,
                route.get("vehicle"),
                route.get("batteryLevel"),
            ),
        )

        connection.execute(
            """
            DELETE FROM routes
            WHERE kind = ?
              AND id NOT IN (
                SELECT id FROM routes
                WHERE kind = ?
                ORDER BY updated_at DESC, id DESC
                LIMIT ?
              )
            """,
            (kind, kind, limit),
        )

        row = connection.execute(
            "SELECT * FROM routes WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()

    return _route_from_row(row)
