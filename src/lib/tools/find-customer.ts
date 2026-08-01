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
  // (For a small shop with <100 customers, this is fine)
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
      const aliasesLower = (customer.aliases || []).map((a: string) =>
        a.toLowerCase()
      );

      // Exact name match = highest score
      if (customerNameLower === searchName) {
        score = 100;
      }
      // Exact alias match
      else if (aliasesLower.includes(searchName)) {
        score = 90;
      }
      // Name starts with search term
      else if (customerNameLower.startsWith(searchName)) {
        score = 70;
      }
      // Search term starts with name (e.g. searching "Ali Khan" matches "Ali")
      else if (searchName.startsWith(customerNameLower)) {
        score = 60;
      }
      // Alias starts with search term
      else if (aliasesLower.some((a: string) => a.startsWith(searchName))) {
        score = 65;
      }
      // Search term starts with alias
      else if (aliasesLower.some((a: string) => searchName.startsWith(a))) {
        score = 55;
      }
      // Name contains search term
      else if (customerNameLower.includes(searchName)) {
        score = 40;
      }
      // Search term contains name
      else if (searchName.includes(customerNameLower)) {
        score = 35;
      }
      // Alias contains search term
      else if (aliasesLower.some((a: string) => a.includes(searchName))) {
        score = 30;
      }
      // Search term contains alias
      else if (aliasesLower.some((a: string) => searchName.includes(a))) {
        score = 25;
      }

      return { customer, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return { status: "not_found", searchedName: name };
  }

  // If the top score is much higher than the second, it's a clear match
  if (scored.length === 1 || scored[0].score - scored[1].score >= 20) {
    return {
      status: "found",
      customer: scored[0].customer,
    };
  }

  // Multiple close matches → ambiguous
  // Return all candidates with scores within 25 points of the top score
  const topScore = scored[0].score;
  const candidates = scored
    .filter((s) => topScore - s.score <= 25)
    .map((s) => s.customer);

  return {
    status: "ambiguous",
    candidates,
    searchedName: name,
  };
}
