# The Ninth Gear 🏎️

The Ninth Gear is a modern, responsive, and beautifully designed application dedicated to Formula 1. It provides live driver standings, detailed historical race archives, full race classifications, and an advanced Machine Learning engine that predicts upcoming race outcomes!

## ✨ Features

- **Live Driver Standings**: Real-time standings
- **Race Archive**: Browse all 22 Grands Prix of the 2026 season. View completed race results or predict upcoming races.
- **Detailed Race Classifications**: Dive deep into completed races to see the podium finishers, full driver classification, fastest laps, and DNF analysis.
- **ML Race Predictor**: For upcoming races, our custom-built scikit-learn Random Forest/Gradient Boosting model predicts the podium, full grid finish order, DNF risk, fastest lap, and team points given the driver's historical and circuit-specific pace.

## 🛠️ Tech Stack

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- React Router DOM

**Backend:**
- Python 3.10+
- FastAPI (REST API)
- SQLite3 (Lightweight data caching)
- Pandas (Web scraping & data manipulation)
- Scikit-Learn (Machine learning prediction models)

## 📁 Directory Structure

```plaintext
The-Ninth-Gear/
├── app.py                   # FastAPI backend application
├── scrape_standings.py      # Python script to scrape live F1 driver standings
├── DB/                      # SQLite databases (auto-generated)
│   ├── drivers.db           # Stores driver profiles
│   └── races.db             # Stores historical F1 race results & ML predictions
├── RaceData/                # Static CSV tracking data from F1
│   ├── 2026_standings.csv   # Scraped live standings
│   ├── results.csv
│   ├── qualifying.csv
│   ├── lap_times.csv
│   └── ...
├── processor/               # Python processing scripts for ML and DB generation
│   ├── race_predictor.py    # Gradient Boosting ML prediction script
│   ├── data_processor.py    # Generates drivers.db
│   ├── race_processor.py    # Generates race schedules
│   └── result_processor.py  # Merges race results
└── obsidian-os/             # Frontend React application
    ├── index.html
    ├── tailwind.config.js
    └── src/                 # React components and pages
```

## 🚀 How to Run Locally

### 1. Start the Backend API

Make sure you have Python installed, then install the required dependencies:

```bash
# Install Python dependencies
pip install fastapi uvicorn pandas requests scikit-learn numpy 

# Start the FastAPI server on port 8000
uvicorn app:app --reload --host 127.0.0.1 --port 8000
```
*Note: The backend will automatically create the `DB/` folder and generate SQLite databases (`drivers.db`, `races.db`) out of the `RaceData` CSVs the very first time you boot the API.*

### 2. Run the Web Scraper (Optional)

To ensure you have the latest 2026 Driver standings:

```bash
python scrape_standings.py
```

### 3. Start the Frontend React App

In a new terminal instance, navigate to the frontend folder and start Vite:

```bash
# Navigate to the frontend directory
cd obsidian-os

# Install dependencies (only needed once)
npm install

# Start the development server
npm run dev
```

Visit `http://localhost:5173` (or the port Vite provides) in your browser to see The Ninth Gear!

## 🤖 How the ML Predictor Works

The prediction engine (`processor/race_predictor.py`) trains a Gradient Boosting Regressor across **27,000+ historical F1 race records**. It engineers 12 specific features to make its predictions:
1. **Recent Form**: Average / best finishing position over the last 5-10 races.
2. **Circuit History**: Driver's historical average and best finishes at the specific Grand Prix circuit.
3. **Pace & Momentum**: Points gathered in the last 5 races and consistency metric (StdDev).
4. **Qualifying Pace**: Average grid position and grid-to-finish place delta (places gained/lost on Sunday).
5. **Reliability**: Historical DNF rate adjusted by recent crashes.

*The model outputs a confidence score for each prediction and accurately simulates constructor battles.*
