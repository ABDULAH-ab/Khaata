import { runAgent } from "../src/lib/agent/graph";

async function test() {
  console.log("🚀 Testing New Customer Creation...");
  
  const msg1 = "Create new customer Tariq";
  console.log(`\n📥 Input: "${msg1}"`);
  const res1 = await runAgent(msg1, []);
  console.log(`🤖 Response:\n${res1.response}`);

  const msg2 = "Create customer Kamran and charge him 500 for flour";
  console.log(`\n📥 Input: "${msg2}"`);
  const res2 = await runAgent(msg2, []);
  console.log(`🤖 Response:\n${res2.response}`);
}

test();
