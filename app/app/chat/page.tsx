"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { SmileIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// TODO: Render markdown messages properly
export default function ChatPage() {
  const [messages, setMessages] = useState<BaseMessage[]>([]);
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

    const userMessage = new HumanMessage(input);

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      // Create payload with message history
      // We map the BaseMessages to a simple format for the API
      const payloadMessages = newMessages.map((m) => ({
        type: m.type, // "human" or "ai"
        content: m.content,
      }));

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payloadMessages }),
      });

      const data = await response.json();

      if (data.isSuccess && data.data) {
        const aiMessage = new AIMessage(data.data.content);
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        // Handle error case
        const errorMessage = new AIMessage(
          "Sorry, something went wrong. Please try again.",
        );
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Failed to send message", error);
      const errorMessage = new AIMessage(
        "Network error. Please check your connection.",
      );
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto h-[calc(100vh-(--spacing(42)))] flex flex-col px-4 py-8">
      {/* Messages */}
      <Card className="flex-1 mb-4 p-4 overflow-hidden flex flex-col bg-background border-border">
        <ScrollArea className="flex-1 h-full">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground mt-10">
                <p>Start a conversation with Agent 402</p>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.type === "human" ? "justify-end" : "justify-start"
                }`}
              >
                {message.type !== "human" && (
                  <Avatar className="size-8">
                    <AvatarImage src="/images/avatar.png" alt="Avatar" />
                  </Avatar>
                )}

                <div
                  className={`p-3 rounded-lg max-w-[80%] whitespace-pre-wrap ${
                    message.type === "human"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="text-sm leading-relaxed">
                    {typeof message.content === "string"
                      ? message.content
                      : JSON.stringify(message.content)}
                  </p>
                </div>

                {message.type === "human" && (
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-accent">
                      <SmileIcon className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <Avatar className="size-8">
                  <AvatarImage src="/images/avatar.png" alt="Avatar" />
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

      {/* Input */}
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
