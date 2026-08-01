import { createServerSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    const { data: customers, error } = await supabase
      .from("customers")
      .select("*")
      .order("balance", { ascending: false });

    if (error) {
      return Response.json(
        { error: `Failed to fetch ledger: ${error.message}` },
        { status: 500 }
      );
    }

    return Response.json({ customers: customers || [] });
  } catch (error) {
    console.error("Ledger fetch error:", error);
    return Response.json(
      { error: "Failed to fetch ledger data" },
      { status: 500 }
    );
  }
}
