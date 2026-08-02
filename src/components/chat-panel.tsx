"use client";

import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatMessage } from "@/lib/types";

interface ChatPanelProps {
  onLedgerUpdate: () => void;
}

export function ChatPanel({ onLedgerUpdate }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    if (!overrideInput) setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          conversationHistory,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.response,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setConversationHistory(data.conversationHistory || []);

      onLedgerUpdate();
    } catch (error) {
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: `Sorry, something went wrong: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background font-mono">
      {/* Welcome Notification Box (Exact Lovable Screenshot) */}
      <div className="p-4 border-b border-border/40">
        <div className="p-3.5 rounded-lg border border-border bg-card/60 flex items-start gap-3">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981] shrink-0 mt-0.5 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
          <p className="text-xs text-foreground/90 font-mono leading-relaxed tracking-wide">
            Ready. Tell me what happened at the counter — e.g. &quot;Ali took milk 150, Sara paid her tab&quot;.
          </p>
        </div>
      </div>

      {/* Messages Stream (Scrollable container with auto-scroll) */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto min-h-0 px-4 py-3 space-y-4 scroll-smooth"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <span className="text-[9px] text-muted-foreground/60 tracking-[0.2em] uppercase mb-1 px-1 font-mono">
              {msg.role === "user" ? "SHOPKEEPER" : "KHATA AGENT"}
            </span>
            <div
              className={`max-w-[92%] px-3.5 py-2.5 rounded-md border text-xs leading-relaxed font-mono ${
                msg.role === "user"
                  ? "bg-card border-border text-foreground"
                  : "bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981] dark:text-[#34D399]"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex flex-col items-start">
            <span className="text-[9px] text-muted-foreground/60 tracking-[0.2em] uppercase mb-1 px-1 font-mono">
              KHATA AGENT
            </span>
            <div className="px-3.5 py-2.5 rounded-md border border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981] text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                <span>EXECUTING WORKFLOW PLAN...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Terminal Input Box (Exact Lovable Screenshot) */}
      <div className="p-4 border-t border-border/40 bg-background">
        <div className="rounded-lg border border-border bg-card p-3 space-y-2 focus-within:border-foreground/50 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write shop update..."
            rows={3}
            disabled={isLoading}
            className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none font-mono"
            id="chat-input"
          />

          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground/60 font-mono tracking-widest uppercase">
              <span>ENTER TO SEND</span>
            </div>

            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="px-3 py-1 rounded bg-[#10B981] hover:bg-[#059669] disabled:opacity-40 text-[10px] font-bold text-[#141312] uppercase tracking-[0.15em] transition-colors cursor-pointer"
              id="send-button"
            >
              SUBMIT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
