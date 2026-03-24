"""
app.py — FastAPI backend for F1 driver data.
Serves driver records and live standings from SQLite.
Automatically runs data_processor if the database doesn't exist yet.
"""

import os
import csv
import sqlite3
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "DB", "drivers.db")
STANDINGS_CSV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "RaceData", "2026_standings.csv")
TEAM_STANDINGS_CSV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "RaceData", "2026_team_standings.csv")

app = FastAPI(title="The Ninth Gear — Drivers API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _ensure_db():
    """If the database doesn't exist, run the data processor to create it."""
    if not os.path.exists(DB_PATH):
        from processor.data_processor import build_database
        build_database()


def _get_connection():
    _ensure_db()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# Map scraped names → our DB display names (handles mismatches)
STANDINGS_NAME_ALIASES = {
    "Carlos Sainz": "Carlos Sainz Jr.",
    "Alexander Albon": "Alex Albon",
    "Nico Hulkenberg": "Nico Hülkenberg",
    "Sergio Perez": "Sergio Pérez",
}

# Map scraped team names → our DB team names
TEAM_NAME_ALIASES = {
    "Haas F1 Team": "Haas",
    "Red Bull Racing (VCARB)": "Racing Bulls",
}


@app.get("/api/drivers")
def get_drivers():
    """Return all 22 drivers, enriched with standings data if available."""
    conn = _get_connection()
    drivers = [dict(row) for row in conn.execute("SELECT * FROM drivers").fetchall()]
    conn.close()

    # Merge standings if available
    if os.path.exists(STANDINGS_CSV_PATH):
        with open(STANDINGS_CSV_PATH, "r", encoding="utf-8") as f:
            standings_rows = list(csv.DictReader(f))
            
        # Build a lookup: map both original scraped name AND aliased name
        standings_map = {}
        for s in standings_rows:
            name = s.get("driver_name", "").strip()
            standings_map[name] = s
            # Also map through alias
            alias = STANDINGS_NAME_ALIASES.get(name)
            if alias:
                standings_map[alias] = s

        for d in drivers:
            match = standings_map.get(d["full_name"])
            if match:
                d["position"] = match.get("position")
                d["points"] = match.get("points")
            else:
                d["position"] = None
                d["points"] = None

        # Sort by position (drivers without standings go last)
        drivers.sort(key=lambda x: (x["position"] is None, float(x["position"]) if str(x["position"]).replace('.','',1).isdigit() else 999))

    # Merge team standings position
    if os.path.exists(TEAM_STANDINGS_CSV_PATH):
        with open(TEAM_STANDINGS_CSV_PATH, "r", encoding="utf-8") as f:
            team_rows = list(csv.DictReader(f))
        # Build lookup: scraped team name → position (also map aliases)
        team_pos_map = {}
        for t in team_rows:
            tname = t.get("team_name", "").strip()
            team_pos_map[tname] = t.get("position")
            alias = TEAM_NAME_ALIASES.get(tname)
            if alias:
                team_pos_map[alias] = t.get("position")
        for d in drivers:
            d["team_position"] = team_pos_map.get(d["team"])

    return drivers


@app.get("/api/standings")
def get_standings():
    """Return raw standings table from scraped CSV data."""
    if not os.path.exists(STANDINGS_CSV_PATH):
        return {"error": "No standings data. Run scrape_standings.py first."}

    with open(STANDINGS_CSV_PATH, "r", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    
    return rows


@app.get("/api/team-standings")
def get_team_standings():
    """Return team (constructor) standings from scraped CSV data."""
    if not os.path.exists(TEAM_STANDINGS_CSV_PATH):
        return {"error": "No team standings data. Run scrape_standings.py first."}

    with open(TEAM_STANDINGS_CSV_PATH, "r", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    return rows


@app.post("/api/standings/refresh")
def refresh_standings():
    """Trigger a fresh scrape of standings data (drivers + teams)."""
    try:
        from scrape_standings import scrape_standings, scrape_team_standings
        df = scrape_standings()
        tdf = scrape_team_standings()
        return {"status": "ok", "driver_count": len(df), "team_count": len(tdf)}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ── Race Archive ────────────────────────────────────────

RACE_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "DB", "races.db")


def _ensure_race_db():
    if not os.path.exists(RACE_DB_PATH):
        from processor.race_processor import build_race_database
        build_race_database()


@app.get("/api/races")
def get_races():
    """Return all 2026 races with circuit info."""
    _ensure_race_db()
    conn = sqlite3.connect(RACE_DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute("SELECT * FROM races ORDER BY round").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def _ensure_results_table():
    """Build race_results table if it doesn't exist."""
    conn = sqlite3.connect(RACE_DB_PATH)
    cur = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='race_results'"
    )
    exists = cur.fetchone() is not None
    conn.close()
    if not exists:
        from processor.result_processor import build_results_database
        build_results_database()


@app.get("/api/races/{race_id}/results")
def get_race_results(race_id: int):
    """Return race info + full results for a specific race."""
    _ensure_race_db()
    _ensure_results_table()
    conn = sqlite3.connect(RACE_DB_PATH)
    conn.row_factory = sqlite3.Row

    # Get race info
    race = conn.execute("SELECT * FROM races WHERE raceId = ?", (race_id,)).fetchone()
    if not race:
        conn.close()
        return {"error": "Race not found"}

    # Get results
    results = conn.execute(
        "SELECT * FROM race_results WHERE raceId = ? ORDER BY positionOrder",
        (race_id,),
    ).fetchall()
    conn.close()

    return {
        "race": dict(race),
        "results": [dict(r) for r in results],
    }


@app.get("/api/races/{race_id}/predict")
def get_predicted_results(race_id: int, force: bool = False):
    """Return ML-predicted race outcomes."""
    _ensure_race_db()
    
    # Verify race exists
    conn = sqlite3.connect(RACE_DB_PATH)
    race = conn.execute("SELECT 1 FROM races WHERE raceId = ?", (race_id,)).fetchone()
    conn.close()
    
    if not race:
        return {"error": "Race not found"}

    from processor.race_predictor import get_prediction
    prediction = get_prediction(race_id, force=force)
    
    if "error" in prediction:
        return prediction

    return {"prediction": prediction}
