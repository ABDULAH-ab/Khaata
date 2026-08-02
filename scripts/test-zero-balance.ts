import { runAgent } from "../src/lib/agent/graph";

async function test() {
  console.log("🚀 Testing Zero Balance for Abdullah...");

  const input = "Abdullah ka balance 0 krdo";
  console.log(`\n📥 Shopkeeper: "${input}"`);
  const res = await runAgent(input, []);
  console.log(`🤖 Agent Response:\n${res.response}`);
}

test();
