import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DriverCard from "./DriverCard";

export default function Hero() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center pt-20 px-8 text-center overflow-hidden">
      {/* Decorative Radial Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#1b1b1b_0%,_#131313_100%)] z-0"></div>
      <div className="relative z-10 max-w-5xl mx-auto space-y-12">
        <span className="label-md inline-block px-4 py-1.5 rounded-full bg-surface-container-high text-primary tracking-widest uppercase text-[0.75rem] font-medium">
          Intelligence Redefined
        </span>
        <h1 className="font-headline text-5xl md:text-7xl lg:text-8xl text-white leading-[1.1] tracking-tight max-w-4xl mx-auto">
          Formula 1 Telemetry, 3D Tracks, and AI.
        </h1>
        <p className="font-body text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
          An all-in-one analytics platform for F1 professionals and enthusiasts. Track real-time standings, analyze granular telemetry, and use our specialized AI to instantly query decades of motorsport history.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
          <button className="signature-glow px-10 py-4 rounded-full text-on-primary font-bold text-lg hover:shadow-[0_0_30px_rgba(130,239,92,0.3)] transition-all active:scale-95">
            Race Telemetry →
          </button>
          <button className="bg-surface-container-high px-10 py-4 rounded-full text-white font-semibold text-lg hover:bg-surface-bright transition-colors active:scale-95">
            Ask F1 AI
          </button>
        </div>
      </div>

      {/* Featured Drivers Grid */}
      <div className="mt-24 w-full max-w-6xl relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 rounded-full bg-primary" />
            <h2 className="font-headline text-2xl md:text-3xl text-white tracking-tight">
              2026 Grid
            </h2>
          </div>
          <span className="text-on-surface-variant/40 font-label text-sm tracking-widest uppercase">
            Featured Drivers
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {drivers.slice(0, 4).map((driver) => (
              <DriverCard key={driver.driverId} driver={driver} />
            ))}
          </div>
        )}

        {/* Show More Button */}
        <div className="mt-10 flex justify-center">
          <Link
            to="/drivers"
            className="group/btn inline-flex items-center gap-3 signature-glow px-10 py-4 rounded-full text-on-primary font-bold text-lg hover:shadow-[0_0_40px_rgba(130,239,92,0.35)] transition-all active:scale-95"
          >
            View All Drivers
            <span className="material-symbols-outlined text-xl group-hover/btn:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
