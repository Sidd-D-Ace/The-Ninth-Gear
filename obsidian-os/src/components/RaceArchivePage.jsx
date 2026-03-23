import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import { Link } from "react-router-dom";

/* ─── Simplified circuit silhouette SVG paths ──────────────────────  */
const CIRCUIT_PATHS = {
  albert_park:
    "M30,60 Q35,20 60,30 T90,45 Q95,55 80,70 Q65,80 50,75 Q35,72 30,60Z",
  shanghai:
    "M25,50 L40,20 L55,25 Q70,30 75,50 L70,70 Q60,85 40,80 L25,50Z",
  suzuka:
    "M20,40 Q30,15 50,20 Q70,25 80,45 Q85,60 70,70 Q55,80 35,75 Q20,65 20,40Z",
  miami:
    "M25,35 L45,20 L70,25 L80,40 L75,65 L55,75 L30,70 L25,35Z",
  villeneuve:
    "M30,30 L55,20 L75,30 Q85,45 75,60 L55,75 L35,70 Q20,55 30,30Z",
  monaco:
    "M35,25 L50,15 Q65,20 70,40 Q72,55 60,65 L40,70 Q25,60 30,40 L35,25Z",
  catalunya:
    "M20,50 Q25,20 50,25 Q75,30 85,50 Q90,70 65,80 Q40,85 20,50Z",
  red_bull_ring:
    "M40,20 L65,25 Q80,35 75,55 Q70,70 50,75 L30,65 Q20,45 40,20Z",
  silverstone:
    "M25,40 Q30,15 55,20 Q80,25 85,50 Q88,75 60,80 Q35,82 25,40Z",
  spa:
    "M20,55 Q25,20 50,15 Q75,20 85,45 L80,65 Q65,85 40,80 L20,55Z",
  hungaroring:
    "M30,30 Q50,15 70,25 Q82,40 75,60 Q65,78 45,80 Q25,70 30,30Z",
  zandvoort:
    "M35,25 L55,18 Q72,25 78,45 Q80,65 60,75 L40,72 Q22,60 35,25Z",
  monza:
    "M30,35 L50,18 L72,25 Q82,40 78,60 L60,78 L38,72 Q20,55 30,35Z",
  madring:
    "M25,45 Q30,20 55,22 Q78,25 82,48 Q85,72 58,80 Q32,78 25,45Z",
  baku:
    "M20,30 L35,15 L65,20 Q80,30 78,55 Q75,75 50,80 L25,70 L20,30Z",
  marina_bay:
    "M30,28 Q45,15 65,22 Q80,35 75,55 Q68,75 45,78 Q25,70 30,28Z",
  americas:
    "M22,45 Q28,18 55,20 Q80,22 88,48 Q90,72 60,82 Q30,80 22,45Z",
  rodriguez:
    "M25,38 L48,18 L72,28 Q82,42 78,62 L55,78 L30,72 Q18,55 25,38Z",
  interlagos:
    "M28,50 Q35,20 58,22 Q80,28 82,52 Q82,72 55,80 Q30,78 28,50Z",
  vegas:
    "M30,25 L55,15 L75,28 Q85,42 80,62 L60,78 L35,72 Q22,55 30,25Z",
  losail:
    "M32,30 Q48,15 68,22 Q82,35 78,58 Q72,78 48,80 Q28,72 32,30Z",
  yas_marina:
    "M28,35 L50,18 Q72,22 80,42 Q85,60 70,75 L45,80 Q22,68 28,35Z",
};

/* Fallback generic oval */
const FALLBACK_PATH =
  "M30,50 Q30,20 50,20 Q70,20 70,50 Q70,80 50,80 Q30,80 30,50Z";

function CircuitSilhouette({ circuitRef }) {
  const d = CIRCUIT_PATHS[circuitRef] || FALLBACK_PATH;
  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={d}
        fill="none"
        stroke="#82ef5c"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="drop-shadow-[0_0_8px_rgba(130,239,92,0.4)]"
      />
    </svg>
  );
}

/* ─── Format date: "2026-03-08" → "8 Mar 2026" ──────────────────── */
function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ─── Race Card ──────────────────────────────────────────────────── */
function RaceCard({ race, index }) {
  const isPast =
    new Date(race.date + "T00:00:00") < new Date("2026-03-24T00:00:00");

  return (
    <div
      className={`group relative flex items-stretch rounded-2xl overflow-hidden border transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(130,239,92,0.12)] cursor-pointer ${
        isPast
          ? "bg-surface-container border-outline-variant/20 opacity-70 hover:opacity-100"
          : "bg-surface-container-high border-outline-variant/30 hover:border-primary/40"
      }`}
    >
      {/* Left — Text info */}
      <div className="flex-1 p-5 md:p-6 flex flex-col justify-between min-h-[140px]">
        {/* Round badge */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[0.6rem] font-label font-bold tracking-[0.2em] uppercase text-on-surface-variant/40">
            Round {race.round}
          </span>
          {isPast && (
            <span className="text-[0.55rem] font-label font-bold tracking-[0.15em] uppercase px-2 py-0.5 rounded bg-white/5 text-on-surface-variant/40">
              Completed
            </span>
          )}
        </div>

        {/* Race name */}
        <h3 className="font-headline text-lg md:text-xl text-white font-semibold leading-tight tracking-tight group-hover:text-primary transition-colors">
          {race.name}
        </h3>

        {/* Location + date */}
        <div className="mt-3 flex flex-col gap-1">
          <span className="text-sm text-on-surface-variant/70 font-body">
            {race.location}, {race.country}
          </span>
          <span className="text-xs text-on-surface-variant/50 font-label tracking-wide">
            {formatDate(race.date)}
          </span>
        </div>
      </div>

      {/* Right — Circuit silhouette + code */}
      <div className="relative w-32 md:w-40 flex-shrink-0 flex items-center justify-center p-4">
        {/* Code watermark */}
        <div className="absolute top-3 right-3 font-headline text-2xl md:text-3xl font-bold text-white/10 leading-none group-hover:text-white/20 transition-colors">
          R{String(race.round).padStart(2, "0")}
        </div>

        {/* Circuit SVG */}
        <div className="w-20 h-20 md:w-24 md:h-24 opacity-60 group-hover:opacity-100 transition-opacity duration-500">
          <CircuitSilhouette circuitRef={race.circuitRef} />
        </div>
      </div>

    {/* Bottom section with Predict button if not past */}
      {!isPast && (
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Link
            to={`/races/${race.raceId}/predict`}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-black rounded-full font-label font-bold text-xs uppercase tracking-wider hover:bg-white hover:text-black hover:scale-105 transition-all shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.4)]"
            onClick={(e) => e.stopPropagation()} // Prevent card click if there is one later
          >
            Predict
            <svg
              className="w-3 h-3 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </Link>
        </div>
      )}

      {/* Bottom accent */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-[2px] transition-opacity ${
          isPast ? "bg-white/5" : "bg-primary/40 group-hover:bg-primary/70"
        }`}
      />
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */
export default function RaceArchivePage() {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/races")
      .then((res) => res.json())
      .then((data) => {
        setRaces(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch races:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-20 px-6 md:px-12 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10 space-y-4">
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
                Race Archive
              </h1>
              <p className="mt-3 text-on-surface-variant font-body text-lg max-w-xl">
                All 22 Grands Prix of the 2026 Formula 1 World Championship.
              </p>
            </div>
            <div className="hidden md:block text-right">
              <span className="text-on-surface-variant/40 font-headline text-7xl font-bold">
                F1
              </span>
            </div>
          </div>
        </div>

        {/* Race list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {races.map((race, idx) => {
              const isPast =
                new Date(race.date + "T00:00:00") < new Date("2026-03-24T00:00:00");
              return isPast ? (
                <Link key={race.raceId} to={`/races/${race.raceId}`}>
                  <RaceCard race={race} index={idx} />
                </Link>
              ) : (
                <RaceCard key={race.raceId} race={race} index={idx} />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
