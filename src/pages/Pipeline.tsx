import { useState } from "react";
import { Plus, MoreHorizontal, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Deal {
  id: string;
  title: string;
  company: string;
  value: string;
  contact: string;
  daysInStage: number;
}

interface Stage {
  id: string;
  title: string;
  color: string;
  deals: Deal[];
}

const initialStages: Stage[] = [
  {
    id: "new", title: "Nuevo", color: "bg-info",
    deals: [
      { id: "d1", title: "Proyecto Web", company: "Tech Corp", value: "$12,500", contact: "María López", daysInStage: 2 },
      { id: "d2", title: "App Mobile", company: "StartUp IO", value: "$8,200", contact: "Carlos Pérez", daysInStage: 1 },
    ],
  },
  {
    id: "qualified", title: "Calificado", color: "bg-primary",
    deals: [
      { id: "d3", title: "CRM Enterprise", company: "DQ Ventures", value: "$95,000,000", contact: "Danny Quiñones", daysInStage: 5 },
    ],
  },
  {
    id: "proposal", title: "Propuesta", color: "bg-warning",
    deals: [
      { id: "d4", title: "Ecommerce", company: "Digital Co", value: "$45,000", contact: "Ana Torres", daysInStage: 3 },
      { id: "d5", title: "SEO Campaign", company: "Marketing Pro", value: "$6,800", contact: "Laura Ruiz", daysInStage: 7 },
    ],
  },
  {
    id: "negotiation", title: "Negociación", color: "bg-accent",
    deals: [
      { id: "d6", title: "Consultoría", company: "Corp SA", value: "$22,000", contact: "Juan García", daysInStage: 4 },
    ],
  },
  {
    id: "closed", title: "Cerrado", color: "bg-success",
    deals: [
      { id: "d7", title: "Integración API", company: "Dev House", value: "$15,300", contact: "Pedro Sánchez", daysInStage: 0 },
    ],
  },
];

export default function PipelinePage() {
  const [stages] = useState(initialStages);
  const [draggedDeal, setDraggedDeal] = useState<string | null>(null);

  const totalValue = stages.reduce((sum, s) => {
    return sum + s.deals.reduce((ds, d) => {
      const num = parseFloat(d.value.replace(/[$,]/g, ""));
      return ds + (isNaN(num) ? 0 : num);
    }, 0);
  }, 0);

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Pipeline</h1>
          <p className="text-xs text-muted-foreground">
            {stages.reduce((s, st) => s + st.deals.length, 0)} deals · Valor total: ${totalValue.toLocaleString()}
          </p>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1" variant="glow">
          <Plus size={12} /> Nuevo deal
        </Button>
      </div>

      {/* Kanban */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max h-full">
          {stages.map((stage) => (
            <div
              key={stage.id}
              className="w-72 flex flex-col rounded-lg border border-border bg-card/50 shrink-0"
              onDragOver={(e) => e.preventDefault()}
            >
              {/* Stage header */}
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
                <div className={cn("h-2 w-2 rounded-full", stage.color)} />
                <span className="text-xs font-medium text-foreground flex-1">{stage.title}</span>
                <span className="text-2xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {stage.deals.length}
                </span>
              </div>

              {/* Deals */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {stage.deals.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={() => setDraggedDeal(deal.id)}
                    onDragEnd={() => setDraggedDeal(null)}
                    className={cn(
                      "rounded-md border border-border bg-card p-3 space-y-2 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors",
                      draggedDeal === deal.id && "opacity-50"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="text-xs font-medium text-foreground">{deal.title}</h4>
                      <button className="text-muted-foreground hover:text-foreground">
                        <MoreHorizontal size={12} />
                      </button>
                    </div>
                    <p className="text-2xs text-muted-foreground">{deal.company}</p>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                        <DollarSign size={10} />
                        {deal.value}
                      </span>
                      <span className="text-2xs text-muted-foreground">{deal.daysInStage}d</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xs font-semibold">
                        {deal.contact.charAt(0)}
                      </div>
                      <span className="text-2xs text-muted-foreground">{deal.contact}</span>
                    </div>
                  </div>
                ))}

                {stage.deals.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/40">
                    <DollarSign size={20} />
                    <span className="text-2xs mt-1">Sin deals</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
