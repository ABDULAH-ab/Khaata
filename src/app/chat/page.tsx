"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChatPanel } from "@/components/chat-panel";
import { LedgerPanel } from "@/components/ledger-panel";
import { Sun, Moon, ArrowLeft } from "lucide-react";
import type { Customer } from "@/lib/types";

export default function ChatPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const handleLedgerUpdate = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleCustomersLoaded = (data: Customer[]) => {
    setCustomers(data);
  };

  const totalOutstanding = customers.reduce(
    (sum, c) => sum + Math.max(0, Number(c.balance)),
    0
  );

  const isOverdue = (customer: Customer): boolean => {
    if (Number(customer.balance) <= 0) return false;
    if (!customer.last_transaction_at) return true;
    const lastTxn = new Date(customer.last_transaction_at);
    const daysSince = Math.floor(
      (Date.now() - lastTxn.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSince >= 14;
  };

  const overdueCount = customers.filter(isOverdue).length;

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
            TERM // ACTIVE
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

        {/* Center / Right Header Navigation & Stats */}
        <div className="flex items-center gap-6">
          {/* Stats Summary */}
          <div className="hidden md:flex items-center gap-6 text-right">
            <div>
              <span className="text-[9px] text-muted-foreground/60 tracking-[0.2em] uppercase block font-mono">
                OUTSTANDING
              </span>
              <span className="text-xs font-bold tracking-wide font-mono text-foreground">
                Rs {totalOutstanding.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div>
              <span className="text-[9px] text-muted-foreground/60 tracking-[0.2em] uppercase block font-mono">
                OVERDUE
              </span>
              <span className="text-xs font-bold tracking-wide font-mono text-[#EF4444]">
                {String(overdueCount).padStart(2, "0")}
              </span>
            </div>
          </div>

          <Link
            href="/"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-border/80 hover:bg-muted/30 text-[10px] font-bold tracking-widest text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>LANDING</span>
          </Link>
        </div>
      </header>

      {/* Main Terminal Chat & Ledger Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Terminal Chat */}
        <div className="w-full lg:w-5/12 border-r border-border/80 flex flex-col overflow-hidden bg-background">
          <ChatPanel onLedgerUpdate={handleLedgerUpdate} />
        </div>

        {/* Right Panel: Terminal Ledger Table */}
        <div className="hidden lg:flex lg:w-7/12 flex-col overflow-hidden bg-background">
          <LedgerPanel
            refreshTrigger={refreshTrigger}
            onCustomersLoaded={handleCustomersLoaded}
          />
        </div>
      </div>
    </div>
  );
}
