import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import DriverCard from "./DriverCard";
import { Link } from "react-router-dom";

export default function GridPage() {
  const [drivers, setDrivers] = useState([]);
  const [teamStandings, setTeamStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("drivers"); // "drivers" | "teams"

  useEffect(() => {
    Promise.all([
      fetch("/api/drivers").then((r) => r.json()),
      fetch("/api/team-standings").then((r) => r.json()),
    ])
      .then(([driverData, teamData]) => {
        setDrivers(driverData);
        if (!teamData.error) setTeamStandings(teamData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch data:", err);
        setLoading(false);
      });
  }, []);

  // Team accent colors
  const teamColors = {
    "Red Bull Racing": "#3671C6",
    "McLaren": "#FF8700",
    "Ferrari": "#E8002D",
    "Mercedes": "#27F4D2",
    "Aston Martin": "#229971",
    "Alpine": "#FF87BC",
    "Sauber": "#52E252",
    "Red Bull Racing (VCARB)": "#6692FF",
    "Racing Bulls": "#6692FF",
    "Haas F1 Team": "#B6BABD",
    "Haas": "#B6BABD",
    "Williams": "#64C4FF",
    "Cadillac": "#FFD700",
    "Audi": "#52E252",
  };

  // Sort drivers by team standing, then by individual position within each team
  const sortedDrivers = [...drivers].sort((a, b) => {
    const tpA = a.team_position ? parseInt(a.team_position) : 999;
    const tpB = b.team_position ? parseInt(b.team_position) : 999;
    if (tpA !== tpB) return tpA - tpB;
    const pA = a.position ? parseFloat(a.position) : 999;
    const pB = b.position ? parseFloat(b.position) : 999;
    return pA - pB;
  });

  // Group drivers by team for visual separation
  const teamGroups = [];
  let currentTeam = null;
  sortedDrivers.forEach((driver) => {
    if (driver.team !== currentTeam) {
      currentTeam = driver.team;
      teamGroups.push({ team: driver.team, drivers: [driver] });
    } else {
      teamGroups[teamGroups.length - 1].drivers.push(driver);
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-20 px-6 md:px-12 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-on-surface-variant/60 hover:text-primary transition-colors font-label text-sm"
            >
              <span className="material-symbols-outlined text-base">
                arrow_back
              </span>
              Back to Home
            </Link>
            <Link
              to="/drivers"
              className="inline-flex items-center gap-2 text-on-surface-variant/60 hover:text-primary transition-colors font-label text-sm ml-2 px-4 py-1.5 rounded-full border border-outline-variant/30 hover:border-primary/50"
            >
              <span className="material-symbols-outlined text-base">
                leaderboard
              </span>
              View Standings
            </Link>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <span className="label-md inline-block px-4 py-1.5 rounded-full bg-surface-container-high text-primary tracking-widest uppercase text-[0.7rem] font-medium mb-4">
                2026 Season
              </span>
              <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl text-white leading-tight tracking-tight">
                The Grid
              </h1>
              <p className="mt-3 text-on-surface-variant font-body text-lg max-w-xl">
                All 22 drivers grouped by constructor standings order.
              </p>

              {/* View Toggle Buttons */}
              <div className="flex items-center gap-2 mt-5">
                <button
                  onClick={() => setViewMode("drivers")}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-label text-sm font-semibold transition-all duration-300 ${
                    viewMode === "drivers"
                      ? "bg-primary text-on-primary shadow-[0_0_20px_rgba(130,239,92,0.25)]"
                      : "bg-surface-container-high text-on-surface-variant hover:bg-surface-bright"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    person
                  </span>
                  Drivers
                </button>
                <button
                  onClick={() => setViewMode("teams")}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-label text-sm font-semibold transition-all duration-300 ${
                    viewMode === "teams"
                      ? "bg-primary text-on-primary shadow-[0_0_20px_rgba(130,239,92,0.25)]"
                      : "bg-surface-container-high text-on-surface-variant hover:bg-surface-bright"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    groups
                  </span>
                  Teams
                </button>
              </div>
            </div>
            <div className="hidden md:block text-right">
              <span className="text-on-surface-variant/40 font-headline text-7xl font-bold">
                F1
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : viewMode === "teams" ? (
          /* ── Teams Card Grid (2 per row) ─────────────── */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {teamStandings.map((team) => {
              const accent = teamColors[team.team_name] || "#82ef5c";
              const isTop3 = team.position && parseInt(team.position) <= 3;
              return (
                <div
                  key={team.team_name}
                  className="group relative rounded-2xl overflow-hidden bg-surface-container-high border border-outline-variant/30 hover:border-primary/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(130,239,92,0.12)]"
                >
                  {/* Team accent bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1 z-10 opacity-70 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: accent }}
                  />

                  {/* Car image placeholder */}
                  <div className="relative h-40 md:h-48 overflow-hidden bg-gradient-to-br from-surface-container to-background flex items-center justify-center">
                    <div className="text-on-surface-variant/20 font-headline text-6xl font-bold">
                      {team.team_name?.slice(0, 3).toUpperCase()}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container-high via-transparent to-transparent" />
                    {team.position && (
                      <div
                        className="absolute top-3 left-3 z-20 w-9 h-9 rounded-full flex items-center justify-center font-label text-sm font-bold border border-white/10"
                        style={{
                          backgroundColor:
                            { 1: "#FFD700", 2: "#C0C0C0", 3: "#CD7F32" }[
                              parseInt(team.position)
                            ] || "rgba(255,255,255,0.1)",
                          color:
                            parseInt(team.position) <= 3 ? "#131313" : "#fff",
                        }}
                      >
                        P{team.position}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: accent }}
                      />
                      <h3 className="font-headline text-xl text-white font-semibold tracking-tight">
                        {team.team_name}
                      </h3>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span
                        className="font-label text-xs font-bold tracking-[0.15em] uppercase px-3 py-1 rounded-lg"
                        style={{
                          backgroundColor: `${accent}20`,
                          color: accent,
                        }}
                      >
                        Constructor
                      </span>
                      <span
                        className={`font-headline text-2xl font-bold ${
                          isTop3 ? "text-white" : "text-on-surface-variant/70"
                        }`}
                      >
                        {team.points}{" "}
                        <span className="text-sm font-label text-on-surface-variant/50">
                          PTS
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Driver Grid sorted by Team Standings ──── */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
            {sortedDrivers.map((driver) => (
              <DriverCard key={driver.driverId} driver={driver} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
