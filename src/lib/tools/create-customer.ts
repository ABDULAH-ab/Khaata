import { createServerSupabaseClient } from "@/lib/supabase";
import type { CreateCustomerResult } from "@/lib/types";

/**
 * create_customer(name: string)
 *
 * Creates a new customer with zero balance.
 * Used when find_customer returns "not_found" and user confirms creation.
 */
export async function createCustomer(
  name: string
): Promise<CreateCustomerResult> {
  const supabase = createServerSupabaseClient();

  const trimmedName = name.trim();
  if (!trimmedName) {
    return { status: "error", error: "Customer name cannot be empty" };
  }

  const { data: customer, error } = await supabase
    .from("customers")
    .insert({
      name: trimmedName,
      aliases: [],
      balance: 0,
    })
    .select()
    .single();

  if (error) {
    return {
      status: "error",
      error: `Failed to create customer: ${error.message}`,
    };
  }

  return { status: "created", customer };
}
