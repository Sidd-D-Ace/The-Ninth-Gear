"""
scrape_standings.py
Scrapes the current F1 driver standings from formula1.com
and stores them in the drivers.db SQLite database.
"""

import os
import re
import sqlite3
import requests
import pandas as pd

CSV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "RaceData", "2026_standings.csv")
URL = "https://www.formula1.com/en/results/2026/drivers"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}


def scrape_standings():
    """Scrape F1 standings from formula1.com and save to SQLite."""
    print("Fetching standings from Formula1.com...")
    response = requests.get(URL, headers=HEADERS, timeout=15)
    response.raise_for_status()

    tables = pd.read_html(response.text)
    df = tables[0]
    df = df.dropna(axis=1, how="all")

    # Clean driver names — remove 3-letter code suffix like "George RussellRUS"
    if "Driver" in df.columns:
        df["Driver"] = (
            df["Driver"]
            .str.replace(r"[A-Z]{3}$", "", regex=True)
            .str.replace("\xa0", " ", regex=False)   # non-breaking space → normal space
            .str.strip()
        )

    # Transform and clean
    df = df.rename(columns={"Pos.": "position", "Driver": "driver_name", "Pts.": "points"})
    df = df[["position", "driver_name", "points"]]

    os.makedirs(os.path.dirname(CSV_PATH), exist_ok=True)
    df.to_csv(CSV_PATH, index=False)

    print(f"✅ Saved {len(df)} standings to {CSV_PATH}")
    return df


if __name__ == "__main__":
    df = scrape_standings()
    print("\n--- Current 2026 Driver Standings ---")
    print(df.to_string())
