import React from "react";
import { Link } from "react-router-dom";

export default function DriverCard({ driver }) {
  const imgSrc = `/images/${driver.code}.png`;

  // Map team names to accent colors
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
    "Haas": "#B6BABD",
    "Haas F1 Team": "#B6BABD",
    "Williams": "#64C4FF",
    "Cadillac": "#FFD700",
    "Audi": "#52E252",
  };

  // Position badge colors
  const posColors = { 1: "#FFD700", 2: "#C0C0C0", 3: "#CD7F32" };

  const accentColor = teamColors[driver.team] || "#82ef5c";

  return (
    <div className="group relative rounded-2xl overflow-hidden bg-surface-container-high border border-outline-variant/30 hover:border-primary/50 transition-all duration-500 hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(130,239,92,0.15)] cursor-pointer">
      {/* Team accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 z-10 opacity-70 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: accentColor }}
      />

      {/* Driver Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-b from-surface-container to-background">
        <img
          src={imgSrc}
          alt={driver.full_name}
          className="w-full h-full object-cover object-top grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
          onError={(e) => {
            e.target.src = "/images/PLACEHOLDER.png";
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-high via-surface-container-high/40 to-transparent" />

        {/* Position badge */}
        {driver.position != null && (
          <div
            className="absolute top-3 left-3 z-20 w-8 h-8 rounded-full flex items-center justify-center font-label text-xs font-bold border border-white/10"
            style={{
              backgroundColor: posColors[driver.position] || "rgba(255,255,255,0.1)",
              color: driver.position <= 3 ? "#131313" : "#fff",
            }}
          >
            P{driver.position}
          </div>
        )}

        {/* Number badge */}
        {driver.number && (
          <div className="absolute top-3 right-3 text-white/20 font-headline text-5xl font-bold leading-none group-hover:text-white/30 transition-colors duration-500">
            {driver.number}
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="relative p-4 pt-2 -mt-8 z-10">
        {/* Team badge */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: accentColor }}
          />
          <span className="text-[0.65rem] uppercase tracking-[0.15em] font-label font-medium text-on-surface-variant/70 truncate">
            {driver.team}
          </span>
        </div>

        {/* Name */}
        <h3 className="font-headline text-lg text-white font-semibold leading-tight tracking-tight">
          {driver.full_name}
        </h3>

        {/* Code + Points */}
        <div className="flex items-center justify-between mt-2">
          <span
            className="font-label text-xs font-bold tracking-[0.2em] px-2 py-0.5 rounded-md"
            style={{
              backgroundColor: `${accentColor}20`,
              color: accentColor,
            }}
          >
            {driver.code}
          </span>
          {driver.points != null ? (
            <span className="text-[0.7rem] text-on-surface-variant/80 font-label font-semibold">
              {driver.points} PTS
            </span>
          ) : (
            <span className="text-[0.7rem] text-on-surface-variant/60 font-label">
              {driver.nationality}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
