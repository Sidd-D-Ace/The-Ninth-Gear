import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "./Navbar";

/* ─── Team accent colors (reuse from DriverCard) ─────────────────── */
const TEAM_COLORS = {
  Mercedes: "#00D2BE",
  Ferrari: "#DC0000",
  "Red Bull": "#3671C6",
  McLaren: "#FF8700",
  "Aston Martin": "#006F62",
  Alpine: "#0090FF",
  Williams: "#005AFF",
  "Racing Bulls": "#6692FF",
  "Haas F1 Team": "#B6BABD",
  Haas: "#B6BABD",
  Sauber: "#52E252",
  Audi: "#52E252",
  Cadillac: "#FFD700",
};

function getTeamColor(name) {
  if (!name) return "#666";
  for (const [key, val] of Object.entries(TEAM_COLORS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return "#666";
}

/* ─── Podium badge colors ───────────────────────────────────────── */
const PODIUM_COLORS = {
  1: { bg: "from-yellow-500/20 to-yellow-600/5", border: "border-yellow-500/40", text: "text-yellow-400", label: "🥇" },
  2: { bg: "from-gray-300/15 to-gray-400/5", border: "border-gray-400/30", text: "text-gray-300", label: "🥈" },
  3: { bg: "from-amber-700/15 to-amber-800/5", border: "border-amber-600/30", text: "text-amber-500", label: "🥉" },
};

/* ─── Format date ────────────────────────────────────────────────── */
function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ─── Podium Card ────────────────────────────────────────────────── */
function PodiumCard({ result, position }) {
  const colors = PODIUM_COLORS[position];
  const teamColor = getTeamColor(result.constructorName);
  const isWinner = position === 1;

  return (
    <div
      className={`relative flex flex-col items-center rounded-2xl border backdrop-blur-sm overflow-hidden transition-all duration-500 hover:scale-[1.03] ${
        colors.border
      } bg-gradient-to-b ${colors.bg} ${isWinner ? "order-1 md:order-2 md:-mt-6" : position === 2 ? "order-2 md:order-1" : "order-3"}`}
      style={{ minHeight: isWinner ? "260px" : "230px" }}
    >
      {/* Position number */}
      <div className={`text-6xl font-headline font-bold mt-5 ${colors.text} opacity-30`}>
        {position}
      </div>

      {/* Medal */}
      <div className="text-3xl -mt-2 mb-2">{colors.label}</div>

      {/* Driver info */}
      <div className="text-center px-4 flex-1 flex flex-col justify-center">
        <h3 className="font-headline text-white text-lg font-bold tracking-tight leading-tight">
          {result.driverName}
        </h3>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: teamColor }}
          />
          <span className="text-xs text-on-surface-variant/70 font-label">
            {result.constructorName}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="w-full px-4 pb-4 mt-3 space-y-1">
        {result.time && (
          <div className="flex justify-between text-xs">
            <span className="text-on-surface-variant/50">Time</span>
            <span className="text-white font-mono text-[0.7rem]">{result.time}</span>
          </div>
        )}
        <div className="flex justify-between text-xs">
          <span className="text-on-surface-variant/50">Points</span>
          <span className={`font-bold ${colors.text}`}>+{result.points}</span>
        </div>
        {result.fastestLapTime && (
          <div className="flex justify-between text-xs">
            <span className="text-on-surface-variant/50">Fastest Lap</span>
            <span className="text-white font-mono text-[0.7rem]">{result.fastestLapTime}</span>
          </div>
        )}
      </div>

      {/* Bottom accent */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl"
        style={{ backgroundColor: teamColor }}
      />
    </div>
  );
}

/* ─── Results Table Row ──────────────────────────────────────────── */
function ResultRow({ result, index }) {
  const teamColor = getTeamColor(result.constructorName);
  const isFinished = result.status === "Finished" || result.status?.startsWith("+");
  const isDNF = !isFinished && !result.status?.startsWith("+");

  return (
    <tr
      className={`border-b border-outline-variant/10 transition-colors hover:bg-white/[0.02] ${
        isDNF ? "opacity-50" : ""
      }`}
    >
      {/* Position */}
      <td className="py-3 px-3 text-center">
        <span className={`font-headline font-bold text-sm ${isDNF ? "text-red-400/70" : "text-white"}`}>
          {isDNF ? result.positionText : result.positionOrder}
        </span>
      </td>

      {/* Driver */}
      <td className="py-3 px-3">
        <div>
          <span className="text-white font-medium text-sm">{result.driverName}</span>
          {result.driverCode && (
            <span className="ml-2 text-[0.6rem] text-primary/70 font-label font-bold tracking-wider">
              {result.driverCode}
            </span>
          )}
        </div>
      </td>

      {/* Team */}
      <td className="py-3 px-3 hidden md:table-cell">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: teamColor }} />
          <span className="text-on-surface-variant/70 text-xs">{result.constructorName}</span>
        </div>
      </td>

      {/* Grid */}
      <td className="py-3 px-3 text-center hidden sm:table-cell">
        <span className="text-on-surface-variant/60 text-xs font-mono">{result.grid || "-"}</span>
      </td>

      {/* Laps */}
      <td className="py-3 px-3 text-center hidden sm:table-cell">
        <span className="text-on-surface-variant/60 text-xs font-mono">{result.laps}</span>
      </td>

      {/* Time / Status */}
      <td className="py-3 px-3 text-right">
        {result.time ? (
          <span className="text-white font-mono text-xs">{result.time}</span>
        ) : (
          <span className={`text-xs font-label ${isDNF ? "text-red-400/70" : "text-on-surface-variant/50"}`}>
            {result.status}
          </span>
        )}
      </td>

      {/* Fastest Lap */}
      <td className="py-3 px-3 text-right hidden lg:table-cell">
        {result.fastestLapTime ? (
          <span
            className={`font-mono text-xs ${
              result.fastestLapRank === "1" ? "text-purple-400" : "text-on-surface-variant/60"
            }`}
          >
            {result.fastestLapTime}
            {result.fastestLapRank === "1" && " ⚡"}
          </span>
        ) : (
          <span className="text-on-surface-variant/30 text-xs">-</span>
        )}
      </td>

      {/* Points */}
      <td className="py-3 px-3 text-right">
        <span
          className={`font-bold text-xs ${
            result.points > 0 ? "text-primary" : "text-on-surface-variant/30"
          }`}
        >
          {result.points > 0 ? `+${result.points}` : "-"}
        </span>
      </td>
    </tr>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */
export default function RaceDetailPage() {
  const { raceId } = useParams();
  const [race, setRace] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/races/${raceId}/results`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.error(data.error);
        } else {
          setRace(data.race);
          setResults(data.results || []);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch race results:", err);
        setLoading(false);
      });
  }, [raceId]);

  const podium = results.filter((r) => r.positionOrder <= 3);
  const rest = results.filter((r) => r.positionOrder > 3);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-40">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!race) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center pt-40 gap-4">
          <p className="text-on-surface-variant text-lg">Race not found</p>
          <Link to="/races" className="text-primary hover:underline text-sm">
            ← Back to Race Archive
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-20 px-6 md:px-12 max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <Link
          to="/races"
          className="inline-flex items-center gap-2 text-on-surface-variant/60 hover:text-primary transition-colors font-label text-sm mb-6"
        >
          ← Back to Race Archive
        </Link>

        {/* Race Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="label-md inline-block px-4 py-1.5 rounded-full bg-surface-container-high text-primary tracking-widest uppercase text-[0.65rem] font-medium mb-4">
              Round {race.round} • {formatDate(race.date)}
            </span>
            <h1 className="font-headline text-3xl md:text-5xl lg:text-6xl text-white leading-tight tracking-tight">
              {race.name}
            </h1>
            <p className="mt-2 text-on-surface-variant font-body text-lg">
              {race.circuitName} — {race.location}, {race.country}
            </p>
          </div>
          <div className="flex-shrink-0">
             <Link
              to={`/circuits/${race.circuitId}`}
              className="px-6 py-3 bg-surface border border-white/10 hover:border-white/30 text-white rounded-full font-label tracking-widest uppercase text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-white/20 whitespace-nowrap inline-block"
            >
              Explore Circuit →
            </Link>
          </div>
        </div>

        {/* No results fallback */}
        {results.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-on-surface-variant text-lg">
              No results available for this race yet.
            </p>
          </div>
        ) : (
          <>
            {/* ── Podium Section ──────────────────────────────────── */}
            <section className="mb-12">
              <h2 className="font-headline text-xl text-white/80 mb-6 tracking-tight flex items-center gap-2">
                <span className="text-2xl">🏆</span> Podium
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {podium.map((r) => (
                  <PodiumCard
                    key={r.resultId}
                    result={r}
                    position={r.positionOrder}
                  />
                ))}
              </div>
            </section>

            {/* ── Full Results Table ────────────────────────────── */}
            <section>
              <h2 className="font-headline text-xl text-white/80 mb-6 tracking-tight flex items-center gap-2">
                <span className="text-xl">📊</span> Full Classification
              </h2>
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-container overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-outline-variant/20 text-[0.6rem] font-label uppercase tracking-[0.15em] text-on-surface-variant/40">
                      <th className="py-3 px-3 text-center w-12">POS</th>
                      <th className="py-3 px-3">Driver</th>
                      <th className="py-3 px-3 hidden md:table-cell">Team</th>
                      <th className="py-3 px-3 text-center hidden sm:table-cell">Grid</th>
                      <th className="py-3 px-3 text-center hidden sm:table-cell">Laps</th>
                      <th className="py-3 px-3 text-right">Time / Status</th>
                      <th className="py-3 px-3 text-right hidden lg:table-cell">Fastest Lap</th>
                      <th className="py-3 px-3 text-right w-16">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, idx) => (
                      <ResultRow key={r.resultId} result={r} index={idx} />
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
