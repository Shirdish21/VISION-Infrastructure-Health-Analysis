"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import type { InfrastructureAsset, InfrastructureAlert } from "@/lib/definitions";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AIAssistant() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your VISION AI Assistant. I can help you understand infrastructure health, identify critical assets, analyze alerts, and provide maintenance recommendations. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<any>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch infrastructure context
  useEffect(() => {
    const unsubAssets = onSnapshot(collection(db, "infrastructure"), (snapshot) => {
      const assets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InfrastructureAsset));
      
      const unsubAlerts = onSnapshot(collection(db, "alerts"), (alertSnapshot) => {
        const alerts = alertSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InfrastructureAlert));
        
        // Build context for AI
        const criticalAssets = assets.filter((a) => a.healthScore < 30);
        const overloadedAssets = assets.filter((a) => {
          if (!a.capacity || !a.usage) return false;
          return ((a.usage / a.capacity) * 100) > 95;
        });
        
        const stats = {
          totalAssets: assets.length,
          criticalAssets: criticalAssets.length,
          overloadedAssets: overloadedAssets.length,
          activeAlerts: alerts.length,
          assets: assets.slice(0, 10).map((a) => ({
            name: a.name,
            type: a.type,
            healthScore: a.healthScore,
            zone: a.zone,
            status: a.status,
          })),
          recentAlerts: alerts.slice(0, 5).map((a) => ({
            type: a.type,
            severity: a.severity,
            assetName: a.assetName,
          })),
        };
        
        setContext(stats);
      });
      
      return () => unsubAlerts();
    });

    return () => unsubAssets();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const messageText = input.trim();
    if (!messageText || loading) return;

    const userMessage: Message = {
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    // Clear input before sending
    setInput("");
    setLoading(true);

    try {
      console.log('Sending message to API:', messageText);
      console.log('Context:', context);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText,
          context: context,
        }),
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        let errorMsg = "Failed to get AI response";
      
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) {
          console.error("Could not parse API error");
        }
      
        console.error("API error:", errorMsg);
        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log('API response data:', data);
      
      if (!data.response) {
        throw new Error('Invalid response format from server');
      }
      
      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to get response from AI assistant: ${errorMsg}`,
      });
      
      const errorMessage: Message = {
        role: "assistant",
        content: "I apologize, but I'm having trouble processing your request right now. The AI service may be temporarily unavailable. Please try again in a moment.",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="border-none shadow-xl ring-1 ring-border overflow-hidden card-glow h-[700px] flex flex-col">
      <CardHeader className="pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl font-bold">AI Infrastructure Assistant</CardTitle>
            <CardDescription>Ask questions about infrastructure health, alerts, and maintenance</CardDescription>
          </div>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
            <Bot className="h-3 w-3 mr-1" />
            AI Powered
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                {message.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-4 bg-muted/30">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about infrastructure health, alerts, or maintenance..."
              className="flex-1"
              disabled={loading}
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="btn-gradient"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Try: "Which assets are critical?" or "Show overloaded infrastructure"
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

