import { runAgent } from "../src/lib/agent/graph";
import type { ChatMessage } from "../src/lib/types";

async function test() {
  console.log("🚀 Testing Roman Urdu Deletion Context Flow...");

  let history: ChatMessage[] = [];

  // Turn 1
  const input1 = "ahmed ka record delete krdo";
  console.log(`\n📥 Shopkeeper: "${input1}"`);
  const res1 = await runAgent(input1, history);
  history = res1.conversationHistory;
  console.log(`🤖 Agent:\n${res1.response}`);

  // Turn 2
  const input2 = "system se remove krna hai";
  console.log(`\n📥 Shopkeeper: "${input2}"`);
  const res2 = await runAgent(input2, history);
  console.log(`🤖 Agent:\n${res2.response}`);
}

test();
