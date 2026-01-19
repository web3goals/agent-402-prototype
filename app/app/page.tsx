"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Content } from "@google/genai";

interface ChatMessage extends Content {
  id: string;
}

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>(
    undefined,
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      parts: [{ text: input }],
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, conversationId }),
      });

      const data = await response.json();

      if (data.isSuccess && data.data) {
        if (data.data.conversationId) {
          setConversationId(data.data.conversationId);
        }
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: data.data.role || "model",
          parts: data.data.parts || [{ text: data.data.content }],
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        // Handle error case
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "model",
          parts: [{ text: "Sorry, something went wrong. Please try again." }],
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Failed to send message", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "model",
        parts: [{ text: "Network error. Please check your connection." }],
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-(--spacing(16)))] w-full max-w-3xl mx-auto p-4">
      <Card className="flex-1 mb-4 p-4 overflow-hidden flex flex-col bg-background border-border">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground mt-10">
                <p>Start a conversation with the AI Agent.</p>
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.role === "model" && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/bot-avatar.png" alt="AI" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`p-3 rounded-lg max-w-[80%] whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="text-sm leading-relaxed">
                    {m.parts?.map((p) => p.text).join("")}
                  </p>
                </div>

                {m.role === "user" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>ME</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce delay-75" />
                    <div className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce delay-150" />
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </Card>

      <div className="flex gap-2">
        <Input
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSend()}
          disabled={isLoading}
          autoFocus
        />
        <Button onClick={handleSend} disabled={isLoading}>
          {isLoading ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
}
