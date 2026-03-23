"""
data_processor.py
Reads RaceData/drivers.csv, filters the 22 current F1 drivers,
and writes them into a SQLite database (drivers.db).
Skips processing entirely if drivers.db already exists.
"""

import csv
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "DB", "drivers.db")
CSV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "RaceData", "drivers.csv")

# ── 2025 season team mappings ──────────────────────────────────────────
TEAM_MAP = {
    "VER": "Red Bull Racing",
    "HAD": "Red Bull Racing",
    "NOR": "McLaren",
    "PIA": "McLaren",
    "LEC": "Ferrari",
    "HAM": "Ferrari",
    "RUS": "Mercedes",
    "ANT": "Mercedes",
    "ALO": "Aston Martin",
    "STR": "Aston Martin",
    "GAS": "Alpine",
    "COL": "Alpine",
    "HUL": "Sauber",
    "BOR": "Sauber",
    "LAW": "Red Bull Racing (VCARB)",
    "LIN": "Red Bull Racing (VCARB)",
    "OCO": "Haas",
    "BEA": "Haas",
    "ALB": "Williams",
    "SAI": "Williams",
    "PER": "Cadillac",
    "BOT": "Cadillac",
}

# ── The 22 drivers we want (exact full_name match) ────────────────────
TARGET_DRIVERS = {
    "Max Verstappen",
    "Isack Hadjar",
    "Lando Norris",
    "Oscar Piastri",
    "Charles Leclerc",
    "Lewis Hamilton",
    "George Russell",
    "Andrea Kimi Antonelli",   # CSV forename is "Andrea Kimi"
    "Fernando Alonso",
    "Lance Stroll",
    "Pierre Gasly",
    "Franco Colapinto",
    "Nico Hülkenberg",
    "Gabriel Bortoleto",
    "Liam Lawson",
    "Arvid Lindblad",
    "Esteban Ocon",
    "Oliver Bearman",
    "Alexander Albon",
    "Carlos Sainz",             # CSV has "Carlos Sainz" (no Jr.)
    "Sergio Pérez",
    "Valtteri Bottas",
}

# Display names (overrides for the UI)
DISPLAY_NAMES = {
    "Andrea Kimi Antonelli": "Kimi Antonelli",
    "Carlos Sainz": "Carlos Sainz Jr.",
    "Alexander Albon": "Alex Albon",
}


def build_database():
    """Read CSV → filter → write SQLite."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("DROP TABLE IF EXISTS drivers")
    cur.execute("""
        CREATE TABLE drivers (
            driverId    INTEGER PRIMARY KEY,
            driverRef   TEXT,
            number      TEXT,
            code        TEXT,
            full_name   TEXT,
            dob         TEXT,
            nationality TEXT,
            team        TEXT,
            url         TEXT
        )
    """)

    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        inserted = 0
        for row in reader:
            full_name = f"{row['forename']} {row['surname']}".strip()
            if full_name not in TARGET_DRIVERS:
                continue

            code = row["code"] if row["code"] != "\\N" else ""
            number = row["number"] if row["number"] != "\\N" else ""
            display_name = DISPLAY_NAMES.get(full_name, full_name)
            team = TEAM_MAP.get(code, "Unknown")

            cur.execute(
                "INSERT INTO drivers VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    int(row["driverId"]),
                    row["driverRef"],
                    number,
                    code,
                    display_name,
                    row["dob"],
                    row["nationality"],
                    team,
                    row["url"],
                ),
            )
            inserted += 1

    conn.commit()
    conn.close()
    print(f"✅ Inserted {inserted} drivers into {DB_PATH}")


if __name__ == "__main__":
    if os.path.exists(DB_PATH):
        print(f"ℹ️  Database already exists at {DB_PATH} — skipping preprocessing.")
    else:
        build_database()
