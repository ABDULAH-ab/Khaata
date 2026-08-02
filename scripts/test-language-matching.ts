import { runAgent } from "../src/lib/agent/graph";

async function test() {
  console.log("🚀 Testing Language Matching & Balance Response...");

  // Test English input
  const inputEng = "abdullah paid 100";
  console.log(`\n📥 English Input: "${inputEng}"`);
  const resEng = await runAgent(inputEng, []);
  console.log(`🤖 Agent Response:\n${resEng.response}`);

  // Test Roman Urdu input
  const inputUrdu = "abdullah ne 100 de diye";
  console.log(`\n📥 Roman Urdu Input: "${inputUrdu}"`);
  const resUrdu = await runAgent(inputUrdu, []);
  console.log(`🤖 Agent Response:\n${resUrdu.response}`);
}

test();
