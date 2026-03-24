import { useState, useMemo } from "react";
import { useCrm, PIPELINE_STAGES } from "@/contexts/CrmContext";
import { motion } from "framer-motion";
import {
  DollarSign, Target, TrendingUp, Users, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" } }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({ opacity: 1, scale: 1, transition: { delay: i * 0.1, duration: 0.35 } }),
};

const PERIODS = ["7d", "30d", "90d", "12m"] as const;

const revenueData = [
  { month: "Ene", value: 32000 }, { month: "Feb", value: 38000 }, { month: "Mar", value: 42000 },
  { month: "Abr", value: 39000 }, { month: "May", value: 48000 }, { month: "Jun", value: 55000 },
  { month: "Jul", value: 72000 },
];

const COLORS = [
  "hsl(145 80% 42%)", "hsl(210 100% 52%)", "hsl(38 92% 50%)", "hsl(280 70% 50%)", "hsl(0 72% 51%)", "hsl(170 70% 45%)",
];

export default function DashboardPage() {
  const { contacts, deals, conversations } = useCrm();
  const [period, setPeriod] = useState<typeof PERIODS[number]>("30d");

  const stats = useMemo(() => {
    const totalValue = deals.reduce((s, d) => s + d.value, 0);
    const closedDeals = deals.filter((d) => d.stage === "Cerrado");
    const closedValue = closedDeals.reduce((s, d) => s + d.value, 0);
    const unread = conversations.reduce((s, c) => s + c.unread, 0);
    return { totalValue, closedValue, closedDeals: closedDeals.length, activeContacts: contacts.length, unread };
  }, [contacts, deals, conversations]);

  const pipelineData = useMemo(() => {
    return PIPELINE_STAGES.map((stage) => {
      const stageDeals = deals.filter((d) => d.stage === stage);
      return { stage, count: stageDeals.length, value: stageDeals.reduce((s, d) => s + d.value, 0) };
    });
  }, [deals]);

  const sourceData = useMemo(() => {
    const sources: Record<string, number> = {};
    contacts.forEach((c) => { sources[c.source || "Directo"] = (sources[c.source || "Directo"] || 0) + 1; });
    return Object.entries(sources).map(([name, value]) => ({ name, value }));
  }, [contacts]);

  const recentActivities = useMemo(() => {
    return contacts
      .flatMap((c) => c.activities.map((a) => ({ ...a, contactName: c.name })))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
  }, [contacts]);

  const fmt = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
    return `$${n}`;
  };

  const kpis = [
    { label: "Pipeline total", value: fmt(stats.totalValue), change: "+12%", up: true, icon: DollarSign, color: "text-primary" },
    { label: "Leads activos", value: contacts.length.toString(), change: "+8%", up: true, icon: Target, color: "text-info" },
    { label: "Deals cerrados", value: stats.closedDeals.toString(), change: "-3%", up: false, icon: TrendingUp, color: "text-warning" },
    { label: "Contactos", value: stats.activeContacts.toString(), change: "+5%", up: true, icon: Users, color: "text-primary" },
  ];

  const activityIcon = (type: string) => {
    const icons: Record<string, string> = { email: "✉️", call: "📞", note: "📝", meeting: "🤝", task: "✅", deal: "💰", sms: "💬" };
    return icons[type] || "📌";
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    return `hace ${Math.floor(hrs / 24)}d`;
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground">Resumen de tu actividad</p>
        </div>
        <div className="flex items-center gap-2">
          {PERIODS.map((p) => (
            <Button key={p} variant={period === p ? "default" : "ghost"} size="sm" className="h-7 text-2xs px-2.5" onClick={() => setPeriod(p)}>{p}</Button>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} custom={i} initial="hidden" animate="visible" variants={fadeUp} whileHover={{ scale: 1.02, transition: { duration: 0.2 } }} className="rounded-xl border border-border bg-card p-4 space-y-3 cursor-default">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
              <kpi.icon size={16} className={kpi.color} />
            </div>
            <div className="flex items-end gap-2">
              <motion.span className="text-2xl font-bold text-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.1 }}>{kpi.value}</motion.span>
              <span className={`text-2xs flex items-center gap-0.5 ${kpi.up ? "text-primary" : "text-destructive"}`}>
                {kpi.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}{kpi.change}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div custom={0} initial="hidden" animate="visible" variants={scaleIn} className="lg:col-span-2 rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-foreground mb-4">Ingresos mensuales</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="gGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(145 80% 42%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(145 80% 42%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 16%)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(215 12% 50%)" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(215 12% 50%)" }} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip contentStyle={{ background: "hsl(220 18% 10%)", border: "1px solid hsl(220 14% 16%)", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "hsl(210 20% 95%)" }} formatter={(v: number) => [`$${v.toLocaleString()}`, "Ingresos"]} />
              <Area type="monotone" dataKey="value" stroke="hsl(145 80% 42%)" strokeWidth={2} fill="url(#gGreen)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div custom={1} initial="hidden" animate="visible" variants={scaleIn} className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-foreground mb-4">Fuentes de leads</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3}>
                {sourceData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(220 18% 10%)", border: "1px solid hsl(220 14% 16%)", borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {sourceData.map((s, i) => (
              <span key={s.name} className="text-2xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{s.name}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div custom={2} initial="hidden" animate="visible" variants={scaleIn} className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-foreground mb-4">Pipeline por etapa</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pipelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 16%)" />
              <XAxis dataKey="stage" tick={{ fontSize: 10, fill: "hsl(215 12% 50%)" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(215 12% 50%)" }} />
              <Tooltip contentStyle={{ background: "hsl(220 18% 10%)", border: "1px solid hsl(220 14% 16%)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="hsl(145 80% 42%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div custom={3} initial="hidden" animate="visible" variants={scaleIn} className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-foreground mb-4">Actividad reciente</h3>
          <div className="space-y-1 max-h-[240px] overflow-y-auto">
            {recentActivities.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.05 }} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-accent/50 transition-colors">
                <span className="text-sm">{activityIcon(a.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{a.contactName}</p>
                  <p className="text-2xs text-muted-foreground truncate">{a.title}</p>
                </div>
                <span className="text-2xs text-muted-foreground shrink-0">{timeAgo(a.createdAt)}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Mensajes sin leer", value: stats.unread.toString() },
          { label: "Deals en pipeline", value: deals.length.toString() },
          { label: "Valor cerrado", value: fmt(stats.closedValue), highlight: true },
          { label: "Tasa de cierre", value: `${deals.length > 0 ? Math.round((stats.closedDeals / deals.length) * 100) : 0}%` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xs text-muted-foreground mb-1">{s.label}</p>
            <p className={`text-lg font-bold ${s.highlight ? "text-primary" : "text-foreground"}`}>{s.value}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
