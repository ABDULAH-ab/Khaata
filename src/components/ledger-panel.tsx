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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Customer } from "@/lib/types";

interface LedgerPanelProps {
  refreshTrigger: number;
}

type SortField = "name" | "balance" | "last_transaction_at";
type SortDir = "asc" | "desc";

export function LedgerPanel({ refreshTrigger }: LedgerPanelProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("balance");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const fetchLedger = useCallback(async () => {
    try {
      const res = await fetch("/api/ledger");
      const data = await res.json();
      if (data.customers) {
        setCustomers(data.customers);
      }
    } catch (error) {
      console.error("Failed to fetch ledger:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount and when refreshTrigger changes
  useEffect(() => {
    fetchLedger();
  }, [fetchLedger, refreshTrigger]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "name" ? "asc" : "desc");
    }
  };

  const sorted = [...customers].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    switch (sortField) {
      case "name":
        return dir * a.name.localeCompare(b.name);
      case "balance":
        return dir * (Number(a.balance) - Number(b.balance));
      case "last_transaction_at": {
        const aDate = a.last_transaction_at
          ? new Date(a.last_transaction_at).getTime()
          : 0;
        const bDate = b.last_transaction_at
          ? new Date(b.last_transaction_at).getTime()
          : 0;
        return dir * (aDate - bDate);
      }
      default:
        return 0;
    }
  });

  const isOverdue = (customer: Customer): boolean => {
    if (Number(customer.balance) <= 0) return false;
    if (!customer.last_transaction_at) return true;
    const lastTxn = new Date(customer.last_transaction_at);
    const daysSince = Math.floor(
      (Date.now() - lastTxn.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSince >= 14;
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-PK", {
      month: "short",
      day: "numeric",
    });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <span className="text-muted-foreground/30 ml-1">↕</span>;
    return (
      <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
    );
  };

  const totalOwed = customers.reduce(
    (sum, c) => sum + Math.max(0, Number(c.balance)),
    0
  );
  const overdueCount = customers.filter(isOverdue).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-lg">
              📊
            </div>
            <div>
              <h2 className="text-sm font-semibold">Ledger</h2>
              <p className="text-xs text-muted-foreground">
                {customers.length} customers
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-right">
            <div>
              <p className="text-xs text-muted-foreground">Total Owed</p>
              <p className="text-sm font-semibold tabular-nums">
                Rs. {totalOwed.toLocaleString()}
              </p>
            </div>
            {overdueCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {overdueCount} overdue
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
              <span className="text-sm">Loading ledger...</span>
            </div>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">
              No customers yet
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead
                  className="cursor-pointer select-none text-xs font-medium"
                  onClick={() => toggleSort("name")}
                >
                  Customer
                  <SortIcon field="name" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none text-xs font-medium text-right"
                  onClick={() => toggleSort("balance")}
                >
                  Balance
                  <SortIcon field="balance" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none text-xs font-medium text-right"
                  onClick={() => toggleSort("last_transaction_at")}
                >
                  Last Transaction
                  <SortIcon field="last_transaction_at" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((customer) => {
                const overdue = isOverdue(customer);
                const balance = Number(customer.balance);
                return (
                  <TableRow
                    key={customer.id}
                    className={`border-border/30 ${overdue ? "bg-destructive/5" : ""}`}
                  >
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {customer.name}
                        </span>
                        {overdue && (
                          <Badge
                            variant="destructive"
                            className="text-[10px] px-1.5 py-0"
                          >
                            Overdue
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-3">
                      <span
                        className={`text-sm font-medium tabular-nums ${
                          balance > 0
                            ? "text-amber-500"
                            : balance === 0
                              ? "text-emerald-500"
                              : "text-emerald-500"
                        }`}
                      >
                        Rs. {balance.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-3">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(customer.last_transaction_at)}
                      </span>
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
