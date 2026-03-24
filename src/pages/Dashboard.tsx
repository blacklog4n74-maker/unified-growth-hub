import { TrendingUp, TrendingDown, Users, DollarSign, Target, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

const stats = [
  { label: "Ingresos hoy", value: "$12,450", change: "+12%", up: true, icon: DollarSign },
  { label: "Leads nuevos", value: "34", change: "+8%", up: true, icon: Target },
  { label: "Deals cerrados", value: "12", change: "-3%", up: false, icon: Activity },
  { label: "Contactos activos", value: "1,247", change: "+5%", up: true, icon: Users },
];

const revenueData = [
  { month: "Ene", value: 42000 }, { month: "Feb", value: 38000 }, { month: "Mar", value: 55000 },
  { month: "Abr", value: 48000 }, { month: "May", value: 62000 }, { month: "Jun", value: 58000 },
  { month: "Jul", value: 71000 },
];

const pipelineData = [
  { stage: "Nuevo", count: 45 }, { stage: "Contactado", count: 32 },
  { stage: "Propuesta", count: 18 }, { stage: "Negociación", count: 12 },
  { stage: "Cerrado", count: 8 },
];

const recentActivities = [
  { contact: "María López", action: "Nuevo lead creado", time: "hace 5 min" },
  { contact: "Carlos Pérez", action: "Email enviado", time: "hace 12 min" },
  { contact: "Ana Torres", action: "Llamada completada", time: "hace 25 min" },
  { contact: "Juan García", action: "Deal cerrado - $8,500", time: "hace 1h" },
  { contact: "Laura Ruiz", action: "Reunión agendada", time: "hace 2h" },
];

export default function DashboardPage() {
  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
        <p className="text-xs text-muted-foreground">Resumen de tu actividad</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xs text-muted-foreground">{s.label}</span>
              <s.icon size={14} className="text-muted-foreground" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-xl font-bold text-foreground">{s.value}</span>
              <span className={`text-2xs font-medium flex items-center gap-0.5 ${s.up ? "text-success" : "text-destructive"}`}>
                {s.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {s.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-xs font-medium text-foreground mb-4">Ingresos mensuales</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(145, 80%, 42%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(145, 80%, 42%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(215, 12%, 50%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215, 12%, 50%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip
                contentStyle={{ background: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 14%, 16%)", borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: "hsl(210, 20%, 95%)" }}
              />
              <Area type="monotone" dataKey="value" stroke="hsl(145, 80%, 42%)" fill="url(#revGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-xs font-medium text-foreground mb-4">Pipeline por etapa</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={pipelineData}>
              <XAxis dataKey="stage" tick={{ fontSize: 10, fill: "hsl(215, 12%, 50%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215, 12%, 50%)" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 14%, 16%)", borderRadius: 8, fontSize: 11 }}
              />
              <Bar dataKey="count" fill="hsl(145, 80%, 42%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-lg border border-border bg-card">
        <div className="p-4 border-b border-border">
          <h3 className="text-xs font-medium text-foreground">Actividad reciente</h3>
        </div>
        <div className="divide-y divide-border">
          {recentActivities.map((a, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xs font-semibold shrink-0">
                {a.contact.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground font-medium truncate">{a.contact}</p>
                <p className="text-2xs text-muted-foreground">{a.action}</p>
              </div>
              <span className="text-2xs text-muted-foreground whitespace-nowrap">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
