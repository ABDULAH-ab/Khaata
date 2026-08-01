"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Bot, 
  User, 
  Send, 
  Sparkles, 
  Receipt, 
  AlertCircle, 
  ArrowRight,
  TrendingDown,
  TrendingUp,
  RotateCcw
} from "lucide-react";
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
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const promptSuggestions = [
    { text: "Ali took milk Rs 150", icon: TrendingUp, label: "Charge customer" },
    { text: "Sara cleared her tab", icon: TrendingDown, label: "Settle tab" },
    { text: "Who owes me money?", icon: AlertCircle, label: "Check overdue" },
    { text: "Ali took bread 80, Sara paid 500", icon: Receipt, label: "Multi-transaction" },
  ];

  return (
    <div className="flex flex-col h-full bg-background/50">
      {/* Panel Header */}
      <div className="px-5 py-4 border-b border-border/40 bg-card/30 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold tracking-wide">AI Khata Assistant</h2>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                LangGraph Deep Agent
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Speak shop talk to automatically record charges & payments
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setMessages([]);
              setConversationHistory([]);
            }}
            className="text-xs text-muted-foreground hover:text-foreground h-8 px-2"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Clear Chat
          </Button>
        )}
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 px-5 py-4">
        <div ref={scrollRef} className="space-y-4 max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in-50 duration-500">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary/20 to-emerald-500/20 border border-primary/20 flex items-center justify-center text-primary mb-4 shadow-lg shadow-primary/5">
                <Sparkles className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <h3 className="text-base font-semibold mb-1">How can I help your shop today?</h3>
              <p className="text-xs text-muted-foreground max-w-sm mb-6 leading-relaxed">
                Tell me what customer bought on credit or paid back. I will look up their balance, handle ambiguous names, and keep your ledger updated.
              </p>

              {/* Quick Prompts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg">
                {promptSuggestions.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => sendMessage(item.text)}
                      className="group flex items-center justify-between p-3 rounded-xl border border-border/50 bg-card/40 hover:bg-card hover:border-primary/40 transition-all text-left shadow-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground">{item.text}</p>
                          <p className="text-[10px] text-muted-foreground">{item.label}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 ${
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <Avatar className="w-7 h-7 border border-border/50 shrink-0">
                <AvatarFallback className={msg.role === "user" ? "bg-primary text-primary-foreground text-xs" : "bg-emerald-500/20 text-emerald-400 text-xs"}>
                  {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </AvatarFallback>
              </Avatar>

              <div className={`flex flex-col max-w-[82%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <Card
                  className={`px-4 py-3 text-xs leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground border-primary/50 rounded-2xl rounded-tr-xs"
                      : "bg-card/80 border-border/50 text-card-foreground rounded-2xl rounded-tl-xs backdrop-blur-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </Card>
                <span className="text-[10px] text-muted-foreground/60 px-1 mt-1">
                  {msg.role === "user" ? "Shopkeeper" : "Khata Agent"}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3">
              <Avatar className="w-7 h-7 border border-border/50 shrink-0">
                <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xs">
                  <Bot className="w-3.5 h-3.5 animate-spin" />
                </AvatarFallback>
              </Avatar>
              <Card className="px-4 py-3 bg-card/80 border-border/50 rounded-2xl rounded-tl-xs shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  <span className="text-xs text-muted-foreground font-medium">
                    Planning & executing tools...
                  </span>
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Box */}
      <div className="p-4 border-t border-border/40 bg-card/20 backdrop-blur-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-center gap-2 max-w-3xl mx-auto"
        >
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell Khata Assistant (e.g., 'Ali took milk 150', 'Sara paid tab')..."
              disabled={isLoading}
              className="pr-10 bg-card/60 border-border/50 focus-visible:ring-primary/40 text-xs h-10 rounded-xl"
              id="chat-input"
            />
          </div>
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            size="sm"
            className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs shadow-md shadow-primary/20"
            id="send-button"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" /> Send
          </Button>
        </form>
      </div>
    </div>
  );
}
