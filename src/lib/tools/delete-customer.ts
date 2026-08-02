import { createServerSupabaseClient } from "@/lib/supabase";

export interface DeleteCustomerResult {
  status: "success" | "error";
  customerName?: string;
  error?: string;
}

/**
 * delete_customer(customer_id: string)
 *
 * Removes a customer and their associated transactions from the database.
 */
export async function deleteCustomer(
  customerId: string
): Promise<DeleteCustomerResult> {
  const supabase = createServerSupabaseClient();

  // 1. Fetch customer name for audit/confirmation response
  const { data: customer } = await supabase
    .from("customers")
    .select("name")
    .eq("id", customerId)
    .single();

  const customerName = customer?.name || "Customer";

  // 2. Delete transactions first (due to foreign key constraint)
  const { error: txnDeleteError } = await supabase
    .from("transactions")
    .delete()
    .eq("customer_id", customerId);

  if (txnDeleteError) {
    console.error("Error deleting customer transactions:", txnDeleteError);
  }

  // 3. Delete customer record
  const { error: custDeleteError } = await supabase
    .from("customers")
    .delete()
    .eq("id", customerId);

  if (custDeleteError) {
    return {
      status: "error",
      error: `Failed to delete customer: ${custDeleteError.message}`,
    };
  }

  return { status: "success", customerName };
}
