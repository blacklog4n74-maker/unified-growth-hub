import { useState, useRef, useMemo } from "react";
import { useCrm, PIPELINE_STAGES } from "@/contexts/CrmContext";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MoreHorizontal, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";

const stageColors: Record<string, string> = {
  Nuevo: "bg-blue-500", Contactado: "bg-yellow-500", Calificado: "bg-primary",
  Propuesta: "bg-orange-500", Negociación: "bg-purple-500", Cerrado: "bg-primary",
};

export default function PipelinePage() {
  const { deals, contacts, addDeal, updateDeal, deleteDeal, moveDeal } = useCrm();
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", company: "", value: "", contactId: "", stage: "Nuevo", probability: "20", description: "" });

  const totalValue = useMemo(() => deals.reduce((s, d) => s + d.value, 0), [deals]);

  const resetForm = () => setForm({ title: "", company: "", value: "", contactId: "", stage: "Nuevo", probability: "20", description: "" });

  const handleCreate = () => {
    if (!form.title.trim()) { toast.error("El título es requerido"); return; }
    const contact = contacts.find((c) => c.id === form.contactId);
    addDeal({ title: form.title, company: form.company || contact?.company || "", value: Number(form.value) || 0, stage: form.stage, contactId: form.contactId, contactName: contact?.name || "", daysInStage: 0, probability: Number(form.probability) || 20, description: form.description });
    toast.success("Deal creado", { description: form.title });
    setShowCreate(false);
    resetForm();
  };

  const handleEdit = () => {
    if (!editId || !form.title.trim()) return;
    const contact = contacts.find((c) => c.id === form.contactId);
    updateDeal(editId, { title: form.title, company: form.company || contact?.company || "", value: Number(form.value) || 0, stage: form.stage, contactId: form.contactId, contactName: contact?.name || "", probability: Number(form.probability) || 20, description: form.description });
    toast.success("Deal actualizado");
    setEditId(null);
    resetForm();
  };

  const openEdit = (d: typeof deals[0]) => {
    setForm({ title: d.title, company: d.company, value: d.value.toString(), contactId: d.contactId, stage: d.stage, probability: d.probability.toString(), description: d.description || "" });
    setEditId(d.id);
  };

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    setDragId(dealId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", dealId);
  };

  const handleDragOver = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(stage);
  };

  const handleDrop = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("text/plain");
    if (dealId) { moveDeal(dealId, stage); toast.success(`Deal movido a ${stage}`); }
    setDragId(null);
    setDragOver(null);
  };

  const fmt = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
    return `$${n}`;
  };

  const DealForm = ({ onSubmit, title: formTitle, btnLabel }: { onSubmit: () => void; title: string; btnLabel: string }) => (
    <>
      <DialogHeader>
        <DialogTitle className="text-base">{formTitle}</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">Configura los detalles del deal</DialogDescription>
      </DialogHeader>
      <div className="space-y-3 mt-2">
        <div className="space-y-1">
          <Label className="text-xs">Título</Label>
          <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Nombre del deal" className="h-8 text-xs bg-secondary border-border" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Valor ($)</Label>
            <Input type="number" value={form.value} onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))} className="h-8 text-xs bg-secondary border-border" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Probabilidad (%)</Label>
            <Input type="number" value={form.probability} onChange={(e) => setForm((p) => ({ ...p, probability: e.target.value }))} className="h-8 text-xs bg-secondary border-border" />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Contacto</Label>
          <Select value={form.contactId} onValueChange={(v) => setForm((p) => ({ ...p, contactId: v }))}>
            <SelectTrigger className="h-8 text-xs bg-secondary border-border"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
            <SelectContent>{contacts.map((c) => (<SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Etapa</Label>
          <Select value={form.stage} onValueChange={(v) => setForm((p) => ({ ...p, stage: v }))}>
            <SelectTrigger className="h-8 text-xs bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>{PIPELINE_STAGES.map((s) => (<SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Empresa</Label>
          <Input value={form.company} onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))} placeholder="Empresa" className="h-8 text-xs bg-secondary border-border" />
        </div>
        <Button variant="glow" className="w-full h-8 text-xs mt-2" onClick={onSubmit}>{btnLabel}</Button>
      </div>
    </>
  );

  return (
    <div className="p-6 flex flex-col h-full">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Pipeline</h1>
          <p className="text-xs text-muted-foreground">{deals.length} deals · Valor total: {fmt(totalValue)}</p>
        </div>
        <Button variant="glow" size="sm" className="h-8 text-xs" onClick={() => { resetForm(); setShowCreate(true); }}>
          <Plus size={14} /> Nuevo deal
        </Button>
      </motion.div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max h-full">
          {PIPELINE_STAGES.map((stage) => {
            const stageDeals = deals.filter((d) => d.stage === stage);
            const stageValue = stageDeals.reduce((s, d) => s + d.value, 0);
            return (
              <div key={stage} className={`w-72 flex flex-col rounded-xl border transition-colors ${dragOver === stage ? "border-primary bg-primary/5" : "border-border bg-card/50"}`}
                onDragOver={(e) => handleDragOver(e, stage)} onDragLeave={() => setDragOver(null)} onDrop={(e) => handleDrop(e, stage)}>
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${stageColors[stage]}`} />
                    <span className="text-xs font-medium text-foreground">{stage}</span>
                    <span className="text-2xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{stageDeals.length}</span>
                  </div>
                  <span className="text-2xs text-muted-foreground">{fmt(stageValue)}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  <AnimatePresence>
                    {stageDeals.map((deal) => (
                      <motion.div key={deal.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: dragId === deal.id ? 0.5 : 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} whileHover={{ scale: 1.02 }}
                        draggable onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, deal.id)} onDragEnd={() => { setDragId(null); setDragOver(null); }}
                        className="rounded-lg border border-border bg-card p-3 cursor-grab active:cursor-grabbing group">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{deal.title}</p>
                            <p className="text-2xs text-muted-foreground">{deal.company}</p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal size={12} /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="text-xs" onClick={() => openEdit(deal)}><Edit size={12} className="mr-2" /> Editar</DropdownMenuItem>
                              <DropdownMenuItem className="text-xs text-destructive" onClick={() => { deleteDeal(deal.id); toast.success("Deal eliminado"); }}><Trash2 size={12} className="mr-2" /> Eliminar</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-primary">{fmt(deal.value)}</span>
                          <span className="text-2xs text-muted-foreground">{deal.daysInStage}d</span>
                        </div>
                        {deal.contactName && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xs font-semibold">{deal.contactName.charAt(0)}</div>
                            <span className="text-2xs text-muted-foreground">{deal.contactName}</span>
                          </div>
                        )}
                        <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                          <motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${deal.probability}%` }} transition={{ delay: 0.3 }} />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {stageDeals.length === 0 && (
                    <div className="py-8 text-center"><p className="text-2xs text-muted-foreground">Arrastra deals aquí</p></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md"><DealForm onSubmit={handleCreate} title="Nuevo deal" btnLabel="Crear deal" /></DialogContent>
      </Dialog>
      <Dialog open={!!editId} onOpenChange={(open) => { if (!open) setEditId(null); }}>
        <DialogContent className="sm:max-w-md"><DealForm onSubmit={handleEdit} title="Editar deal" btnLabel="Guardar cambios" /></DialogContent>
      </Dialog>
    </div>
  );
}
