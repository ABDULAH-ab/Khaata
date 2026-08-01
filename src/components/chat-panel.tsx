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
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background font-mono border-r border-border/40">
      {/* Top Banner Notice (matching Lovable screenshot) */}
      <div className="p-4 border-b border-border/30 bg-muted/20">
        <div className="flex items-start gap-3">
          <span className="w-2.5 h-2.5 rounded shadow-xs bg-emerald-500 shrink-0 mt-1" />
          <p className="text-xs text-foreground/90 leading-relaxed font-mono">
            Ready. Tell me what happened at the counter — e.g. &quot;Ali took milk 150, Sara paid her tab&quot;.
          </p>
        </div>
      </div>

      {/* Messages List */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div ref={scrollRef} className="space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col ${
                msg.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-widest mb-1 px-1">
                {msg.role === "user" ? "SHOPKEEPER" : "KHATA AGENT"}
              </span>
              <div
                className={`max-w-[90%] px-3.5 py-2.5 rounded border text-xs leading-relaxed font-mono ${
                  msg.role === "user"
                    ? "bg-muted/40 border-border/60 text-foreground"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 dark:text-emerald-400"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex flex-col items-start">
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-widest mb-1 px-1">
                KHATA AGENT
              </span>
              <div className="px-3.5 py-2.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Processing ledger update...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Bottom Terminal Input Area (matching Lovable screenshot) */}
      <div className="p-4 border-t border-border/40 bg-background">
        <div className="rounded-lg border border-border/60 bg-muted/10 p-3 space-y-2 focus-within:border-border transition-colors">
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

          <div className="flex items-center justify-between pt-1 border-t border-border/20">
            <span className="text-[9px] text-muted-foreground/50 font-mono tracking-wider">
              CMD + ENTER
            </span>
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-[10px] font-bold text-white uppercase tracking-widest transition-colors cursor-pointer"
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
