import { useState, useRef, useEffect, useMemo } from "react";
import { useCrm } from "@/contexts/CrmContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Send, Mail, MessageSquare, Phone, MessageCircle,
  Filter, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const channelIcon: Record<string, typeof Mail> = {
  email: Mail, sms: MessageSquare, call: Phone, whatsapp: MessageCircle,
};
const channelLabel: Record<string, string> = {
  email: "Email", sms: "SMS", call: "Llamada", whatsapp: "WhatsApp",
};
const channelColor: Record<string, string> = {
  email: "text-blue-400", sms: "text-primary", call: "text-yellow-400", whatsapp: "text-green-400",
};

export default function InboxPage() {
  const { conversations, sendMessage, markConversationRead } = useCrm();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [newMsg, setNewMsg] = useState("");
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      const matchSearch = !search || c.contactName.toLowerCase().includes(search.toLowerCase()) || c.lastMessage.toLowerCase().includes(search.toLowerCase());
      const matchChannel = channelFilter === "all" || c.channel === channelFilter;
      return matchSearch && matchChannel;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [conversations, search, channelFilter]);

  const selected = conversations.find((c) => c.id === selectedId);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messages.length]);

  useEffect(() => {
    if (selectedId) markConversationRead(selectedId);
  }, [selectedId, markConversationRead]);

  const handleSend = () => {
    if (!newMsg.trim() || !selected) return;
    sendMessage(selected.id, newMsg, selected.channel);
    setNewMsg("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const timeAgo = (d: string) => {
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  const formatTime = (d: string) => new Date(d).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });

  const selectConversation = (id: string) => {
    setSelectedId(id);
    setMobileShowThread(true);
  };

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);

  return (
    <div className="flex h-full">
      {/* Conversation List */}
      <div className={`w-full lg:w-80 border-r border-border flex flex-col bg-card/50 ${mobileShowThread ? "hidden lg:flex" : "flex"}`}>
        {/* Header */}
        <div className="p-3 border-b border-border space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Inbox</h2>
            {totalUnread > 0 && (
              <span className="text-2xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                {totalUnread}
              </span>
            )}
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar conversaciones..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-xs pl-8 bg-secondary border-border"
            />
          </div>
          <div className="flex gap-1">
            {["all", "email", "whatsapp", "sms", "call"].map((ch) => (
              <Button
                key={ch}
                variant={channelFilter === ch ? "default" : "ghost"}
                size="sm"
                className="h-6 text-2xs px-2"
                onClick={() => setChannelFilter(ch)}
              >
                {ch === "all" ? "Todos" : channelLabel[ch]}
              </Button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.map((conv) => {
            const Icon = channelIcon[conv.channel];
            return (
              <motion.div
                key={conv.id}
                whileHover={{ backgroundColor: "hsl(220 16% 14%)" }}
                className={`p-3 border-b border-border/50 cursor-pointer transition-colors ${
                  selectedId === conv.id ? "bg-accent" : ""
                }`}
                onClick={() => selectConversation(conv.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                    {conv.contactName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground truncate">{conv.contactName}</span>
                      <span className="text-2xs text-muted-foreground shrink-0">{timeAgo(conv.timestamp)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Icon size={10} className={channelColor[conv.channel]} />
                      <p className="text-2xs text-muted-foreground truncate">{conv.lastMessage}</p>
                    </div>
                  </div>
                  {conv.unread > 0 && (
                    <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-2xs flex items-center justify-center font-medium shrink-0">
                      {conv.unread}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <MessageSquare size={24} className="mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">Sin conversaciones</p>
            </div>
          )}
        </div>
      </div>

      {/* Thread View */}
      <div className={`flex-1 flex flex-col ${!mobileShowThread && !selectedId ? "hidden lg:flex" : "flex"} ${mobileShowThread ? "flex" : "hidden lg:flex"}`}>
        {selected ? (
          <>
            {/* Thread Header */}
            <div className="p-3 border-b border-border flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" onClick={() => setMobileShowThread(false)}>
                <ArrowLeft size={16} />
              </Button>
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-semibold">
                {selected.contactName.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{selected.contactName}</p>
                <div className="flex items-center gap-1">
                  {(() => { const Icon = channelIcon[selected.channel]; return <Icon size={10} className={channelColor[selected.channel]} />; })()}
                  <span className="text-2xs text-muted-foreground">{channelLabel[selected.channel]} · {selected.contactEmail}</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <AnimatePresence>
                {selected.messages.map((msg, i) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[70%] rounded-xl px-3 py-2 ${
                      msg.sender === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-secondary text-foreground rounded-bl-sm"
                    }`}>
                      <p className="text-xs">{msg.text}</p>
                      <p className={`text-2xs mt-1 ${msg.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEnd} />
            </div>

            {/* Compose */}
            <div className="p-3 border-t border-border">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Escribe un mensaje..."
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-9 text-xs bg-secondary border-border flex-1"
                />
                <Button variant="glow" size="icon" className="h-9 w-9 shrink-0" onClick={handleSend} disabled={!newMsg.trim()}>
                  <Send size={14} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Mail size={32} className="mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Selecciona una conversación</p>
              <p className="text-2xs text-muted-foreground mt-1">Elige un contacto para ver sus mensajes</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
