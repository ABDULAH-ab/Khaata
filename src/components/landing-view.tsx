"use client";

import Link from "next/link";
import { ArrowRight, Bot, ShieldCheck, Zap } from "lucide-react";

export function LandingView() {
  return (
    <div className="flex flex-col items-center justify-between min-h-[calc(100vh-3rem)] px-6 py-12 bg-background text-foreground font-mono">
      {/* Background Subtle Grid Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#282624_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

      {/* Main Hero Content */}
      <div className="relative z-10 flex flex-col items-center max-w-3xl text-center space-y-8 my-auto">
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/80 bg-card/60 backdrop-blur-sm text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span>LANGGRAPH DEEP AGENT HARNESS // v1.0</span>
        </div>

        {/* Title & Tagline */}
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-[0.15em] uppercase text-foreground leading-tight">
            KHATA ASSISTANT
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground/80 max-w-xl mx-auto leading-relaxed tracking-wide">
            Turn natural-language shop talk into accurate, structured ledger updates.
            Powered by a LangGraph agent that parses transactions, resolves ambiguous customer names, and flags overdue tabs automatically.
          </p>
        </div>

        {/* Get Started Button */}
        <div className="pt-2">
          <Link
            href="/chat"
            className="group relative inline-flex items-center gap-3 px-8 py-3.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-[#141312] font-bold text-xs uppercase tracking-[0.2em] transition-all duration-200 shadow-lg shadow-[#10B981]/20 hover:shadow-[#10B981]/40 cursor-pointer"
            id="get-started-button"
          >
            <span>GET STARTED</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 3 Core Capability Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full pt-8 text-left">
          <div className="p-4 rounded-lg border border-border/70 bg-card/40 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground/60 text-[9px] tracking-[0.2em] uppercase">
              <span>01 // INPUT</span>
              <Zap className="w-3.5 h-3.5 text-[#10B981]" />
            </div>
            <h3 className="text-xs font-bold text-foreground tracking-wide">Natural Language</h3>
            <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
              Speak counter talk like &quot;Ali took milk 150, Sara paid tab&quot; — handled in a single prompt.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border/70 bg-card/40 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground/60 text-[9px] tracking-[0.2em] uppercase">
              <span>02 // HARNESS</span>
              <Bot className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <h3 className="text-xs font-bold text-foreground tracking-wide">Planner → Executor</h3>
            <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
              Planner creates task lists, Executor calls Supabase tools, Responder echoes back result.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border/70 bg-card/40 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground/60 text-[9px] tracking-[0.2em] uppercase">
              <span>03 // SAFETY</span>
              <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <h3 className="text-xs font-bold text-foreground tracking-wide">Smart Safeguards</h3>
            <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
              Disambiguates similar names (e.g. Ali Khan vs Ali Raza) and calculates exact tab balance on clearance.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-[10px] text-muted-foreground/50 tracking-widest uppercase pt-8">
        BUILT WITH NEXT.JS 16 · SUPABASE · LANGGRAPH JS · SHADCN/UI
      </footer>
    </div>
  );
}
