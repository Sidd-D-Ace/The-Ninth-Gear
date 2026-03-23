"""
race_processor.py
Reads races.csv and circuits.csv, filters 2026 races,
joins circuit info, and writes to races.db.
Skips processing if races.db already exists.
"""

import csv
import os
import sqlite3

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE, "DB", "races.db")
RACES_CSV = os.path.join(BASE, "RaceData", "races.csv")
CIRCUITS_CSV = os.path.join(BASE, "RaceData", "circuits.csv")
TARGET_YEAR = 2026


def build_race_database():
    """Build the races.db for the target year."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    if os.path.exists(DB_PATH):
        print(f"⏩ {DB_PATH} already exists — skipping.")
        return

    # --- Load circuits ---
    circuits = {}
    with open(CIRCUITS_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cid = int(row["circuitId"])
            circuits[cid] = {
                "circuitRef": row["circuitRef"],
                "circuitName": row["name"],
                "location": row["location"],
                "country": row["country"],
            }

    # --- Load 2026 races ---
    races = []
    with open(RACES_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if int(row["year"]) != TARGET_YEAR:
                continue
            cid = int(row["circuitId"])
            circ = circuits.get(cid, {})
            races.append(
                (
                    int(row["raceId"]),
                    int(row["round"]),
                    row["name"],
                    row["date"],
                    row["time"].replace("\\N", ""),
                    cid,
                    circ.get("circuitRef", ""),
                    circ.get("circuitName", ""),
                    circ.get("location", ""),
                    circ.get("country", ""),
                )
            )

    races.sort(key=lambda x: x[1])  # sort by round

    # --- Write DB ---
    conn = sqlite3.connect(DB_PATH)
    conn.execute("DROP TABLE IF EXISTS races")
    conn.execute(
        """CREATE TABLE races (
            raceId INTEGER PRIMARY KEY,
            round INTEGER,
            name TEXT,
            date TEXT,
            time TEXT,
            circuitId INTEGER,
            circuitRef TEXT,
            circuitName TEXT,
            location TEXT,
            country TEXT
        )"""
    )
    conn.executemany("INSERT INTO races VALUES (?,?,?,?,?,?,?,?,?,?)", races)
    conn.commit()
    conn.close()
    print(f"✅ Created {DB_PATH} with {len(races)} races for {TARGET_YEAR}.")


if __name__ == "__main__":
    build_race_database()
