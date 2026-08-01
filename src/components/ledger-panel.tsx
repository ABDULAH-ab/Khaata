"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  Users,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ArrowUpDown,
  Clock,
  Wallet,
  CalendarCheck
} from "lucide-react";
import type { Customer } from "@/lib/types";

interface LedgerPanelProps {
  refreshTrigger: number;
}

type SortField = "name" | "balance" | "last_transaction_at";
type SortDir = "asc" | "desc";
type FilterTab = "all" | "overdue" | "active" | "settled";

export function LedgerPanel({ refreshTrigger }: LedgerPanelProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortField, setSortField] = useState<SortField>("balance");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");

  const fetchLedger = useCallback(async () => {
    setIsRefreshing(true);
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
      setIsRefreshing(false);
    }
  }, []);

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

  const isOverdue = (customer: Customer): boolean => {
    if (Number(customer.balance) <= 0) return false;
    if (!customer.last_transaction_at) return true;
    const lastTxn = new Date(customer.last_transaction_at);
    const daysSince = Math.floor(
      (Date.now() - lastTxn.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSince >= 14;
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      // Search filter
      const matchesSearch =
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (customer.aliases || []).some((a) =>
          a.toLowerCase().includes(searchQuery.toLowerCase())
        );

      if (!matchesSearch) return false;

      // Status tab filter
      const balance = Number(customer.balance);
      if (filterTab === "overdue") return isOverdue(customer);
      if (filterTab === "active") return balance > 0 && !isOverdue(customer);
      if (filterTab === "settled") return balance === 0;

      return true;
    });
  }, [customers, searchQuery, filterTab]);

  const sortedCustomers = useMemo(() => {
    return [...filteredCustomers].sort((a, b) => {
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
  }, [filteredCustomers, sortField, sortDir]);

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "No history";
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-PK", {
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const totalOwed = customers.reduce(
    (sum, c) => sum + Math.max(0, Number(c.balance)),
    0
  );
  const overdueCount = customers.filter(isOverdue).length;
  const activeCount = customers.filter((c) => Number(c.balance) > 0).length;

  return (
    <div className="flex flex-col h-full bg-background/30">
      {/* Top Header & Stats */}
      <div className="px-5 py-4 border-b border-border/40 bg-card/30 backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-wide">Live Customer Ledger</h2>
              <p className="text-xs text-muted-foreground">
                {customers.length} total accounts · {activeCount} active credit
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchLedger}
            disabled={isRefreshing}
            className="h-8 w-8 rounded-lg border-border/50 bg-card/50 hover:bg-card"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="px-3 py-2 rounded-xl bg-card/60 border border-border/40 shadow-xs">
            <p className="text-[10px] text-muted-foreground uppercase font-medium">Total Credit Owed</p>
            <p className="text-sm font-bold text-amber-400 tabular-nums">
              Rs. {totalOwed.toLocaleString()}
            </p>
          </div>
          <div className="px-3 py-2 rounded-xl bg-card/60 border border-border/40 shadow-xs">
            <p className="text-[10px] text-muted-foreground uppercase font-medium">Overdue Accounts</p>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-rose-400 tabular-nums">{overdueCount}</p>
              {overdueCount > 0 && (
                <Badge variant="destructive" className="text-[9px] px-1 py-0 bg-rose-500/20 text-rose-300 border-rose-500/30">
                  Needs Follow-up
                </Badge>
              )}
            </div>
          </div>
          <div className="px-3 py-2 rounded-xl bg-card/60 border border-border/40 shadow-xs">
            <p className="text-[10px] text-muted-foreground uppercase font-medium">Total Customers</p>
            <p className="text-sm font-bold text-foreground tabular-nums">{customers.length}</p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-2 pt-1">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or alias (e.g. Ali, Sara)..."
              className="pl-8 h-8 text-xs bg-card/60 border-border/40 rounded-lg focus-visible:ring-primary/30"
            />
          </div>

          <div className="flex items-center gap-1 bg-card/40 p-1 rounded-lg border border-border/40 text-xs">
            {(
              [
                { id: "all", label: "All" },
                { id: "overdue", label: `Overdue (${overdueCount})` },
                { id: "active", label: "Active" },
                { id: "settled", label: "Settled" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                  filterTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="w-6 h-6 text-muted-foreground/40 animate-spin" />
            <p className="text-xs text-muted-foreground">Syncing ledger table...</p>
          </div>
        ) : sortedCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
            <Users className="w-8 h-8 text-muted-foreground/30" />
            <p className="text-xs font-medium text-muted-foreground">No customers match your filter</p>
            {searchQuery && (
              <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")} className="text-xs">
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-card/40 sticky top-0 backdrop-blur-md z-10">
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead
                  className="cursor-pointer select-none text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => toggleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    Customer Name
                    <ArrowUpDown className="w-3 h-3 text-muted-foreground/50" />
                  </div>
                </TableHead>

                <TableHead
                  className="cursor-pointer select-none text-[11px] font-semibold text-muted-foreground text-right hover:text-foreground transition-colors"
                  onClick={() => toggleSort("balance")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Balance (Debt)
                    <ArrowUpDown className="w-3 h-3 text-muted-foreground/50" />
                  </div>
                </TableHead>

                <TableHead
                  className="cursor-pointer select-none text-[11px] font-semibold text-muted-foreground text-right hover:text-foreground transition-colors"
                  onClick={() => toggleSort("last_transaction_at")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Last Activity
                    <ArrowUpDown className="w-3 h-3 text-muted-foreground/50" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCustomers.map((customer) => {
                const overdue = isOverdue(customer);
                const balance = Number(customer.balance);
                return (
                  <TableRow
                    key={customer.id}
                    className={`border-border/30 transition-colors ${
                      overdue
                        ? "bg-rose-500/5 hover:bg-rose-500/10"
                        : balance > 0
                        ? "hover:bg-muted/40"
                        : "hover:bg-emerald-500/5 opacity-85"
                    }`}
                  >
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="w-8 h-8 border border-border/50 shrink-0">
                          <AvatarFallback
                            className={`text-xs font-bold ${
                              overdue
                                ? "bg-rose-500/20 text-rose-300"
                                : balance > 0
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-emerald-500/20 text-emerald-300"
                            }`}
                          >
                            {getInitials(customer.name)}
                          </AvatarFallback>
                        </Avatar>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-foreground">
                              {customer.name}
                            </span>
                            {overdue && (
                              <Badge
                                variant="destructive"
                                className="text-[9px] px-1.5 py-0 bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                              >
                                <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> Overdue
                              </Badge>
                            )}
                            {balance === 0 && (
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1.5 py-0 border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                              >
                                <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Settled
                              </Badge>
                            )}
                          </div>
                          {customer.aliases && customer.aliases.length > 0 && (
                            <p className="text-[10px] text-muted-foreground/70">
                              AKA: {customer.aliases.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-right py-2.5">
                      <span
                        className={`text-xs font-bold tabular-nums ${
                          overdue
                            ? "text-rose-400"
                            : balance > 0
                            ? "text-amber-400"
                            : "text-emerald-400 font-medium"
                        }`}
                      >
                        Rs. {balance.toLocaleString()}
                      </span>
                    </TableCell>

                    <TableCell className="text-right py-2.5">
                      <div className="flex items-center justify-end gap-1 text-muted-foreground text-[11px]">
                        <Clock className="w-3 h-3 opacity-60" />
                        <span>{formatDate(customer.last_transaction_at)}</span>
                      </div>
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
