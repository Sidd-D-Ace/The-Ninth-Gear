import React from "react";

export default function TrustedBy() {
  return (
    <section className="py-24 bg-surface-container-low">
      <div className="max-w-[1440px] mx-auto px-8">
        <p className="label-md text-center text-gray-500 mb-12 tracking-[0.3em] uppercase">
          Explore Teams
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 items-center opacity-40 grayscale hover:grayscale-0 transition-all">
          <div className="flex justify-center font-headline text-2xl font-bold text-white">
            VORTEX
          </div>
          <div className="flex justify-center font-headline text-2xl font-bold text-white">
            NEXUS
          </div>
          <div className="flex justify-center font-headline text-2xl font-bold text-white">
            PRISM
          </div>
          <div className="flex justify-center font-headline text-2xl font-bold text-white">
            ORBIT
          </div>
          <div className="flex justify-center font-headline text-2xl font-bold text-white">
            LUMEN
          </div>
          <div className="flex justify-center font-headline text-2xl font-bold text-white">
            APEX
          </div>
        </div>
      </div>
    </section>
  );
}
