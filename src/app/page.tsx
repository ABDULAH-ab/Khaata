"use client";

import { useState } from "react";
import { ChatPanel } from "@/components/chat-panel";
import { LedgerPanel } from "@/components/ledger-panel";

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleLedgerUpdate = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-base">
            📒
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">
              Khata Assistant
            </h1>
            <p className="text-[11px] text-muted-foreground">
              AI-powered ledger for shopkeepers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] text-muted-foreground">Online</span>
        </div>
      </header>

      {/* Two-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: Chat */}
        <div className="w-1/2 border-r border-border/50 flex flex-col overflow-hidden">
          <ChatPanel onLedgerUpdate={handleLedgerUpdate} />
        </div>

        {/* Right panel: Ledger */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          <LedgerPanel refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
}
