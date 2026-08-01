"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import type { ChatMessage } from "@/lib/types";

interface ChatPanelProps {
  onLedgerUpdate: () => void;
}

export function ChatPanel({ onLedgerUpdate }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>(
    []
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    // Add user message immediately
    const userMsg: ChatMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
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

      // Trigger ledger refresh
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-lg">
            💬
          </div>
          <div>
            <h2 className="text-sm font-semibold">Chat</h2>
            <p className="text-xs text-muted-foreground">
              Tell me about transactions
            </p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div ref={scrollRef} className="space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-3xl mb-4">
                📒
              </div>
              <h3 className="text-sm font-medium mb-1">
                Khata Assistant
              </h3>
              <p className="text-xs text-muted-foreground max-w-[250px] leading-relaxed">
                Try saying things like:
              </p>
              <div className="mt-3 space-y-1.5">
                {[
                  '"Ali took milk 150"',
                  '"Sara paid her whole tab"',
                  '"Who owes me money?"',
                  '"Ali took rice 200, Fatima paid 100"',
                ].map((example) => (
                  <button
                    key={example}
                    onClick={() => {
                      setInput(example.replace(/"/g, ""));
                      inputRef.current?.focus();
                    }}
                    className="block w-full text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <Card
                className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed shadow-none ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground border-primary/50"
                    : "bg-muted/50 border-border/50"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </Card>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <Card className="px-3.5 py-2.5 bg-muted/50 border-border/50 shadow-none">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="p-4 border-t border-border/50">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Ali took milk 150..."
            disabled={isLoading}
            className="flex-1 bg-muted/30 border-border/50 text-sm"
            id="chat-input"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            size="sm"
            className="px-4"
            id="send-button"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
