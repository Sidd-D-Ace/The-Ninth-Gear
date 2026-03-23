import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

export default function RacePredictionPage() {
  const { raceId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
    
    fetch(`/api/races/${raceId}/predict`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setData(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch predictions:", err);
        setError("Failed to load predictions. Please try again later.");
        setLoading(false);
      });
  }, [raceId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-8" />
        <h2 className="font-headline text-2xl text-white font-bold mb-2">Analyzing Race Data</h2>
        <p className="text-on-surface-variant font-body animate-pulse">
          Engine warming up... Running thousands of simulations based on historical data.
        </p>
      </div>
    );
  }

  if (error || !data || !data.prediction) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="font-headline text-3xl font-bold text-white mb-4">
          Prediction Unavailable
        </h1>
        <p className="text-on-surface-variant max-w-md mx-auto mb-8 font-body">
          {error || "We couldn't generate predictions for this race. Make sure it's valid."}
        </p>
        <Link
          to="/races"
          className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-label tracking-widest uppercase text-sm font-bold transition-colors inline-block"
        >
          Return to Archive
        </Link>
      </div>
    );
  }

  const { prediction } = data;
  const { podium, fullGrid, fastestLap, constructorBattle, dnfRisks, raceName } = prediction;

  // Re-order podium for display: P2, P1, P3
  const displayPodium = [
    podium.find((p) => p.predictedPosition === 2),
    podium.find((p) => p.predictedPosition === 1),
    podium.find((p) => p.predictedPosition === 3),
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="relative pt-32 pb-16 px-6 lg:px-12 overflow-hidden border-b border-white/5">
        <div className="absolute top-0 right-[-10%] w-[50%] h-[150%] bg-primary/20 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <Link
              to="/races"
              className="inline-flex items-center gap-2 text-on-surface-variant hover:text-white font-label text-xs uppercase tracking-widest font-bold mb-8 transition-colors group"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Archive
            </Link>
            
            <div className="inline-flex items-center gap-3 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full mb-4">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-primary font-label text-[10px] font-bold tracking-[0.2em] uppercase">AI Prediction Engine Active</span>
            </div>
            
            <h1 className="font-headline text-4xl md:text-6xl text-white font-bold leading-none tracking-tighter shadow-sm mb-4">
              {raceName} {" "}
              <span className="text-on-surface-variant font-light">Forecast</span>
            </h1>
          </div>
          
          <div className="flex gap-4">
            <Link
              to={`/circuits/${prediction.circuitId}`}
              className="px-6 py-3 bg-surface border border-white/10 hover:border-white/30 text-white rounded-full font-label tracking-widest uppercase text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-white/20 whitespace-nowrap"
            >
              Explore Circuit →
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 space-y-24">
        
        {/* ── Podium Prediction ────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-12">
            <h2 className="font-headline text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Predicted Podium
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            {displayPodium.map((driver) => {
              const pos = driver.predictedPosition;
              const isWinner = pos === 1;
              const heightClass = isWinner ? "h-[450px]" : pos === 2 ? "h-[400px]" : "h-[350px]";
              const imageSize = isWinner ? "w-48 h-48" : "w-40 h-40";
              
              return (
                <div 
                  key={driver.driverId} 
                  className={`${heightClass} rounded-3xl bg-surface border border-white/5 relative overflow-hidden group hover:border-white/20 transition-all flex flex-col justify-end p-8`}
                >
                  {/* Position watermark */}
                  <div className="absolute top-4 right-8 font-headline text-[150px] font-bold text-white/5 leading-none pointer-events-none select-none">
                    {pos}
                  </div>
                  
                  {/* Driver Image placeholder */}
                  <div className={`absolute top-12 left-1/2 -translate-x-1/2 ${imageSize} rounded-full bg-gradient-to-tr from-white/5 to-white/10 border-4 border-background flex items-center justify-center overflow-hidden shadow-2xl`}>
                     <img 
                      src={`https://media.formula1.com/content/dam/fom-website/drivers/M/MAXVER01_Max_Verstappen/maxver01.png.transform/2col/image.png`}
                      alt={driver.driverName}
                      className="w-full h-full object-cover opacity-60 mix-blend-luminosity group-hover:mix-blend-normal group-hover:opacity-100 transition-all duration-500 scale-110"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                     <span className="hidden font-headline text-4xl text-white/20 font-bold">{driver.driverCode}</span>
                  </div>
                  
                  <div className="relative z-10 w-full text-center mt-auto flex flex-col items-center">
                    <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white font-label text-xs uppercase tracking-widest mb-4 inline-flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      {driver.confidence}% Match
                    </div>
                    <h3 className="font-headline text-3xl font-bold text-white mb-1">{driver.driverName}</h3>
                    <p className="font-body text-on-surface-variant uppercase tracking-widest text-sm mb-6">{driver.constructorName}</p>
                    
                    <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />
                    
                    <div className="w-full flex justify-between px-4 text-left">
                      <div>
                        <p className="text-[10px] uppercase font-label tracking-widest text-on-surface-variant/50 mb-1">Pace Score</p>
                        <p className="font-headline text-lg text-white font-medium">{driver.features.avgRecentFinish.toFixed(1)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-label tracking-widest text-on-surface-variant/50 mb-1">Track History</p>
                        <p className="font-headline text-lg text-white font-medium">{driver.circuitHistory.avgFinish ? driver.circuitHistory.avgFinish.toFixed(1) : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Race Analytics Grid ────────────────────────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Fastest Lap Card */}
          <div className="rounded-3xl bg-surface border border-white/5 p-8 relative overflow-hidden group hover:border-primary/30 transition-all duration-500">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/20 transition-all" />
            
            <h3 className="font-headline text-xl font-bold text-white mb-8 flex items-center gap-3">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Fastest Lap Prediction
            </h3>
            
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-background border-2 border-white/10 flex items-center justify-center font-headline text-3xl font-bold text-white/50 group-hover:text-white transition-colors">
                {fastestLap.driverCode}
              </div>
              <div>
                <p className="text-3xl font-headline font-bold text-white mb-2">{fastestLap.driverName}</p>
                <p className="text-on-surface-variant font-body mb-4">{fastestLap.constructorName}</p>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-label tracking-wide text-white/70">
                    {fastestLap.confidence}% Confidence
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* DNF Risk Card */}
          <div className="rounded-3xl bg-surface border border-white/5 p-8 relative overflow-hidden">
            <h3 className="font-headline text-xl font-bold text-white mb-8 flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Highest DNF Risk
            </h3>
            
            <div className="space-y-4">
              {dnfRisks.slice(0, 4).map((driver, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-xs font-bold text-white/50 shadow-inner">
                    {driver.driverCode}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-white font-body text-sm">{driver.driverName}</span>
                      <span className="text-red-400 font-label text-xs">{driver.risk}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full"
                        style={{ width: `${driver.risk}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Constructor Battle */}
          <div className="lg:col-span-2 rounded-3xl bg-surface border border-white/5 p-8">
            <h3 className="font-headline text-xl font-bold text-white mb-8 flex items-center gap-3">
              <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Predicted Constructor Points
            </h3>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {constructorBattle.slice(0, 4).map((team, idx) => (
                <div key={idx} className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                  <div className="mb-6">
                    <p className="font-headline text-2xl font-bold text-white mb-1">{team.name}</p>
                    <p className="text-xs text-on-surface-variant font-label uppercase tracking-wider">{team.drivers.map(d => `P${d.position}`).join(' & ')}</p>
                  </div>
                  <p className="font-headline text-4xl text-primary font-bold">+{team.points}</p>
                </div>
              ))}
            </div>
          </div>

        </section>

        {/* ── Full Grid Prediction ────────────────────────────────────────── */}
        <section>
          <h2 className="font-headline text-2xl font-bold text-white tracking-tight mb-8 pl-4 border-l-4 border-primary">
            Full Grid Forecast
          </h2>
          
          <div className="rounded-3xl bg-surface border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5 font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                    <th className="py-4 px-6 font-semibold w-24">Pos</th>
                    <th className="py-4 px-6 font-semibold">Driver</th>
                    <th className="py-4 px-6 font-semibold">Team</th>
                    <th className="py-4 px-6 font-semibold text-center w-32">Pace Score</th>
                    <th className="py-4 px-6 font-semibold text-center w-32">Track Avg</th>
                    <th className="py-4 px-6 font-semibold text-right w-32">Confidence</th>
                  </tr>
                </thead>
                <tbody className="font-body text-sm divide-y divide-white/5">
                  {fullGrid.map((driver) => (
                    <tr 
                      key={driver.driverId} 
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="py-4 px-6">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-headline font-bold text-sm ${
                          driver.predictedPosition <= 3 ? 'bg-white/10 text-white' : 
                          driver.predictedPosition <= 10 ? 'text-white/70' : 'text-white/30'
                        }`}>
                          {driver.predictedPosition}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-white group-hover:text-primary transition-colors">
                            {driver.driverName}
                          </span>
                          <span className="text-on-surface-variant/50 text-xs hidden sm:inline-block">
                            {driver.driverCode}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-on-surface-variant">
                        {driver.constructorName}
                      </td>
                      <td className="py-4 px-6 text-center text-white/70">
                         {driver.features.avgRecentFinish.toFixed(1)}
                      </td>
                      <td className="py-4 px-6 text-center text-white/70">
                         {driver.circuitHistory.avgFinish ? driver.circuitHistory.avgFinish.toFixed(1) : '-'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className={`${driver.confidence > 70 ? 'text-green-400' : driver.confidence > 40 ? 'text-yellow-400' : 'text-on-surface-variant'}`}>
                            {driver.confidence}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
