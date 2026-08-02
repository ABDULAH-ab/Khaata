import { findCustomer } from "../src/lib/tools/find-customer";

async function test() {
  console.log("🔍 Testing findCustomer('Ali')...");
  const result = await findCustomer("Ali");
  console.log("Result status:", result.status);
  if (result.status === "ambiguous") {
    console.log("✅ SUCCESS! Ambiguous candidates found:");
    result.candidates?.forEach((c) => console.log(` - ${c.name} (${c.aliases.join(", ")})`));
  } else if (result.status === "found") {
    console.log("❌ Failed: Returned single match:", result.customer?.name);
  } else {
    console.log("❌ Failed: Returned status:", result.status);
  }
}

test();
