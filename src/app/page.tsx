"use client";

import { useState } from "react";
import { ChatPanel } from "@/components/chat-panel";
import { LedgerPanel } from "@/components/ledger-panel";
import { BookOpen, Sparkles, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleLedgerUpdate = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground selection:bg-primary/20">
      {/* Top Glassmorphic Navigation Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border/40 bg-card/40 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary/30 to-emerald-500/30 border border-primary/30 flex items-center justify-center text-primary shadow-md shadow-primary/10">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Khata Assistant
              </h1>
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-primary/30 bg-primary/10 text-primary font-medium">
                <Sparkles className="w-3 h-3 mr-1 text-primary animate-pulse" /> AI Agent Ledger
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Natural Language Ledger for Local Shopkeepers · Powered by LangGraph
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground bg-card/60 px-3 py-1 rounded-full border border-border/40">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Supabase Sync Active</span>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-medium text-emerald-400">Agent Ready</span>
          </div>
        </div>
      </header>

      {/* Two-Panel Split Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Interactive Chat */}
        <div className="w-full lg:w-1/2 border-r border-border/40 flex flex-col overflow-hidden">
          <ChatPanel onLedgerUpdate={handleLedgerUpdate} />
        </div>

        {/* Right Panel: Live Ledger Dashboard */}
        <div className="hidden lg:flex lg:w-1/2 flex-col overflow-hidden">
          <LedgerPanel refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
}
