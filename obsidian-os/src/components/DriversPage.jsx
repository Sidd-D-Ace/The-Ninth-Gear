import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import DriverCard from "./DriverCard";
import { Link } from "react-router-dom";

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"

  useEffect(() => {
    fetch("/api/drivers")
      .then((res) => res.json())
      .then((data) => {
        setDrivers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch drivers:", err);
        setLoading(false);
      });
  }, []);

  // Team accent colors (same as DriverCard)
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-20 px-6 md:px-12 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 space-y-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-on-surface-variant/60 hover:text-primary transition-colors font-label text-sm"
          >
            <span className="material-symbols-outlined text-base">
              arrow_back
            </span>
            Back to Home
          </Link>
          <div className="flex items-end justify-between">
            <div>
              <span className="label-md inline-block px-4 py-1.5 rounded-full bg-surface-container-high text-primary tracking-widest uppercase text-[0.7rem] font-medium mb-4">
                2026 Season
              </span>
              <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl text-white leading-tight tracking-tight">
                The Grid
              </h1>
              <p className="mt-3 text-on-surface-variant font-body text-lg max-w-xl">
                All 22 drivers competing in the 2026 Formula 1 World
                Championship.
              </p>

              {/* View Toggle Buttons */}
              <div className="flex items-center gap-2 mt-5">
                <button
                  onClick={() => setViewMode("list")}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-label text-sm font-semibold transition-all duration-300 ${
                    viewMode === "list"
                      ? "bg-primary text-on-primary shadow-[0_0_20px_rgba(130,239,92,0.25)]"
                      : "bg-surface-container-high text-on-surface-variant hover:bg-surface-bright"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    view_list
                  </span>
                  List View
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-label text-sm font-semibold transition-all duration-300 ${
                    viewMode === "grid"
                      ? "bg-primary text-on-primary shadow-[0_0_20px_rgba(130,239,92,0.25)]"
                      : "bg-surface-container-high text-on-surface-variant hover:bg-surface-bright"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    grid_view
                  </span>
                  Grid View
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
        ) : viewMode === "grid" ? (
          /* ── Grid View ─────────────────────────────────── */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
            {drivers.map((driver) => (
              <DriverCard key={driver.driverId} driver={driver} />
            ))}
          </div>
        ) : (
          /* ── List / Table View ─────────────────────────── */
          <div className="rounded-2xl overflow-hidden border border-outline-variant/30 bg-surface-container">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant/20 bg-surface-container-high/60">
                  <th className="px-5 py-4 font-label text-xs uppercase tracking-[0.15em] text-on-surface-variant/60 font-semibold w-16">
                    Pos
                  </th>
                  <th className="px-5 py-4 font-label text-xs uppercase tracking-[0.15em] text-on-surface-variant/60 font-semibold">
                    Driver
                  </th>
                  <th className="px-5 py-4 font-label text-xs uppercase tracking-[0.15em] text-on-surface-variant/60 font-semibold hidden md:table-cell">
                    Team
                  </th>
                  <th className="px-5 py-4 font-label text-xs uppercase tracking-[0.15em] text-on-surface-variant/60 font-semibold hidden sm:table-cell">
                    Nationality
                  </th>
                  <th className="px-5 py-4 font-label text-xs uppercase tracking-[0.15em] text-on-surface-variant/60 font-semibold text-right">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver, idx) => {
                  const accent =
                    teamColors[driver.team] || "#82ef5c";
                  const isTop3 = driver.position && driver.position <= 3;
                  return (
                    <tr
                      key={driver.driverId}
                      className={`border-b border-outline-variant/10 transition-colors duration-200 hover:bg-surface-container-high/40 group ${
                        isTop3 ? "bg-surface-container-high/20" : ""
                      }`}
                    >
                      {/* Position */}
                      <td className="px-5 py-4">
                        <span
                          className={`font-headline text-lg font-bold ${
                            isTop3 ? "text-primary" : "text-on-surface-variant/50"
                          }`}
                        >
                          {driver.position ?? "–"}
                        </span>
                      </td>

                      {/* Driver */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={`/images/${driver.code}.png`}
                            alt={driver.full_name}
                            className="w-10 h-10 rounded-full object-cover bg-surface-container-high border border-outline-variant/20"
                            onError={(e) => {
                              e.target.src = "/images/PLACEHOLDER.png";
                            }}
                          />
                          <div>
                            <span className="font-body text-white font-semibold text-sm block">
                              {driver.full_name}
                            </span>
                            <span
                              className="font-label text-[0.65rem] font-bold tracking-[0.15em]"
                              style={{ color: accent }}
                            >
                              {driver.code}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Team */}
                      <td className="px-5 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: accent }}
                          />
                          <span className="text-on-surface-variant text-sm font-body">
                            {driver.team}
                          </span>
                        </div>
                      </td>

                      {/* Nationality */}
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <span className="text-on-surface-variant/60 text-sm font-body">
                          {driver.nationality}
                        </span>
                      </td>

                      {/* Points */}
                      <td className="px-5 py-4 text-right">
                        <span
                          className={`font-headline text-lg font-bold ${
                            isTop3
                              ? "text-white"
                              : "text-on-surface-variant/70"
                          }`}
                        >
                          {driver.points ?? "–"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
