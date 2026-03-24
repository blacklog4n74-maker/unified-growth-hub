import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCrm, CONTACT_STAGES } from "@/contexts/CrmContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, Plus, Eye, Edit, Trash2, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";

const stageColor: Record<string, string> = {
  Nuevo: "bg-blue-500/20 text-blue-400",
  Contactado: "bg-yellow-500/20 text-yellow-400",
  Calificado: "bg-primary/20 text-primary",
  Propuesta: "bg-orange-500/20 text-orange-400",
  Negociación: "bg-purple-500/20 text-purple-400",
  Cerrado: "bg-primary/20 text-primary",
};

export default function ContactsPage() {
  const { contacts, addContact, updateContact, deleteContact } = useCrm();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", stage: "Nuevo", value: "" });

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      const matchSearch = !search || [c.name, c.email, c.company, c.phone].some((f) => f.toLowerCase().includes(search.toLowerCase()));
      const matchStage = stageFilter === "all" || c.stage === stageFilter;
      return matchSearch && matchStage;
    });
  }, [contacts, search, stageFilter]);

  const resetForm = () => setForm({ name: "", email: "", phone: "", company: "", stage: "Nuevo", value: "" });

  const handleCreate = () => {
    if (!form.name.trim()) { toast.error("El nombre es requerido"); return; }
    addContact({ name: form.name, email: form.email, phone: form.phone, company: form.company, stage: form.stage, value: Number(form.value) || 0, source: "Manual" });
    toast.success("Contacto creado", { description: `${form.name} fue agregado.` });
    setShowCreate(false);
    resetForm();
  };

  const handleEdit = () => {
    if (!editId || !form.name.trim()) return;
    updateContact(editId, { name: form.name, email: form.email, phone: form.phone, company: form.company, stage: form.stage, value: Number(form.value) || 0 });
    toast.success("Contacto actualizado");
    setEditId(null);
    resetForm();
  };

  const handleDelete = (id: string, name: string) => {
    deleteContact(id);
    toast.success("Contacto eliminado", { description: `${name} fue eliminado.` });
  };

  const openEdit = (c: typeof contacts[0]) => {
    setForm({ name: c.name, email: c.email, phone: c.phone, company: c.company, stage: c.stage, value: c.value.toString() });
    setEditId(c.id);
  };

  const timeAgo = (d: string) => {
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (mins < 60) return `hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    return `hace ${Math.floor(hrs / 24)}d`;
  };

  const ContactForm = ({ onSubmit, title, btnLabel }: { onSubmit: () => void; title: string; btnLabel: string }) => (
    <>
      <DialogHeader>
        <DialogTitle className="text-base">{title}</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">Completa los campos del contacto</DialogDescription>
      </DialogHeader>
      <div className="space-y-3 mt-2">
        {[
          { key: "name", label: "Nombre", type: "text", placeholder: "Nombre completo" },
          { key: "email", label: "Email", type: "email", placeholder: "correo@ejemplo.com" },
          { key: "phone", label: "Teléfono", type: "tel", placeholder: "+1 555-0000" },
          { key: "company", label: "Empresa", type: "text", placeholder: "Nombre de empresa" },
          { key: "value", label: "Valor ($)", type: "number", placeholder: "0" },
        ].map((f) => (
          <div key={f.key} className="space-y-1">
            <Label className="text-xs">{f.label}</Label>
            <Input type={f.type} value={form[f.key as keyof typeof form]} onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder} className="h-8 text-xs bg-secondary border-border" />
          </div>
        ))}
        <div className="space-y-1">
          <Label className="text-xs">Etapa</Label>
          <Select value={form.stage} onValueChange={(v) => setForm((prev) => ({ ...prev, stage: v }))}>
            <SelectTrigger className="h-8 text-xs bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CONTACT_STAGES.map((s) => (<SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="glow" className="w-full h-8 text-xs mt-2" onClick={onSubmit}>{btnLabel}</Button>
      </div>
    </>
  );

  return (
    <div className="p-6 space-y-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Contactos</h1>
          <p className="text-xs text-muted-foreground">{filtered.length} contactos {stageFilter !== "all" && `en ${stageFilter}`}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar contactos..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 text-xs pl-8 bg-secondary border-border" />
          </div>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="h-8 w-[130px] text-xs bg-secondary border-border">
              <Filter size={12} className="mr-1" /><SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Todas</SelectItem>
              {CONTACT_STAGES.map((s) => (<SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>))}
            </SelectContent>
          </Select>
          <Button variant="glow" size="sm" className="h-8 text-xs" onClick={() => { resetForm(); setShowCreate(true); }}>
            <Plus size={14} /> Agregar
          </Button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-border">
                {["Nombre", "Email", "Empresa", "Etapa", "Valor", "Actividad", ""].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-2xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((c, i) => (
                  <motion.tr key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ delay: i * 0.03 }} className="border-b border-border/50 hover:bg-accent/30 transition-colors cursor-pointer group" onClick={() => navigate(`/contacts/${c.id}`)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-semibold shrink-0">{c.name.charAt(0)}</div>
                        <span className="text-xs font-medium text-foreground">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.email}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.company}</td>
                    <td className="px-4 py-3">
                      <span className={`text-2xs px-2 py-0.5 rounded-full font-medium ${stageColor[c.stage] || "bg-muted text-muted-foreground"}`}>{c.stage}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-foreground">${c.value.toLocaleString()}</td>
                    <td className="px-4 py-3 text-2xs text-muted-foreground">{timeAgo(c.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => navigate(`/contacts/${c.id}`)}><Eye size={14} /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => openEdit(c)}><Edit size={14} /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(c.id, c.name)}><Trash2 size={14} /></Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <Users size={32} className="mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No se encontraron contactos</p>
          </div>
        )}
      </motion.div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <ContactForm onSubmit={handleCreate} title="Nuevo contacto" btnLabel="Crear contacto" />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editId} onOpenChange={(open) => { if (!open) setEditId(null); }}>
        <DialogContent className="sm:max-w-md">
          <ContactForm onSubmit={handleEdit} title="Editar contacto" btnLabel="Guardar cambios" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
