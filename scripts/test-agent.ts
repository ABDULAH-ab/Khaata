import { runAgent } from "../src/lib/agent/graph";

async function test() {
  console.log("🚀 Testing LangGraph Deep Agent Harness...");
  
  const testMessages = [
    "Ali took milk 150, Sara paid her tab",
    "Who owes me money?",
    "Ali paid 200",
  ];

  for (const msg of testMessages) {
    console.log(`\n----------------------------------------`);
    console.log(`📥 Input message: "${msg}"`);
    try {
      const result = await runAgent(msg, []);
      console.log(`🤖 Agent Response:\n${result.response}`);
    } catch (err: any) {
      console.error(`❌ Agent Error:`, err.message || err);
    }
  }
}

test();
