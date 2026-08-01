import { createServerSupabaseClient } from "@/lib/supabase";
import type { UpdateLedgerResult } from "@/lib/types";

/**
 * update_ledger(customer_id, type, amount, description, raw_input)
 *
 * Inserts a transaction row, updates customers.balance and last_transaction_at.
 * Balance logic: charge → balance += amount, payment → balance -= amount.
 * Returns new balance for the agent to confirm back to the user.
 */
export async function updateLedger(
  customerId: string,
  type: "charge" | "payment",
  amount: number,
  description: string,
  rawInput: string
): Promise<UpdateLedgerResult> {
  const supabase = createServerSupabaseClient();

  if (amount <= 0) {
    return { status: "error", error: "Amount must be greater than 0" };
  }

  // 1. Fetch current customer to get existing balance
  const { data: customer, error: fetchError } = await supabase
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .single();

  if (fetchError || !customer) {
    return {
      status: "error",
      error: `Customer not found: ${customerId}`,
    };
  }

  // 2. Calculate new balance
  const currentBalance = Number(customer.balance);
  const newBalance =
    type === "charge"
      ? currentBalance + amount
      : currentBalance - amount;

  // 3. Insert transaction
  const { data: transaction, error: txnError } = await supabase
    .from("transactions")
    .insert({
      customer_id: customerId,
      type,
      amount,
      description,
      raw_input: rawInput,
    })
    .select()
    .single();

  if (txnError) {
    return {
      status: "error",
      error: `Failed to insert transaction: ${txnError.message}`,
    };
  }

  // 4. Update customer balance and last_transaction_at
  const { error: updateError } = await supabase
    .from("customers")
    .update({
      balance: newBalance,
      last_transaction_at: new Date().toISOString(),
    })
    .eq("id", customerId);

  if (updateError) {
    return {
      status: "error",
      error: `Failed to update balance: ${updateError.message}`,
    };
  }

  return {
    status: "success",
    transaction,
    newBalance,
    customerName: customer.name,
  };
}
