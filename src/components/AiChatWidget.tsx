import { useState, useRef, useEffect, useCallback } from "react";
import { useCrm } from "@/contexts/CrmContext";
import { generateAiResponse } from "@/lib/ai-engine";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Send, Sparkles, X, RotateCcw, Copy, Check, Minus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  "¿Cómo va el pipeline?",
  "Resumen de contactos",
  "¿Qué tareas pendientes tengo?",
  "Dame recomendaciones",
];

const renderContent = (text: string) => {
  return text.split("\n").map((line, i) => {
    let el = line;
    el = el.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>');
    el = el.replace(/\*(.*?)\*/g, '<em class="text-muted-foreground italic">$1</em>');
    el = el.replace(/~~(.*?)~~/g, '<del class="line-through text-muted-foreground/60">$1</del>');
    if (el.trim() === "---") return <hr key={i} className="border-border/50 my-2" />;
    if (!el.trim()) return <div key={i} className="h-1" />;
    return <p key={i} className="text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: el }} />;
  });
};

export default function AiChatWidget() {
  const { contacts, deals, conversations } = useCrm();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && !minimized) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isTyping, open, minimized]);

  const handleSend = useCallback((text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isTyping) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(), role: "user", content: msg, timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response = generateAiResponse(msg, { contacts, deals, conversations });
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(), role: "assistant", content: response, timestamp: new Date().toISOString(),
      }]);
      setIsTyping(false);
    }, 500 + Math.random() * 600);
  }, [input, isTyping, contacts, deals, conversations]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content.replace(/\*\*/g, "").replace(/[•📊👥💰📬🏆📝🔍📈🤖✅💡⭐💬🎯🏷️📡📧💎⚠️🔄📱📞👋🕐💎]/g, ""));
    setCopiedId(id);
    toast.success("Copiado");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTime = (d: string) => new Date(d).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setOpen(true); setMinimized(false); }}
            className="fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:shadow-xl hover:shadow-primary/40 transition-shadow"
          >
            <Bot size={22} />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: "2s" }} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-5 right-5 z-50 w-[380px] max-w-[calc(100vw-2.5rem)] rounded-2xl border border-border bg-card shadow-2xl shadow-black/30 flex flex-col overflow-hidden"
            style={{ height: minimized ? "auto" : "min(520px, calc(100vh - 6rem))" }}
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-card">
              <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Bot size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-semibold text-foreground flex items-center gap-1">
                  Asistente IA <Sparkles size={10} className="text-primary" />
                </h3>
                <p className="text-2xs text-muted-foreground">CRM en tiempo real</p>
              </div>
              <div className="flex items-center gap-0.5">
                {messages.length > 0 && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setMessages([]); toast.success("Conversación reiniciada"); }}>
                    <RotateCcw size={12} />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMinimized(!minimized)}>
                  <Minus size={12} />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                  <X size={12} />
                </Button>
              </div>
            </div>

            {!minimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-8">
                      <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 4 }}
                        className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3"
                      >
                        <Bot size={24} className="text-primary" />
                      </motion.div>
                      <p className="text-xs font-medium text-foreground mb-1">¿En qué te ayudo?</p>
                      <p className="text-2xs text-muted-foreground mb-4 text-center px-4">
                        Pregúntame sobre contactos, deals, pipeline, tareas o pide recomendaciones.
                      </p>
                      <div className="flex flex-wrap gap-1.5 justify-center px-2">
                        {QUICK_PROMPTS.map((p, i) => (
                          <motion.button
                            key={i}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                            onClick={() => handleSend(p)}
                            className="text-2xs px-2.5 py-1.5 rounded-full bg-secondary border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          >
                            {p}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start gap-2"}`}
                      >
                        {msg.role === "assistant" && (
                          <div className="h-6 w-6 rounded-md bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Bot size={12} className="text-primary" />
                          </div>
                        )}
                        <div className="flex flex-col max-w-[80%]">
                          <div className={`rounded-xl px-3 py-2 ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-secondary border border-border/50 rounded-bl-sm"
                          }`}>
                            {msg.role === "user" ? (
                              <p className="text-xs">{msg.content}</p>
                            ) : (
                              <div className="space-y-0.5">{renderContent(msg.content)}</div>
                            )}
                          </div>
                          <div className={`flex items-center gap-1.5 mt-0.5 ${msg.role === "user" ? "justify-end" : ""}`}>
                            <span className="text-2xs text-muted-foreground/50">{formatTime(msg.timestamp)}</span>
                            {msg.role === "assistant" && (
                              <button onClick={() => handleCopy(msg.id, msg.content)} className="text-muted-foreground/30 hover:text-muted-foreground transition-colors">
                                {copiedId === msg.id ? <Check size={9} className="text-primary" /> : <Copy size={9} />}
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}

                  {isTyping && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                      <div className="h-6 w-6 rounded-md bg-primary/20 flex items-center justify-center shrink-0">
                        <Bot size={12} className="text-primary" />
                      </div>
                      <div className="bg-secondary border border-border/50 rounded-xl rounded-bl-sm px-3 py-2">
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50"
                              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                              transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={endRef} />
                </div>

                {/* Input */}
                <div className="px-3 py-2.5 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Pregúntame algo..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="h-8 text-xs bg-secondary border-border flex-1"
                      disabled={isTyping}
                    />
                    <Button variant="glow" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleSend()} disabled={!input.trim() || isTyping}>
                      <Send size={14} />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
