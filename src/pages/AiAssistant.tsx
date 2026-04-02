import { useState, useRef, useEffect, useCallback } from "react";
import { useCrm } from "@/contexts/CrmContext";
import { generateAiResponse } from "@/lib/ai-engine";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Send, Sparkles, TrendingUp, Users, DollarSign,
  MessageSquare, Zap, RotateCcw, Copy, Check, Lightbulb, BarChart3
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

const SUGGESTIONS = [
  { icon: TrendingUp, text: "¿Cómo va el pipeline?" },
  { icon: Users, text: "Resumen de contactos" },
  { icon: DollarSign, text: "¿Cuál es el valor total de los deals?" },
  { icon: MessageSquare, text: "¿Cuántos mensajes sin leer tengo?" },
  { icon: Zap, text: "¿Quién es mi mejor prospecto?" },
  { icon: Sparkles, text: "Dame un análisis completo del CRM" },
  { icon: Lightbulb, text: "Dame recomendaciones" },
  { icon: BarChart3, text: "Métricas de rendimiento" },
];

const renderContent = (text: string) => {
  return text.split("\n").map((line, i) => {
    let el = line;
    el = el.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>');
    el = el.replace(/\*(.*?)\*/g, '<em class="text-muted-foreground italic">$1</em>');
    el = el.replace(/~~(.*?)~~/g, '<del class="line-through text-muted-foreground/60">$1</del>');
    if (el.trim() === "---") return <hr key={i} className="border-border/50 my-2" />;
    if (!el.trim()) return <div key={i} className="h-1.5" />;
    return <p key={i} className="text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: el }} />;
  });
};

export default function AiAssistantPage() {
  const { contacts, deals, conversations } = useCrm();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isTyping]);

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
    }, 500 + Math.random() * 700);
  }, [input, isTyping, contacts, deals, conversations]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content.replace(/\*\*/g, "").replace(/[•📊👥💰📬🏆📝🔍📈🤖✅💡⭐💬🎯🏷️📡📧💎⚠️🔄📱📞👋🕐💎]/g, ""));
    setCopiedId(id);
    toast.success("Copiado al portapapeles");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTime = (d: string) => new Date(d).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            <Bot size={20} className="text-primary" />
          </motion.div>
          <div>
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              Asistente IA <Sparkles size={12} className="text-primary" />
            </h2>
            <p className="text-2xs text-muted-foreground">Analiza tu CRM en tiempo real · {contacts.length} contactos · {deals.length} deals</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" className="h-7 text-2xs gap-1" onClick={() => { setMessages([]); toast.success("Conversación reiniciada"); }}>
            <RotateCcw size={12} /> Limpiar
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="popLayout">
          {messages.length === 0 ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center h-full min-h-[50vh]"
            >
              <motion.div
                className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4"
                animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              >
                <Bot size={32} className="text-primary" />
              </motion.div>
              <h3 className="text-sm font-semibold text-foreground mb-1">¿En qué puedo ayudarte?</h3>
              <p className="text-2xs text-muted-foreground mb-6 text-center max-w-sm">
                Tengo acceso completo a tus contactos, deals, pipeline, inbox, tareas y notas. Pregúntame lo que necesites.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-w-2xl">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/80 hover:bg-accent border border-border/50 transition-all text-left group"
                    onClick={() => handleSend(s.text)}
                  >
                    <s.icon size={14} className="text-primary shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="text-2xs text-muted-foreground group-hover:text-foreground transition-colors">{s.text}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4 max-w-3xl mx-auto">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] md:max-w-[70%] ${msg.role === "user" ? "" : "flex gap-2.5"}`}>
                    {msg.role === "assistant" && (
                      <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot size={14} className="text-primary" />
                      </div>
                    )}
                    <div>
                      <div className={`rounded-xl px-3.5 py-2.5 ${
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
                      <div className={`flex items-center gap-2 mt-1 ${msg.role === "user" ? "justify-end" : ""}`}>
                        <span className="text-2xs text-muted-foreground/60">{formatTime(msg.timestamp)}</span>
                        {msg.role === "assistant" && (
                          <button onClick={() => handleCopy(msg.id, msg.content)} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                            {copiedId === msg.id ? <Check size={10} className="text-primary" /> : <Copy size={10} />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                    <Bot size={14} className="text-primary" />
                  </div>
                  <div className="bg-secondary border border-border/50 rounded-xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div key={i} className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50"
                          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                          transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <Input
            placeholder="Pregúntame sobre tu CRM... (contactos, deals, pipeline, tareas)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-10 text-xs bg-secondary border-border flex-1"
            disabled={isTyping}
          />
          <Button variant="glow" size="icon" className="h-10 w-10 shrink-0" onClick={() => handleSend()} disabled={!input.trim() || isTyping}>
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
