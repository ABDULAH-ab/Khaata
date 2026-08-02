import { createServerSupabaseClient } from "@/lib/supabase";
import type { Customer, FindCustomerResult } from "@/lib/types";

/**
 * find_customer(name: string)
 *
 * Fuzzy-matches input name against customers.name and aliases.
 * - One clear match → returns customer record
 * - Multiple plausible matches → returns candidates (agent must disambiguate)
 * - No match → signals "not_found" (agent asks to confirm creating one)
 */
export async function findCustomer(name: string): Promise<FindCustomerResult> {
  const supabase = createServerSupabaseClient();
  const searchName = name.trim().toLowerCase();

  if (!searchName) {
    return { status: "not_found", searchedName: name };
  }

  // Fetch all customers to do flexible matching
  const { data: customers, error } = await supabase
    .from("customers")
    .select("*");

  if (error) {
    console.error("Error fetching customers:", error);
    return { status: "not_found", searchedName: name };
  }

  if (!customers || customers.length === 0) {
    return { status: "not_found", searchedName: name };
  }

  // Score each customer by match quality
  const scored = customers
    .map((customer: Customer) => {
      let score = 0;

      const customerNameLower = customer.name.toLowerCase();
      const nameTokens = customerNameLower.split(/\s+/);
      const aliasesLower = (customer.aliases || []).map((a: string) =>
        a.toLowerCase()
      );

      // 1. Exact full name match
      if (customerNameLower === searchName) {
        score = 100;
      }
      // 2. Exact alias match
      else if (aliasesLower.includes(searchName)) {
        score = 90;
      }
      // 3. First name token match (e.g., searching "Ali" matches "Ali Khan" AND "Ali Raza")
      else if (nameTokens.some((t) => t === searchName)) {
        score = 90;
      }
      // 4. Name starts with search term
      else if (customerNameLower.startsWith(searchName)) {
        score = 80;
      }
      // 5. Alias starts with search term
      else if (aliasesLower.some((a: string) => a.startsWith(searchName))) {
        score = 75;
      }
      // 6. Search term contains customer name or token
      else if (nameTokens.some((t) => searchName.includes(t))) {
        score = 50;
      }
      // 7. Substring match
      else if (customerNameLower.includes(searchName)) {
        score = 40;
      }

      return { customer, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return { status: "not_found", searchedName: name };
  }

  // If top score is 100 (exact full name match like "Ali Khan"), return immediately
  if (scored[0].score === 100) {
    return {
      status: "found",
      customer: scored[0].customer,
    };
  }

  // If there's only 1 match or top score is significantly higher than second (> 15 diff)
  if (scored.length === 1 || scored[0].score - scored[1].score > 15) {
    return {
      status: "found",
      customer: scored[0].customer,
    };
  }

  // Multiple plausible close matches → ambiguous!
  const topScore = scored[0].score;
  const candidates = scored
    .filter((s) => topScore - s.score <= 15)
    .map((s) => s.customer);

  return {
    status: "ambiguous",
    candidates,
    searchedName: name,
  };
}
