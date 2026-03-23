"""
result_processor.py
Reads results.csv, constructors.csv, drivers.csv, and status.csv,
joins them together for 2026 races, and stores in races.db.
Skips if results table already exists.
"""

import csv
import os
import sqlite3

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RACE_DB_PATH = os.path.join(BASE, "DB", "races.db")
RESULTS_CSV = os.path.join(BASE, "RaceData", "results.csv")
CONSTRUCTORS_CSV = os.path.join(BASE, "RaceData", "constructors.csv")
DRIVERS_CSV = os.path.join(BASE, "RaceData", "drivers.csv")
STATUS_CSV = os.path.join(BASE, "RaceData", "status.csv")

# 2026 raceIds from races.csv (lines 1151-1172)
RACE_IDS_2026 = set(str(i) for i in range(1169, 1191))


def build_results_database():
    """Build the race_results table in races.db."""
    os.makedirs(os.path.dirname(RACE_DB_PATH), exist_ok=True)
    conn = sqlite3.connect(RACE_DB_PATH)

    # Check if already exists
    cur = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='race_results'"
    )
    if cur.fetchone():
        print("⏩ race_results table already exists — skipping.")
        conn.close()
        return

    # Load constructors
    constructors = {}
    with open(CONSTRUCTORS_CSV, "r", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            constructors[row["constructorId"]] = row["name"]

    # Load drivers
    drivers = {}
    with open(DRIVERS_CSV, "r", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            full_name = f'{row["forename"]} {row["surname"]}'
            drivers[row["driverId"]] = {
                "code": row.get("code", ""),
                "full_name": full_name,
                "nationality": row.get("nationality", ""),
            }

    # Load statuses
    statuses = {}
    with open(STATUS_CSV, "r", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            statuses[row["statusId"]] = row["status"]

    # Load 2026 results
    results = []
    with open(RESULTS_CSV, "r", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row["raceId"] not in RACE_IDS_2026:
                continue
            did = row["driverId"]
            cid = row["constructorId"]
            sid = row["statusId"]
            drv = drivers.get(did, {})

            # Clean \\N values
            def clean(v):
                return None if v in ("\\N", "") else v

            results.append(
                (
                    int(row["resultId"]),
                    int(row["raceId"]),
                    int(did),
                    drv.get("full_name", ""),
                    drv.get("code", ""),
                    drv.get("nationality", ""),
                    int(cid),
                    constructors.get(cid, ""),
                    clean(row.get("number")),
                    clean(row.get("grid")),
                    clean(row.get("position")),
                    row.get("positionText", ""),
                    int(row.get("positionOrder", 0)),
                    float(row.get("points", 0)),
                    int(row.get("laps", 0)),
                    clean(row.get("time")),
                    clean(row.get("milliseconds")),
                    clean(row.get("fastestLap")),
                    clean(row.get("rank")),
                    clean(row.get("fastestLapTime")),
                    clean(row.get("fastestLapSpeed")),
                    statuses.get(sid, ""),
                )
            )

    results.sort(key=lambda x: (x[1], x[12]))  # sort by raceId, positionOrder

    conn.execute("DROP TABLE IF EXISTS race_results")
    conn.execute(
        """CREATE TABLE race_results (
            resultId INTEGER PRIMARY KEY,
            raceId INTEGER,
            driverId INTEGER,
            driverName TEXT,
            driverCode TEXT,
            nationality TEXT,
            constructorId INTEGER,
            constructorName TEXT,
            number TEXT,
            grid TEXT,
            position TEXT,
            positionText TEXT,
            positionOrder INTEGER,
            points REAL,
            laps INTEGER,
            time TEXT,
            milliseconds TEXT,
            fastestLap TEXT,
            fastestLapRank TEXT,
            fastestLapTime TEXT,
            fastestLapSpeed TEXT,
            status TEXT
        )"""
    )
    conn.executemany(
        "INSERT INTO race_results VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        results,
    )
    conn.commit()
    conn.close()
    print(f"✅ Created race_results table with {len(results)} results.")


if __name__ == "__main__":
    build_results_database()
