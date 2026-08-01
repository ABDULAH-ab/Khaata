import { runAgent } from "@/lib/agent/graph";
import type { ChatMessage } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, conversationHistory = [] } = body as {
      message: string;
      conversationHistory: ChatMessage[];
    };

    if (!message || typeof message !== "string" || !message.trim()) {
      return Response.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const result = await runAgent(message.trim(), conversationHistory);

    return Response.json({
      response: result.response,
      conversationHistory: result.conversationHistory,
    });
  } catch (error) {
    console.error("Agent error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      { error: `Agent failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
