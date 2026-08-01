"use client";

import { useState, useEffect } from "react";
import { ChatPanel } from "@/components/chat-panel";
import { LedgerPanel } from "@/components/ledger-panel";
import { Sun, Moon } from "lucide-react";
import type { Customer } from "@/lib/types";

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    // Apply dark class to html element
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

  // Calculate totals for top header
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
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground font-mono transition-colors duration-200">
      {/* Header Bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border/40 bg-background shrink-0 select-none">
        {/* Left Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            <h1 className="text-xs font-bold tracking-widest uppercase text-foreground">
              KHATA ASSISTANT
            </h1>
          </div>
          <span className="text-[10px] text-muted-foreground/70 tracking-widest uppercase">
            TERM // ACTIVE
          </span>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-7 h-7 rounded border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors ml-2"
            title="Toggle Light/Dark Theme"
          >
            {theme === "dark" ? (
              <Sun className="w-3.5 h-3.5" />
            ) : (
              <Moon className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Right Header Stats */}
        <div className="flex items-center gap-8 text-left">
          <div>
            <p className="text-[9px] text-muted-foreground/70 tracking-widest uppercase font-mono">
              TOTAL OUTSTANDING
            </p>
            <p className="text-sm font-bold text-foreground tabular-nums tracking-wide">
              Rs {totalOutstanding.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div>
            <p className="text-[9px] text-muted-foreground/70 tracking-widest uppercase font-mono">
              OVERDUE COUNT
            </p>
            <p className="text-sm font-bold text-rose-500 tabular-nums tracking-wide">
              {String(overdueCount).padStart(2, "0")}
            </p>
          </div>

          <div>
            <p className="text-[9px] text-muted-foreground/70 tracking-widest uppercase font-mono">
              TOTAL CUSTOMERS
            </p>
            <p className="text-sm font-bold text-foreground tabular-nums tracking-wide">
              {customers.length}
            </p>
          </div>
        </div>
      </header>

      {/* Two Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Chat Terminal */}
        <div className="w-full lg:w-5/12 border-r border-border/40 flex flex-col overflow-hidden bg-background">
          <ChatPanel onLedgerUpdate={handleLedgerUpdate} />
        </div>

        {/* Right Panel: Ledger Table */}
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
