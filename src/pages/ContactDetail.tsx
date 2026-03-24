import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCrm } from "@/contexts/CrmContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Mail, Phone, Building, Calendar, Tag, Plus,
  CheckCircle2, Circle, Trash2, Edit, MapPin, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const stageColor: Record<string, string> = {
  Nuevo: "bg-blue-500/20 text-blue-400",
  Contactado: "bg-yellow-500/20 text-yellow-400",
  Calificado: "bg-primary/20 text-primary",
  Propuesta: "bg-orange-500/20 text-orange-400",
  Negociación: "bg-purple-500/20 text-purple-400",
  Cerrado: "bg-primary/20 text-primary",
};

const activityIcon = (type: string) => {
  const icons: Record<string, string> = { email: "✉️", call: "📞", note: "📝", meeting: "🤝", task: "✅", deal: "💰", sms: "💬" };
  return icons[type] || "📌";
};

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getContact, addNote, addTask, toggleTask, deleteContact, updateContact } = useCrm();
  const contact = getContact(id || "");

  const [newNote, setNewNote] = useState("");
  const [newTask, setNewTask] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  if (!contact) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">Contacto no encontrado</p>
        <Button variant="ghost" className="mt-2 text-xs" onClick={() => navigate("/contacts")}>
          <ArrowLeft size={14} className="mr-1" /> Volver
        </Button>
      </div>
    );
  }

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addNote(contact.id, newNote);
    setNewNote("");
    toast.success("Nota agregada");
  };

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    addTask(contact.id, newTask, taskDue || new Date().toISOString().split("T")[0]);
    setNewTask("");
    setTaskDue("");
    toast.success("Tarea creada");
  };

  const handleDelete = () => {
    deleteContact(contact.id);
    navigate("/contacts");
    toast.success("Contacto eliminado");
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });
  const timeAgo = (d: string) => {
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (mins < 60) return `hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    return `hace ${Math.floor(hrs / 24)}d`;
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/contacts")}>
            <ArrowLeft size={16} />
          </Button>
          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary text-lg font-bold">
            {contact.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{contact.name}</h1>
            <p className="text-xs text-muted-foreground">{contact.company} · {contact.email}</p>
          </div>
          <span className={`text-2xs px-2.5 py-0.5 rounded-full font-medium ml-2 ${stageColor[contact.stage] || ""}`}>
            {contact.stage}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => navigate(`/inbox`)}>
            <Mail size={14} className="mr-1" /> Enviar mensaje
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={handleDelete}>
            <Trash2 size={14} />
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Info Card */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Información</h3>
            {[
              { icon: Mail, label: "Email", value: contact.email },
              { icon: Phone, label: "Teléfono", value: contact.phone },
              { icon: Building, label: "Empresa", value: contact.company },
              { icon: Globe, label: "Fuente", value: contact.source || "—" },
              { icon: Calendar, label: "Creado", value: formatDate(contact.createdAt) },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <item.icon size={14} className="text-muted-foreground shrink-0" />
                <div>
                  <p className="text-2xs text-muted-foreground">{item.label}</p>
                  <p className="text-xs text-foreground">{item.value}</p>
                </div>
              </div>
            ))}
            {contact.tags.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                <Tag size={14} className="text-muted-foreground" />
                <div className="flex flex-wrap gap-1">
                  {contact.tags.map((t) => (
                    <span key={t} className="text-2xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Valor del contacto</h3>
            <p className="text-2xl font-bold text-primary">${contact.value.toLocaleString()}</p>
          </div>
        </motion.div>

        {/* Right: Tabs */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-2"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-secondary mb-4">
              <TabsTrigger value="overview" className="text-xs">Actividad</TabsTrigger>
              <TabsTrigger value="notes" className="text-xs">Notas ({contact.notes.length})</TabsTrigger>
              <TabsTrigger value="tasks" className="text-xs">Tareas ({contact.tasks.length})</TabsTrigger>
            </TabsList>

            {/* Activity Timeline */}
            <TabsContent value="overview" className="space-y-3">
              <div className="rounded-xl border border-border bg-card p-4 max-h-[500px] overflow-y-auto">
                {contact.activities.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">Sin actividad registrada</p>
                ) : (
                  <div className="space-y-1">
                    {contact.activities.map((a, i) => (
                      <motion.div
                        key={a.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-start gap-3 py-2.5 px-2 rounded-lg hover:bg-accent/30 transition-colors"
                      >
                        <span className="text-sm mt-0.5">{activityIcon(a.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground">{a.title}</p>
                          <p className="text-2xs text-muted-foreground">{a.description}</p>
                        </div>
                        <span className="text-2xs text-muted-foreground shrink-0">{timeAgo(a.createdAt)}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Notes */}
            <TabsContent value="notes" className="space-y-3">
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Escribe una nota..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="text-xs bg-secondary border-border min-h-[60px] resize-none"
                  />
                </div>
                <Button variant="glow" size="sm" className="h-7 text-xs" onClick={handleAddNote} disabled={!newNote.trim()}>
                  <Plus size={12} className="mr-1" /> Agregar nota
                </Button>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                <AnimatePresence>
                  {contact.notes.map((n, i) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="rounded-xl border border-border bg-card p-3"
                    >
                      <p className="text-xs text-foreground whitespace-pre-wrap">{n.text}</p>
                      <p className="text-2xs text-muted-foreground mt-2">{n.author} · {timeAgo(n.createdAt)}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {contact.notes.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Sin notas</p>}
              </div>
            </TabsContent>

            {/* Tasks */}
            <TabsContent value="tasks" className="space-y-3">
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nueva tarea..."
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    className="h-8 text-xs bg-secondary border-border flex-1"
                  />
                  <Input
                    type="date"
                    value={taskDue}
                    onChange={(e) => setTaskDue(e.target.value)}
                    className="h-8 text-xs bg-secondary border-border w-36"
                  />
                  <Button variant="glow" size="sm" className="h-8 text-xs" onClick={handleAddTask} disabled={!newTask.trim()}>
                    <Plus size={12} />
                  </Button>
                </div>
              </div>
              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                <AnimatePresence>
                  {contact.tasks.map((t, i) => (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="rounded-lg border border-border bg-card p-3 flex items-center gap-3 hover:bg-accent/30 transition-colors cursor-pointer"
                      onClick={() => toggleTask(contact.id, t.id)}
                    >
                      {t.completed ? (
                        <CheckCircle2 size={16} className="text-primary shrink-0" />
                      ) : (
                        <Circle size={16} className="text-muted-foreground shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs ${t.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {t.title}
                        </p>
                      </div>
                      <span className="text-2xs text-muted-foreground">{t.dueDate}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {contact.tasks.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Sin tareas</p>}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
