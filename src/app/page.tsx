"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LandingView } from "@/components/landing-view";
import { Sun, Moon, Terminal } from "lucide-react";

export default function Home() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground font-mono transition-colors duration-150">
      {/* Top Terminal Header Bar */}
      <header className="flex items-center justify-between px-5 h-12 border-b border-border/80 bg-background shrink-0">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity cursor-pointer"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <h1 className="text-xs font-bold tracking-[0.2em] uppercase text-foreground">
              KHATA ASSISTANT
            </h1>
          </Link>
          <span className="text-[10px] text-muted-foreground/60 tracking-[0.2em] uppercase ml-2 hidden sm:inline">
            LANDING
          </span>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-6 h-6 rounded border border-border/70 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors ml-2 cursor-pointer"
            title="Toggle Light/Dark Theme"
          >
            {theme === "dark" ? (
              <Sun className="w-3 h-3" />
            ) : (
              <Moon className="w-3 h-3" />
            )}
          </button>
        </div>

        {/* Right Action */}
        <div className="flex items-center gap-4">
          <Link
            href="/chat"
            className="flex items-center gap-2 px-3 py-1 rounded bg-[#10B981] hover:bg-[#059669] text-[#141312] text-[10px] font-bold tracking-widest uppercase transition-colors cursor-pointer shadow-sm shadow-[#10B981]/20"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>LAUNCH AGENT</span>
          </Link>
        </div>
      </header>

      {/* Main Landing Content */}
      <div className="flex-1 overflow-y-auto">
        <LandingView />
      </div>
    </div>
  );
}
