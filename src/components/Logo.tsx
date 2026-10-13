import React from "react";
import consequencesLogo from "../assets/images/consequences_logo_1780786995541.png";
import type { ThemeMode } from "../types";

interface LogoProps {
  className?: string;
  themeMode?: ThemeMode;
  size?: number;
}

export default function Logo({ className = "", themeMode = "dark", size = 36 }: LogoProps) {
  return (
    <div 
      className={`relative flex items-center justify-center transition-transform hover:scale-105 duration-300 ${className}`} 
      style={{ height: size }}
    >
      <img
        src={consequencesLogo}
        alt="Consequences"
        className="h-full w-auto object-contain select-none"
        referrerPolicy="no-referrer"
        onError={(e) => {
          // Fallback to stylized elegant text if asset has issues loading
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}

