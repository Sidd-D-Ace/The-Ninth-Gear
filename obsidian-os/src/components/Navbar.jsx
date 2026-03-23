import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();

  const links = [
    { label: "Home", path: "/" },
    { label: "Standings", path: "/drivers" },
    { label: "Race Telemetry", path: "#" },
    { label: "Race Archive", path: "/races" },
    { label: "Race Calendar", path: "#" },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#131313]/60 backdrop-blur-xl">
      <div className="flex justify-between items-center h-20 px-8 max-w-[1440px] mx-auto">
        <Link
          to="/"
          className="text-xl font-bold tracking-tighter text-white font-newsreader hover:text-primary transition-colors"
        >
          The Ninth Gear
        </Link>
        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-10">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return link.path.startsWith("#") ? (
              <a
                key={link.label}
                className="text-gray-400 font-medium text-sm tracking-wide hover:text-white transition-colors duration-300"
                href={link.path}
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                to={link.path}
                className={`font-medium text-sm tracking-wide transition-colors duration-300 ${
                  isActive
                    ? "text-[#82ef5c] font-semibold"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-6">
          <button className="hidden lg:block text-sm font-medium text-white hover:text-primary transition-colors">
            Sign In
          </button>
          <button className="signature-glow px-6 py-2.5 rounded-full text-on-primary font-semibold text-sm active:scale-95 duration-200">
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}
