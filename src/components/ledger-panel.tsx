"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Customer } from "@/lib/types";

interface LedgerPanelProps {
  refreshTrigger: number;
  onCustomersLoaded?: (customers: Customer[]) => void;
}

export function LedgerPanel({
  refreshTrigger,
  onCustomersLoaded,
}: LedgerPanelProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLedger = useCallback(async () => {
    try {
      const res = await fetch("/api/ledger");
      const data = await res.json();
      if (data.customers) {
        setCustomers(data.customers);
        onCustomersLoaded?.(data.customers);
      }
    } catch (error) {
      console.error("Failed to fetch ledger:", error);
    } finally {
      setIsLoading(false);
    }
  }, [onCustomersLoaded]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger, refreshTrigger]);

  const getDaysOverdue = (customer: Customer): number => {
    if (Number(customer.balance) <= 0) return 0;
    if (!customer.last_transaction_at) return 30;
    const lastTxn = new Date(customer.last_transaction_at);
    const days = Math.floor(
      (Date.now() - lastTxn.getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const isOverdue = (customer: Customer): boolean => {
    return getDaysOverdue(customer) >= 14;
  };

  const formatActivityDate = (dateStr: string | null): string => {
    if (!dateStr) return "No activity";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const timeStr = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      return `Today, ${timeStr.toLowerCase()}`;
    }
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 14) return `${diffDays} days ago`;

    // Format as DD-MMM-YYYY e.g. 17-Jun-2026
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Generate short ID tag from customer UUID or name e.g. 104-AK
  const getCustomerCode = (customer: Customer, idx: number): string => {
    const initials = customer.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
    const num = (idx * 137 + 104) % 900 + 100;
    return `ID: ${num}-${initials}`;
  };

  return (
    <div className="flex flex-col h-full bg-background font-mono select-none">
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <span className="text-xs text-muted-foreground animate-pulse">
              LOADING LEDGER DATA...
            </span>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <span className="text-xs text-muted-foreground">
              NO CUSTOMERS FOUND
            </span>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-background sticky top-0 z-10 border-b border-border/40">
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead className="text-[9px] font-bold tracking-widest text-muted-foreground/80 uppercase font-mono py-3">
                  CUSTOMER NAME
                </TableHead>

                <TableHead className="text-[9px] font-bold tracking-widest text-muted-foreground/80 uppercase font-mono py-3">
                  LAST ACTIVITY
                </TableHead>

                <TableHead className="text-[9px] font-bold tracking-widest text-muted-foreground/80 uppercase font-mono py-3 text-right">
                  BALANCE
                </TableHead>

                <TableHead className="text-[9px] font-bold tracking-widest text-muted-foreground/80 uppercase font-mono py-3 text-right pr-6">
                  STATUS
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {customers.map((customer, idx) => {
                const balance = Number(customer.balance);
                const overdue = isOverdue(customer);
                const daysOverdue = getDaysOverdue(customer);
                const customerCode = getCustomerCode(customer, idx);

                return (
                  <TableRow
                    key={customer.id}
                    className="border-b border-border/20 hover:bg-muted/20 transition-colors"
                  >
                    {/* Customer Name & Subtitle ID */}
                    <TableCell className="py-3 font-mono">
                      <div>
                        <p className="text-xs font-bold text-foreground tracking-tight">
                          {customer.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 tracking-wider">
                          {customerCode}
                        </p>
                      </div>
                    </TableCell>

                    {/* Last Activity */}
                    <TableCell className="py-3 text-xs text-muted-foreground/80 font-mono">
                      {formatActivityDate(customer.last_transaction_at)}
                    </TableCell>

                    {/* Balance */}
                    <TableCell className="py-3 text-right font-mono">
                      {balance > 0 ? (
                        <span
                          className={`text-xs font-bold tabular-nums tracking-wide ${
                            overdue
                              ? "text-rose-500"
                              : "text-amber-500 dark:text-amber-400"
                          }`}
                        >
                          Rs {balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-emerald-500 tracking-wide">
                          Settled
                        </span>
                      )}
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell className="py-3 text-right pr-6 font-mono">
                      {overdue ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border border-rose-500/40 text-rose-500 bg-rose-500/10">
                          OVERDUE {daysOverdue}D
                        </span>
                      ) : balance > 0 ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border border-border/60 text-muted-foreground/80 bg-muted/20">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border border-emerald-500/40 text-emerald-500 bg-emerald-500/10">
                          PAID
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </ScrollArea>
    </div>
  );
}
