import { useState } from "react";
import { Search, Plus, Mail, Phone, MoreHorizontal, Filter, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  stage: string;
  value: string;
  lastActivity: string;
}

const initialContacts: Contact[] = [
  { id: "1", name: "Danny Quiñones", email: "dqventas00@gmail.com", phone: "+573016188586", company: "DQ Ventures", stage: "Calificado", value: "$95,000,000", lastActivity: "hace 25 min" },
  { id: "2", name: "María López", email: "maria@empresa.com", phone: "+571234567890", company: "Tech Corp", stage: "Propuesta", value: "$12,500", lastActivity: "hace 1h" },
  { id: "3", name: "Carlos Pérez", email: "carlos@startup.io", phone: "+575551234567", company: "StartUp IO", stage: "Nuevo", value: "$8,200", lastActivity: "hace 3h" },
  { id: "4", name: "Ana Torres", email: "ana@digital.co", phone: "+579876543210", company: "Digital Co", stage: "Negociación", value: "$45,000", lastActivity: "hace 5h" },
  { id: "5", name: "Juan García", email: "juan@corp.com", phone: "+571112223334", company: "Corp SA", stage: "Cerrado", value: "$22,000", lastActivity: "ayer" },
];

const stageBadge = (stage: string) => {
  const colors: Record<string, string> = {
    Nuevo: "bg-info/10 text-info",
    Calificado: "bg-primary/10 text-primary",
    Propuesta: "bg-warning/10 text-warning",
    Negociación: "bg-accent text-accent-foreground",
    Cerrado: "bg-success/10 text-success",
  };
  return colors[stage] || "bg-muted text-muted-foreground";
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState(initialContacts);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", email: "", phone: "", company: "" });

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.company.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!newContact.name || !newContact.email) return;
    setContacts([
      {
        id: Date.now().toString(),
        ...newContact,
        stage: "Nuevo",
        value: "$0",
        lastActivity: "ahora",
      },
      ...contacts,
    ]);
    setNewContact({ name: "", email: "", phone: "", company: "" });
    setDialogOpen(false);
    toast({ title: "Contacto creado", description: `${newContact.name} fue agregado.` });
  };

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Contactos</h1>
          <p className="text-xs text-muted-foreground">{contacts.length} contactos totales</p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar contactos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-secondary border-border"
            />
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
            <Filter size={12} /> Filtros
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs gap-1" variant="glow">
                <Plus size={12} /> Agregar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-sm">Nuevo contacto</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <Label className="text-xs">Nombre</Label>
                  <Input className="h-8 text-xs bg-secondary" value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input className="h-8 text-xs bg-secondary" type="email" value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Teléfono</Label>
                  <Input className="h-8 text-xs bg-secondary" value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Empresa</Label>
                  <Input className="h-8 text-xs bg-secondary" value={newContact.company} onChange={(e) => setNewContact({ ...newContact, company: e.target.value })} />
                </div>
                <Button className="w-full h-8 text-xs" variant="glow" onClick={handleAdd}>Crear contacto</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 text-2xs font-medium text-muted-foreground">Nombre</th>
                <th className="text-left px-4 py-2.5 text-2xs font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-2.5 text-2xs font-medium text-muted-foreground">Empresa</th>
                <th className="text-left px-4 py-2.5 text-2xs font-medium text-muted-foreground">Etapa</th>
                <th className="text-right px-4 py-2.5 text-2xs font-medium text-muted-foreground">Valor</th>
                <th className="text-right px-4 py-2.5 text-2xs font-medium text-muted-foreground">Actividad</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xs font-semibold shrink-0">
                        {c.name.charAt(0)}
                      </div>
                      <span className="text-xs font-medium text-foreground">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.email}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.company}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-2xs font-medium ${stageBadge(c.stage)}`}>
                      {c.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground text-right font-medium">{c.value}</td>
                  <td className="px-4 py-3 text-2xs text-muted-foreground text-right">{c.lastActivity}</td>
                  <td className="px-2 py-3">
                    <div className="flex gap-1">
                      <button className="p-1 text-muted-foreground hover:text-foreground"><Mail size={12} /></button>
                      <button className="p-1 text-muted-foreground hover:text-foreground"><Phone size={12} /></button>
                      <button className="p-1 text-muted-foreground hover:text-foreground"><MoreHorizontal size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <Users size={32} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-xs text-muted-foreground">No se encontraron contactos</p>
          </div>
        )}
      </div>
    </div>
  );
}
