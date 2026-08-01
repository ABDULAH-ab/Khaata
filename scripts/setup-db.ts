// Quick script to test Supabase connectivity and run schema/seed
// Usage: npx tsx scripts/setup-db.ts

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cfwgiytpxgodwtnumyhx.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_v6XDbB3Z2EmgernTqI1SHg_oLcDJ1uL";

async function main() {
  console.log("🔌 Connecting to Supabase...");
  console.log(`   URL: ${supabaseUrl}`);
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test connectivity by trying to query
  console.log("\n📡 Testing connection...");
  const { data, error } = await supabase.from("customers").select("count").limit(1);
  
  if (error) {
    if (error.message.includes("relation") && error.message.includes("does not exist")) {
      console.log("⚠️  Tables don't exist yet. You need to run the schema SQL first.");
      console.log("\n📋 Please go to your Supabase Dashboard:");
      console.log("   1. Open: https://supabase.com/dashboard/project/cfwgiytpxgodwtnumyhx/sql");
      console.log("   2. Paste the contents of supabase/schema.sql and run it");
      console.log("   3. Then paste the contents of supabase/seed.sql and run it");
      console.log("   4. Then run this script again to verify");
    } else {
      console.error("❌ Connection error:", error.message);
    }
    return;
  }

  console.log("✅ Connected to Supabase successfully!");

  // Check if customers exist
  const { data: customers, error: custErr } = await supabase
    .from("customers")
    .select("id, name, balance, last_transaction_at")
    .order("name");

  if (custErr) {
    console.error("❌ Error fetching customers:", custErr.message);
    return;
  }

  if (!customers || customers.length === 0) {
    console.log("⚠️  No customers found. You need to run the seed SQL.");
    console.log("   Paste supabase/seed.sql in the Supabase SQL Editor and run it.");
    return;
  }

  console.log(`\n📊 Found ${customers.length} customers:\n`);
  console.log("   Name             | Balance  | Last Transaction");
  console.log("   -----------------+----------+-----------------");
  for (const c of customers) {
    const lastTxn = c.last_transaction_at
      ? new Date(c.last_transaction_at).toLocaleDateString()
      : "Never";
    console.log(
      `   ${c.name.padEnd(17)}| Rs. ${String(c.balance).padEnd(5)}| ${lastTxn}`
    );
  }

  // Check transactions
  const { count } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true });

  console.log(`\n📝 Total transactions: ${count}`);
  console.log("\n✅ Database setup is complete!");
}

main().catch(console.error);
