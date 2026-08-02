"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  const onCustomersLoadedRef = useRef(onCustomersLoaded);
  useEffect(() => {
    onCustomersLoadedRef.current = onCustomersLoaded;
  }, [onCustomersLoaded]);

  const fetchLedger = useCallback(async () => {
    try {
      const res = await fetch("/api/ledger");
      const data = await res.json();
      if (data.customers) {
        setCustomers(data.customers);
        onCustomersLoadedRef.current?.(data.customers);
      }
    } catch (error) {
      console.error("Failed to fetch ledger:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

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
    <div className="flex flex-col h-full bg-background font-mono border-l border-border/40">
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <span className="text-xs text-muted-foreground animate-pulse">
              LOADING LEDGER...
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
            <TableHeader className="bg-background sticky top-0 z-10 border-b border-border/60">
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="text-[9px] font-normal tracking-[0.2em] text-muted-foreground/70 uppercase font-mono py-3 pl-6">
                  CUSTOMER NAME
                </TableHead>

                <TableHead className="text-[9px] font-normal tracking-[0.2em] text-muted-foreground/70 uppercase font-mono py-3">
                  LAST ACTIVITY
                </TableHead>

                <TableHead className="text-[9px] font-normal tracking-[0.2em] text-muted-foreground/70 uppercase font-mono py-3 text-right">
                  BALANCE
                </TableHead>

                <TableHead className="text-[9px] font-normal tracking-[0.2em] text-muted-foreground/70 uppercase font-mono py-3 text-right pr-6">
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
                    className="border-b border-border/30 hover:bg-muted/10 transition-colors"
                  >
                    {/* Customer Name & Subtitle ID */}
                    <TableCell className="py-3.5 pl-6 font-mono">
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
                    <TableCell className="py-3.5 text-xs text-muted-foreground/80 font-mono">
                      {formatActivityDate(customer.last_transaction_at)}
                    </TableCell>

                    {/* Balance */}
                    <TableCell className="py-3.5 text-right font-mono">
                      {balance > 0 ? (
                        <span
                          className={`text-xs font-bold tabular-nums tracking-wide ${
                            overdue
                              ? "text-[#EF4444]"
                              : "text-[#F59E0B] dark:text-[#EAB308]"
                          }`}
                        >
                          Rs {balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      ) : balance === 0 ? (
                        <span className="text-xs font-bold text-[#10B981] tracking-wide">
                          Settled
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-[#38BDF8] tracking-wide tabular-nums">
                          -Rs {Math.abs(balance).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell className="py-3.5 text-right pr-6 font-mono">
                      {overdue ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border border-[#EF4444]/40 text-[#EF4444] bg-[#EF4444]/10">
                          OVERDUE {daysOverdue}D
                        </span>
                      ) : balance > 0 ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border border-border/80 text-muted-foreground/80 bg-muted/20">
                          ACTIVE
                        </span>
                      ) : balance === 0 ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border border-[#10B981]/40 text-[#10B981] bg-[#10B981]/10">
                          PAID
                        </span>
                      ) : (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border border-[#38BDF8]/40 text-[#38BDF8] bg-[#38BDF8]/10">
                          ADVANCE
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
