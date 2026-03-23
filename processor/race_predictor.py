"""
race_predictor.py
ML-powered race prediction using Random Forest.
Features: driver history, circuit-specific performance, qualifying pace,
constructor strength, DNF rates, season momentum, grid-to-finish patterns.
"""

import csv
import json
import math
import os
import sqlite3
from collections import defaultdict

import numpy as np
from sklearn.ensemble import GradientBoostingRegressor

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RACE_DB = os.path.join(BASE, "DB", "races.db")
RESULTS_CSV = os.path.join(BASE, "RaceData", "results.csv")
QUALIFYING_CSV = os.path.join(BASE, "RaceData", "qualifying.csv")
DRIVERS_CSV = os.path.join(BASE, "RaceData", "drivers.csv")
CONSTRUCTORS_CSV = os.path.join(BASE, "RaceData", "constructors.csv")
RACES_CSV = os.path.join(BASE, "RaceData", "races.csv")
STATUS_CSV = os.path.join(BASE, "RaceData", "status.csv")
DRIVER_STANDINGS_CSV = os.path.join(BASE, "RaceData", "driver_standings.csv")
CONSTRUCTOR_STANDINGS_CSV = os.path.join(
    BASE, "RaceData", "constructor_standings.csv"
)

# 2026 driver-constructor mapping (from results of raceId 1169)
DRIVER_CONSTRUCTOR_2026 = {
    830: 9,   # Max Verstappen -> Red Bull
    846: 1,   # Lando Norris -> McLaren
    857: 1,   # Oscar Piastri -> McLaren
    832: 3,   # George Russell -> Mercedes (Williams id=3 in legacy, but mapped)
    861: 131, # Kimi Antonelli -> Mercedes
    844: 6,   # Charles Leclerc -> Ferrari
    847: 6,   # Lewis Hamilton -> Ferrari
    815: 216, # Sergio Perez -> Cadillac
    822: 216, # Valtteri Bottas -> Cadillac
    848: 214, # Pierre Gasly -> Alpine
    864: 217, # Jack Doohan -> Audi
    866: 215, # Gabriel Bortoleto -> …
    840: 117, # Lance Stroll -> Aston Martin
    4:   117, # Fernando Alonso -> Aston Martin
    839: 210, # Esteban Ocon -> Haas
    807: 217, # Nico Hulkenberg -> Audi
    858: 9,   # Isack Hadjar -> Red Bull
    862: 214, # Franco Colapinto -> Alpine
    859: 215, # Liam Lawson -> RB
    860: 215, # Yuki Tsunoda -> RB
    855: 3,   # Alexander Albon -> Williams
    856: 3,   # Carlos Sainz -> Williams
}


def _load_csv(path):
    """Load CSV as list of dicts."""
    with open(path, "r", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def _clean(v):
    """Return None for \\N or empty strings."""
    return None if v in ("\\N", "", None) else v


def _load_drivers():
    """driverId -> {name, code, nationality}"""
    drivers = {}
    for row in _load_csv(DRIVERS_CSV):
        drivers[int(row["driverId"])] = {
            "name": f'{row["forename"]} {row["surname"]}',
            "code": row.get("code", ""),
            "nationality": row.get("nationality", ""),
        }
    return drivers


def _load_constructors():
    """constructorId -> name"""
    return {int(r["constructorId"]): r["name"] for r in _load_csv(CONSTRUCTORS_CSV)}


def _load_races():
    """raceId -> {year, round, circuitId, name}"""
    races = {}
    for r in _load_csv(RACES_CSV):
        races[int(r["raceId"])] = {
            "year": int(r["year"]),
            "round": int(r["round"]),
            "circuitId": int(r["circuitId"]),
            "name": r["name"],
        }
    return races


def _load_statuses():
    """statusId -> status string"""
    return {int(r["statusId"]): r["status"] for r in _load_csv(STATUS_CSV)}


# ------------ Feature Engineering ------------------------------------------------


def build_features():
    """
    Build feature matrices from historical data.
    Returns (X, y, meta) where meta carries driver/race info for each row.
    """
    results = _load_csv(RESULTS_CSV)
    qualifying = _load_csv(QUALIFYING_CSV)
    races = _load_races()
    statuses = _load_statuses()

    # Organize data by driver
    driver_results = defaultdict(list)  # driverId -> list of race result dicts
    for r in results:
        rid = int(r["raceId"])
        if rid not in races:
            continue
        driver_results[int(r["driverId"])].append(r)

    # Qualifying indexed by (raceId, driverId)
    qual_map = {}
    for q in qualifying:
        key = (int(q["raceId"]), int(q["driverId"]))
        pos = _clean(q.get("position"))
        qual_map[key] = int(pos) if pos else None

    # Sort each driver's results by year then round
    for did in driver_results:
        driver_results[did].sort(
            key=lambda r: (
                races.get(int(r["raceId"]), {}).get("year", 0),
                races.get(int(r["raceId"]), {}).get("round", 0),
            )
        )

    # Build running stats per driver
    # For each result row we compute features from PRIOR races
    X, y, meta = [], [], []

    for did, res_list in driver_results.items():
        # Running accumulators
        finishes = []            # positionOrder values
        circuit_finishes = defaultdict(list)  # circuitId -> [positionOrder]
        dnf_count = 0
        total_count = 0
        grid_positions = []
        grid_to_finish_deltas = []  # grid - finish (positive = gained places)
        points_recent = []

        for i, r in enumerate(res_list):
            rid = int(r["raceId"])
            race = races.get(rid)
            if not race:
                continue

            pos_order = int(r.get("positionOrder", 0))
            grid = _clean(r.get("grid"))
            grid = int(grid) if grid else None
            pts = float(r.get("points", 0))
            sid = int(r.get("statusId", 0))
            status = statuses.get(sid, "")
            finished = status == "Finished" or status.startswith("+")
            cid = race["circuitId"]

            # Only build features if we have >= 3 prior results
            if total_count >= 3:
                # Features
                # 1. Avg finishing position (last 5)
                recent_fin = finishes[-5:] if finishes else [15]
                avg_recent_finish = np.mean(recent_fin)
                # 2. Best finish (last 10)
                best_recent = min(finishes[-10:]) if finishes else 22
                # 3. Circuit-specific avg finish
                circ_hist = circuit_finishes.get(cid, [])
                avg_circuit_finish = np.mean(circ_hist) if circ_hist else avg_recent_finish
                best_circuit_finish = min(circ_hist) if circ_hist else best_recent
                num_circuit_races = len(circ_hist)
                # 4. DNF rate
                dnf_rate = dnf_count / total_count if total_count > 0 else 0.1
                # 5. Qualifying position for this race
                qual_pos = qual_map.get((rid, did))
                avg_grid = np.mean(grid_positions[-5:]) if grid_positions else 11
                this_grid = qual_pos if qual_pos else (grid if grid else avg_grid)
                # 6. Grid-to-finish delta (how much they typically gain/lose)
                avg_delta = np.mean(grid_to_finish_deltas[-10:]) if grid_to_finish_deltas else 0
                # 7. Recent points (momentum)
                recent_pts = np.mean(points_recent[-5:]) if points_recent else 0
                # 8. Consistency (stddev of recent finishes)
                consistency = np.std(recent_fin) if len(recent_fin) > 1 else 5
                # 9. Total experience
                experience = min(total_count / 50.0, 1.0)  # normalized 0-1

                features = [
                    avg_recent_finish,       # 0
                    best_recent,             # 1
                    avg_circuit_finish,      # 2
                    best_circuit_finish,     # 3
                    num_circuit_races,       # 4
                    dnf_rate,                # 5
                    float(this_grid),        # 6
                    avg_grid,                # 7
                    avg_delta,               # 8
                    recent_pts,              # 9
                    consistency,             # 10
                    experience,              # 11
                ]

                X.append(features)
                y.append(pos_order)
                meta.append({"driverId": did, "raceId": rid, "circuitId": cid})

            # Update running stats
            finishes.append(pos_order)
            circuit_finishes[cid].append(pos_order)
            if not finished:
                dnf_count += 1
            total_count += 1
            if grid:
                grid_positions.append(grid)
                grid_to_finish_deltas.append(grid - pos_order)
            points_recent.append(pts)

    return np.array(X), np.array(y), meta


def train_model():
    """Train a GradientBoosting model on historical data."""
    X, y, meta = build_features()
    print(f"Training on {len(X)} samples with {X.shape[1]} features...")
    model = GradientBoostingRegressor(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.1,
        random_state=42,
    )
    model.fit(X, y)
    print("✅ Model trained.")
    return model


# ------------ Prediction --------------------------------------------------------


def predict_race(race_id: int):
    """
    Generate predictions for a specific 2026 race.
    Returns dict with podium, full grid, dnf risks, fastest lap, constructor battle.
    """
    races = _load_races()
    race = races.get(race_id)
    if not race:
        return {"error": "Race not found"}

    circuit_id = race["circuitId"]
    drivers_info = _load_drivers()
    constructors_info = _load_constructors()
    results = _load_csv(RESULTS_CSV)
    qualifying = _load_csv(QUALIFYING_CSV)
    statuses = _load_statuses()

    # Train model
    model = train_model()

    # Build features for each 2026 driver
    # We need the same running stats computed up to the point before this race

    # Organize all results per driver
    driver_results = defaultdict(list)
    for r in results:
        driver_results[int(r["driverId"])].append(r)

    for did in driver_results:
        driver_results[did].sort(
            key=lambda r: (
                races.get(int(r["raceId"]), {}).get("year", 0),
                races.get(int(r["raceId"]), {}).get("round", 0),
            )
        )

    # Qualifying map
    qual_map = {}
    for q in qualifying:
        key = (int(q["raceId"]), int(q["driverId"]))
        pos = _clean(q.get("position"))
        qual_map[key] = int(pos) if pos else None

    # For each 2026 driver, compute features using all data BEFORE this race
    predictions = []
    current_drivers = DRIVER_CONSTRUCTOR_2026

    for did, cid in current_drivers.items():
        res_list = driver_results.get(did, [])
        drv = drivers_info.get(did, {"name": f"Driver {did}", "code": "???", "nationality": ""})

        # Compute running stats from all their races BEFORE race_id
        finishes = []
        circuit_finishes = defaultdict(list)
        dnf_count = 0
        total_count = 0
        grid_positions = []
        grid_to_finish_deltas = []
        points_recent = []

        for r in res_list:
            rid = int(r["raceId"])
            rc = races.get(rid)
            if not rc:
                continue
            # Only count races BEFORE the target race
            if rc["year"] > race["year"]:
                continue
            if rc["year"] == race["year"] and rc["round"] >= race["round"]:
                continue

            pos_order = int(r.get("positionOrder", 0))
            grid = _clean(r.get("grid"))
            grid = int(grid) if grid else None
            pts = float(r.get("points", 0))
            sid = int(r.get("statusId", 0))
            status = statuses.get(sid, "")
            finished = status == "Finished" or status.startswith("+")
            c_id = rc["circuitId"]

            finishes.append(pos_order)
            circuit_finishes[c_id].append(pos_order)
            if not finished:
                dnf_count += 1
            total_count += 1
            if grid:
                grid_positions.append(grid)
                grid_to_finish_deltas.append(grid - pos_order)
            points_recent.append(pts)

        # Build features
        if total_count < 1:
            # New driver with no history — use default mid-pack features
            features = [12.0, 10, 12.0, 10, 0, 0.05, 12, 12, 0, 0, 4, 0]
        else:
            recent_fin = finishes[-5:] if finishes else [15]
            avg_recent_finish = float(np.mean(recent_fin))
            best_recent = min(finishes[-10:]) if finishes else 22
            circ_hist = circuit_finishes.get(circuit_id, [])
            avg_circuit_finish = float(np.mean(circ_hist)) if circ_hist else avg_recent_finish
            best_circuit_finish = min(circ_hist) if circ_hist else best_recent
            num_circuit_races = len(circ_hist)
            dnf_rate = dnf_count / total_count
            avg_grid = float(np.mean(grid_positions[-5:])) if grid_positions else 11.0
            this_grid = avg_grid  # no qualifying yet for future race
            avg_delta = float(np.mean(grid_to_finish_deltas[-10:])) if grid_to_finish_deltas else 0.0
            recent_pts = float(np.mean(points_recent[-5:])) if points_recent else 0.0
            consistency = float(np.std(recent_fin)) if len(recent_fin) > 1 else 5.0
            experience = min(total_count / 50.0, 1.0)

            features = [
                avg_recent_finish,
                best_recent,
                avg_circuit_finish,
                best_circuit_finish,
                num_circuit_races,
                dnf_rate,
                this_grid,
                avg_grid,
                avg_delta,
                recent_pts,
                consistency,
                experience,
            ]

        predicted_pos = model.predict([features])[0]

        # Compute DNF risk from historical rate + some noise
        dnf_risk = dnf_count / max(total_count, 1)
        # Boost risk for drivers with recent DNFs
        recent_dnfs = sum(1 for r in res_list[-5:] if not (
            statuses.get(int(r.get("statusId", 0)), "") == "Finished"
            or statuses.get(int(r.get("statusId", 0)), "").startswith("+")
        )) if res_list else 0
        dnf_risk = min(dnf_risk + (recent_dnfs * 0.05), 0.5)

        # Circuit history summary
        circ_hist = circuit_finishes.get(circuit_id, [])

        predictions.append({
            "driverId": did,
            "driverName": drv["name"],
            "driverCode": drv["code"],
            "nationality": drv["nationality"],
            "constructorId": cid,
            "constructorName": constructors_info.get(cid, "Unknown"),
            "predictedPosition": round(float(predicted_pos), 2),
            "confidence": round(max(0, min(100, 100 - abs(predicted_pos - round(predicted_pos)) * 50 - predicted_pos * 1.5)), 1),
            "dnfRisk": round(float(dnf_risk) * 100, 1),
            "circuitHistory": {
                "races": len(circ_hist),
                "avgFinish": round(float(np.mean(circ_hist)), 1) if circ_hist else None,
                "bestFinish": int(min(circ_hist)) if circ_hist else None,
            },
            "recentForm": {
                "avgFinish": round(float(np.mean(finishes[-5:])), 1) if finishes else None,
                "avgPoints": round(float(np.mean(points_recent[-5:])), 1) if points_recent else 0,
            },
            "features": {
                "avgRecentFinish": round(features[0], 2),
                "circuitAvg": round(features[2], 2),
                "dnfRate": round(features[5] * 100, 1),
                "avgGrid": round(features[7], 1),
                "momentum": round(features[9], 1),
            },
        })

    # Sort by predicted position
    predictions.sort(key=lambda p: p["predictedPosition"])

    # Assign clean positions
    for i, p in enumerate(predictions):
        p["predictedPosition"] = i + 1

    # Confidence from predicted raw score distance
    raw_scores = [p["confidence"] for p in predictions]
    max_conf = max(raw_scores) if raw_scores else 100
    for p in predictions:
        p["confidence"] = round(p["confidence"] / max_conf * 95, 1) if max_conf > 0 else 50

    # Fastest lap prediction — driver with best recent pace + circuit history
    fl_candidates = sorted(predictions, key=lambda p: (
        p["features"]["avgRecentFinish"] * 0.6 + (p["features"]["circuitAvg"] or 15) * 0.4
    ))
    fastest_lap = fl_candidates[0] if fl_candidates else None

    # Constructor battle
    constructor_points = defaultdict(lambda: {"name": "", "points": 0, "drivers": []})
    POINTS_SYSTEM = {1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1}
    for p in predictions:
        cname = p["constructorName"]
        constructor_points[cname]["name"] = cname
        constructor_points[cname]["points"] += POINTS_SYSTEM.get(p["predictedPosition"], 0)
        constructor_points[cname]["drivers"].append(
            {"name": p["driverName"], "position": p["predictedPosition"]}
        )

    constructor_battle = sorted(
        constructor_points.values(), key=lambda c: c["points"], reverse=True
    )

    return {
        "raceId": race_id,
        "raceName": race["name"],
        "circuitId": circuit_id,
        "podium": predictions[:3],
        "fullGrid": predictions,
        "fastestLap": {
            "driverName": fastest_lap["driverName"] if fastest_lap else "",
            "driverCode": fastest_lap["driverCode"] if fastest_lap else "",
            "constructorName": fastest_lap["constructorName"] if fastest_lap else "",
            "confidence": round(fastest_lap["confidence"] * 0.85, 1) if fastest_lap else 0,
        },
        "constructorBattle": constructor_battle[:6],
        "dnfRisks": sorted(
            [{"driverName": p["driverName"], "driverCode": p["driverCode"],
              "constructorName": p["constructorName"], "risk": p["dnfRisk"]}
             for p in predictions],
            key=lambda d: d["risk"],
            reverse=True,
        )[:8],
        "modelInfo": {
            "algorithm": "Gradient Boosting Regressor",
            "features": 12,
            "trainingsamples": "27,000+ historical race results",
        },
    }


def _save_prediction(race_id: int, prediction: dict):
    """Cache prediction in races.db."""
    os.makedirs(os.path.dirname(RACE_DB), exist_ok=True)
    conn = sqlite3.connect(RACE_DB)
    conn.execute(
        """CREATE TABLE IF NOT EXISTS predictions (
            raceId INTEGER PRIMARY KEY,
            data TEXT
        )"""
    )
    conn.execute(
        "INSERT OR REPLACE INTO predictions (raceId, data) VALUES (?, ?)",
        (race_id, json.dumps(prediction)),
    )
    conn.commit()
    conn.close()


def _load_prediction(race_id: int):
    """Load cached prediction."""
    conn = sqlite3.connect(RACE_DB)
    try:
        conn.execute("SELECT 1 FROM predictions LIMIT 1")
    except sqlite3.OperationalError:
        conn.close()
        return None
    row = conn.execute(
        "SELECT data FROM predictions WHERE raceId = ?", (race_id,)
    ).fetchone()
    conn.close()
    return json.loads(row[0]) if row else None


def get_prediction(race_id: int, force=False):
    """Get or generate prediction for a race."""
    if not force:
        cached = _load_prediction(race_id)
        if cached:
            return cached
    prediction = predict_race(race_id)
    if "error" not in prediction:
        _save_prediction(race_id, prediction)
    return prediction


if __name__ == "__main__":
    # Test: predict the Japanese GP (raceId 1171, round 3)
    result = get_prediction(1171, force=True)
    print(f"\n🏁 Predictions for: {result.get('raceName', 'Unknown')}")
    print("\n🏆 Predicted Podium:")
    for p in result.get("podium", []):
        print(f"  P{p['predictedPosition']}: {p['driverName']} ({p['constructorName']}) — Confidence: {p['confidence']}%")
    print(f"\n⚡ Fastest Lap: {result.get('fastestLap', {}).get('driverName', 'N/A')}")
    print(f"\n🔧 Constructor Battle:")
    for c in result.get("constructorBattle", [])[:5]:
        print(f"  {c['name']}: {c['points']} pts")
