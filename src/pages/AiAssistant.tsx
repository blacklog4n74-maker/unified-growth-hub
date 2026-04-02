import { useState, useRef, useEffect, useCallback } from "react";
import { useCrm } from "@/contexts/CrmContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Send, Sparkles, TrendingUp, Users, DollarSign,
  MessageSquare, Zap, RotateCcw, Copy, Check
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
  { icon: TrendingUp, text: "¿Cómo va el pipeline?", color: "text-green-400" },
  { icon: Users, text: "Resumen de contactos", color: "text-blue-400" },
  { icon: DollarSign, text: "¿Cuál es el valor total de los deals?", color: "text-yellow-400" },
  { icon: MessageSquare, text: "¿Cuántos mensajes sin leer tengo?", color: "text-purple-400" },
  { icon: Zap, text: "¿Quién es mi mejor prospecto?", color: "text-orange-400" },
  { icon: Sparkles, text: "Dame un análisis completo del CRM", color: "text-primary" },
];

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

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

  const generateResponse = useCallback((query: string): string => {
    const q = query.toLowerCase();

    // Pipeline analysis
    if (q.includes("pipeline") || q.includes("embudo") || q.includes("funnel")) {
      const stages: Record<string, { count: number; value: number }> = {};
      deals.forEach((d) => {
        if (!stages[d.stage]) stages[d.stage] = { count: 0, value: 0 };
        stages[d.stage].count++;
        stages[d.stage].value += d.value;
      });
      const lines = Object.entries(stages).map(([s, v]) => `• **${s}**: ${v.count} deal(s) — ${formatCurrency(v.value)}`);
      const totalValue = deals.reduce((s, d) => s + d.value, 0);
      const weighted = deals.reduce((s, d) => s + d.value * (d.probability / 100), 0);
      return `📊 **Estado del Pipeline**\n\n${lines.join("\n")}\n\n💰 **Valor total**: ${formatCurrency(totalValue)}\n🎯 **Valor ponderado** (por probabilidad): ${formatCurrency(weighted)}\n📈 **Total deals**: ${deals.length}\n\n💡 *Recomendación*: Enfócate en los deals en etapa de Negociación — están más cerca de cerrar.`;
    }

    // Contacts summary
    if (q.includes("contacto") || q.includes("clientes") || q.includes("resumen de contacto")) {
      const byStage: Record<string, number> = {};
      contacts.forEach((c) => { byStage[c.stage] = (byStage[c.stage] || 0) + 1; });
      const lines = Object.entries(byStage).map(([s, n]) => `• **${s}**: ${n}`);
      const totalValue = contacts.reduce((s, c) => s + c.value, 0);
      const topContact = contacts.reduce((max, c) => (c.value > max.value ? c : max), contacts[0]);
      return `👥 **Resumen de Contactos**\n\n${lines.join("\n")}\n\n📊 **Total**: ${contacts.length} contactos\n💰 **Valor acumulado**: ${formatCurrency(totalValue)}\n⭐ **Contacto más valioso**: ${topContact.name} (${topContact.company}) — ${formatCurrency(topContact.value)}\n\n🏷️ *Tags más comunes*: ${[...new Set(contacts.flatMap((c) => c.tags))].join(", ") || "Ninguno"}`;
    }

    // Deal value
    if (q.includes("valor") && (q.includes("deal") || q.includes("negocio") || q.includes("total"))) {
      const total = deals.reduce((s, d) => s + d.value, 0);
      const avg = total / (deals.length || 1);
      const biggest = deals.reduce((max, d) => (d.value > max.value ? d : max), deals[0]);
      const closed = deals.filter((d) => d.stage === "Cerrado");
      const closedValue = closed.reduce((s, d) => s + d.value, 0);
      return `💰 **Análisis de Valor**\n\n• **Valor total del pipeline**: ${formatCurrency(total)}\n• **Valor promedio por deal**: ${formatCurrency(avg)}\n• **Deal más grande**: ${biggest.title} (${biggest.company}) — ${formatCurrency(biggest.value)}\n• **Deals cerrados**: ${closed.length} por ${formatCurrency(closedValue)}\n• **Deals abiertos**: ${deals.length - closed.length}`;
    }

    // Unread messages
    if (q.includes("sin leer") || q.includes("unread") || q.includes("mensaje") || q.includes("inbox")) {
      const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);
      const unreadConvs = conversations.filter((c) => c.unread > 0);
      if (totalUnread === 0) return "✅ **¡Todo al día!** No tienes mensajes sin leer.";
      const lines = unreadConvs.map((c) => `• **${c.contactName}** (${c.channel}): ${c.unread} mensaje(s) — *"${c.lastMessage}"*`);
      return `📬 **Mensajes sin leer: ${totalUnread}**\n\n${lines.join("\n")}\n\n💡 *Te recomiendo responder primero a los de mayor valor comercial.*`;
    }

    // Best prospect
    if (q.includes("mejor prospecto") || q.includes("prospecto") || q.includes("oportunidad")) {
      const openDeals = deals.filter((d) => d.stage !== "Cerrado");
      const scored = openDeals.map((d) => ({ ...d, score: d.value * (d.probability / 100) })).sort((a, b) => b.score - a.score);
      if (scored.length === 0) return "No hay deals abiertos en el pipeline.";
      const top = scored[0];
      const contact = contacts.find((c) => c.id === top.contactId);
      return `🏆 **Mejor Prospecto**\n\n• **Deal**: ${top.title}\n• **Contacto**: ${top.contactName} (${top.company})\n• **Valor**: ${formatCurrency(top.value)}\n• **Probabilidad**: ${top.probability}%\n• **Valor ponderado**: ${formatCurrency(top.score)}\n• **Etapa**: ${top.stage}\n${contact ? `• **Email**: ${contact.email}\n• **Tags**: ${contact.tags.join(", ") || "Ninguno"}` : ""}\n\n💡 *Este es tu deal con mayor potencial de cierre. ¡Priorízalo!*`;
    }

    // Full analysis
    if (q.includes("análisis completo") || q.includes("analisis completo") || q.includes("todo") || q.includes("resumen general") || q.includes("completo")) {
      const totalContacts = contacts.length;
      const totalDeals = deals.length;
      const totalValue = deals.reduce((s, d) => s + d.value, 0);
      const weighted = deals.reduce((s, d) => s + d.value * (d.probability / 100), 0);
      const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);
      const convCount = conversations.length;
      const closedDeals = deals.filter((d) => d.stage === "Cerrado").length;
      const openDeals = totalDeals - closedDeals;
      const topDeal = deals.reduce((max, d) => (d.value > max.value ? d : max), deals[0]);
      const tasksPending = contacts.reduce((s, c) => s + c.tasks.filter((t) => !t.completed).length, 0);
      const tasksComplete = contacts.reduce((s, c) => s + c.tasks.filter((t) => t.completed).length, 0);

      return `🤖 **Análisis Completo del CRM**\n\n---\n\n👥 **Contactos**: ${totalContacts}\n📊 **Deals**: ${totalDeals} (${openDeals} abiertos, ${closedDeals} cerrados)\n💰 **Valor total pipeline**: ${formatCurrency(totalValue)}\n🎯 **Valor ponderado**: ${formatCurrency(weighted)}\n💬 **Conversaciones**: ${convCount} (${totalUnread} sin leer)\n✅ **Tareas**: ${tasksComplete} completadas, ${tasksPending} pendientes\n\n---\n\n⭐ **Deal destacado**: ${topDeal.title} (${topDeal.company}) — ${formatCurrency(topDeal.value)}\n\n---\n\n**💡 Recomendaciones:**\n1. ${totalUnread > 0 ? `Tienes ${totalUnread} mensajes sin leer — responde para mantener engagement.` : "¡Inbox al día! Excelente trabajo."}\n2. ${tasksPending > 0 ? `Hay ${tasksPending} tareas pendientes. Revísalas para no perder seguimiento.` : "Todas las tareas están al día."}\n3. Enfócate en los deals de Negociación para maximizar cierres este mes.\n4. Considera agregar más contactos vía LinkedIn o eventos para llenar el embudo.`;
    }

    // Contact search
    const contactMatch = contacts.find((c) => q.includes(c.name.toLowerCase()) || q.includes(c.company.toLowerCase()));
    if (contactMatch) {
      const contactDeals = deals.filter((d) => d.contactId === contactMatch.id);
      const contactConvs = conversations.filter((cv) => cv.contactId === contactMatch.id);
      return `👤 **${contactMatch.name}**\n\n• **Empresa**: ${contactMatch.company}\n• **Email**: ${contactMatch.email}\n• **Teléfono**: ${contactMatch.phone}\n• **Etapa**: ${contactMatch.stage}\n• **Valor**: ${formatCurrency(contactMatch.value)}\n• **Tags**: ${contactMatch.tags.join(", ") || "Ninguno"}\n• **Fuente**: ${contactMatch.source || "N/A"}\n\n📊 **Deals**: ${contactDeals.length} (${contactDeals.map((d) => `${d.title}: ${formatCurrency(d.value)}`).join(", ") || "Ninguno"})\n💬 **Conversaciones**: ${contactConvs.length}\n📝 **Notas**: ${contactMatch.notes.length}\n✅ **Tareas**: ${contactMatch.tasks.filter((t) => !t.completed).length} pendientes`;
    }

    // Task queries
    if (q.includes("tarea") || q.includes("pendiente")) {
      const allTasks = contacts.flatMap((c) => c.tasks.map((t) => ({ ...t, contactName: c.name })));
      const pending = allTasks.filter((t) => !t.completed);
      const completed = allTasks.filter((t) => t.completed);
      if (allTasks.length === 0) return "📝 No hay tareas registradas en el CRM.";
      const lines = pending.map((t) => `• **${t.title}** — ${t.contactName} (vence: ${t.dueDate})`);
      return `📝 **Tareas del CRM**\n\n**Pendientes (${pending.length}):**\n${lines.join("\n") || "Ninguna"}\n\n**Completadas**: ${completed.length}\n\n💡 *Mantén tus tareas al día para no perder oportunidades.*`;
    }

    // Help / default
    return `🤖 Soy tu **Asistente de IA del CRM**. Puedo ayudarte con:\n\n• 📊 **Pipeline** — Estado del embudo de ventas\n• 👥 **Contactos** — Resumen y búsqueda de contactos\n• 💰 **Deals** — Valor y análisis de negocios\n• 📬 **Inbox** — Mensajes sin leer\n• 🏆 **Prospectos** — Tu mejor oportunidad\n• 📝 **Tareas** — Pendientes y completadas\n• 🔍 **Buscar contacto** — Pregunta por nombre o empresa\n• 📈 **Análisis completo** — Visión 360° del CRM\n\n*Pregúntame lo que necesites y te daré información en tiempo real.*`;
  }, [contacts, deals, conversations]);

  const handleSend = useCallback((text?: string) => {
    const msg = (text || input).trim();
    if (!msg) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: msg,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate typing delay
    const delay = 600 + Math.random() * 800;
    setTimeout(() => {
      const response = generateResponse(msg);
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, delay);
  }, [input, generateResponse]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content.replace(/\*\*/g, "").replace(/[•📊👥💰📬🏆📝🔍📈🤖✅💡⭐💬🎯🏷️]/g, ""));
    setCopiedId(id);
    toast.success("Copiado al portapapeles");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    setMessages([]);
    toast.success("Conversación reiniciada");
  };

  const formatTime = (d: string) => new Date(d).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });

  // Simple markdown-like rendering
  const renderContent = (text: string) => {
    return text.split("\n").map((line, i) => {
      let el = line;
      // Bold
      el = el.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>');
      // Italic
      el = el.replace(/\*(.*?)\*/g, '<em class="text-muted-foreground italic">$1</em>');
      // Horizontal rule
      if (el.trim() === "---") return <hr key={i} className="border-border/50 my-2" />;
      if (!el.trim()) return <div key={i} className="h-1.5" />;
      return <p key={i} className="text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: el }} />;
    });
  };

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
              Asistente IA
              <Sparkles size={12} className="text-primary" />
            </h2>
            <p className="text-2xs text-muted-foreground">Analiza tu CRM en tiempo real</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" className="h-7 text-2xs gap-1" onClick={handleClear}>
            <RotateCcw size={12} /> Limpiar
          </Button>
        )}
      </div>

      {/* Messages area */}
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
              <p className="text-2xs text-muted-foreground mb-6 text-center max-w-xs">
                Pregúntame sobre contactos, deals, pipeline, inbox o pide un análisis completo del CRM.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-w-lg">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/80 hover:bg-accent border border-border/50 transition-all text-left group"
                    onClick={() => handleSend(s.text)}
                  >
                    <s.icon size={14} className={`${s.color} shrink-0 group-hover:scale-110 transition-transform`} />
                    <span className="text-2xs text-muted-foreground group-hover:text-foreground transition-colors">{s.text}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
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
                          <button
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                          >
                            {copiedId === msg.id ? <Check size={10} className="text-primary" /> : <Copy size={10} />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2.5"
                >
                  <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                    <Bot size={14} className="text-primary" />
                  </div>
                  <div className="bg-secondary border border-border/50 rounded-xl rounded-bl-sm px-4 py-3">
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
            </div>
          )}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <Input
            placeholder="Pregúntame sobre tu CRM..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-10 text-xs bg-secondary border-border flex-1"
            disabled={isTyping}
          />
          <Button
            variant="glow"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
          >
            <Send size={16} />
          </Button>
        </div>
        <p className="text-center text-2xs text-muted-foreground/40 mt-2">
          IA analiza datos en tiempo real del CRM • Sin conexión a APIs externas
        </p>
      </div>
    </div>
  );
}
