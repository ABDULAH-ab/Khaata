import { createServerSupabaseClient } from "@/lib/supabase";
import type { Customer, OverdueCustomerResult } from "@/lib/types";

/**
 * get_overdue_customers(days_threshold: number)
 *
 * Returns customers with balance > 0 and last_transaction_at older than threshold days.
 * Used for "who owes me money?" queries and the dashboard overdue widget.
 */
export async function getOverdueCustomers(
  daysThreshold: number = 14
): Promise<OverdueCustomerResult> {
  const supabase = createServerSupabaseClient();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

  const { data: customers, error } = await supabase
    .from("customers")
    .select("*")
    .gt("balance", 0)
    .lt("last_transaction_at", cutoffDate.toISOString())
    .order("balance", { ascending: false });

  if (error) {
    console.error("Error fetching overdue customers:", error);
    return { status: "success", customers: [], daysThreshold };
  }

  return {
    status: "success",
    customers: (customers as Customer[]) || [],
    daysThreshold,
  };
}
