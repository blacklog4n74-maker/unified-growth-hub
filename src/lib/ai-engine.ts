import type { Contact, Deal, Conversation } from "@/contexts/CrmContext";

function fmt(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

interface CrmData {
  contacts: Contact[];
  deals: Deal[];
  conversations: Conversation[];
}

// Build a full CRM context string so the AI "knows everything"
function buildContext(data: CrmData): string {
  const { contacts, deals, conversations } = data;
  const totalValue = deals.reduce((s, d) => s + d.value, 0);
  const weighted = deals.reduce((s, d) => s + d.value * (d.probability / 100), 0);
  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);
  const tasksPending = contacts.reduce((s, c) => s + c.tasks.filter((t) => !t.completed).length, 0);
  const tasksComplete = contacts.reduce((s, c) => s + c.tasks.filter((t) => t.completed).length, 0);

  return `CRM_SNAPSHOT:
contacts=${contacts.length}, deals=${deals.length}, conversations=${conversations.length}
pipeline_value=${totalValue}, weighted=${weighted}
unread=${totalUnread}, tasks_pending=${tasksPending}, tasks_done=${tasksComplete}
contacts_list=[${contacts.map((c) => `{name:"${c.name}",company:"${c.company}",email:"${c.email}",phone:"${c.phone}",stage:"${c.stage}",value:${c.value},tags:[${c.tags.join(",")}],source:"${c.source}",notes:${c.notes.length},tasks_pending:${c.tasks.filter((t) => !t.completed).length}}`).join(",")}]
deals_list=[${deals.map((d) => `{title:"${d.title}",company:"${d.company}",value:${d.value},stage:"${d.stage}",contact:"${d.contactName}",prob:${d.probability}%,days:${d.daysInStage}}`).join(",")}]
conversations_summary=[${conversations.map((c) => `{contact:"${c.contactName}",channel:${c.channel},unread:${c.unread},last:"${c.lastMessage}"}`).join(",")}]`;
}

// Tokenize and match intent with scoring
function matchIntent(q: string): { intent: string; score: number; entities: string[] } {
  const patterns: { intent: string; keywords: string[]; weight: number }[] = [
    { intent: "pipeline", keywords: ["pipeline", "embudo", "funnel", "etapa", "stage", "flujo", "ventas"], weight: 1 },
    { intent: "contacts_summary", keywords: ["contacto", "contactos", "cliente", "clientes", "resumen", "lista", "cuántos contactos", "todos los contactos"], weight: 1 },
    { intent: "deal_value", keywords: ["valor", "dinero", "ingreso", "revenue", "facturación", "cuánto", "total", "money", "ganancia"], weight: 1 },
    { intent: "unread", keywords: ["sin leer", "unread", "mensaje", "inbox", "pendientes inbox", "notificación", "comunicación"], weight: 1 },
    { intent: "prospect", keywords: ["mejor prospecto", "prospecto", "oportunidad", "mejor cliente", "mayor potencial", "priorizar", "top deal"], weight: 1.2 },
    { intent: "full_analysis", keywords: ["análisis completo", "analisis completo", "resumen general", "visión general", "overview", "todo", "completo", "360", "cómo va todo", "estado general", "reporte"], weight: 1.1 },
    { intent: "tasks", keywords: ["tarea", "tareas", "pendiente", "pendientes", "to-do", "todo list", "actividad", "actividades"], weight: 1 },
    { intent: "notes", keywords: ["nota", "notas", "anotación", "apunte"], weight: 1 },
    { intent: "comparison", keywords: ["comparar", "comparación", "versus", "vs", "diferencia", "mejor", "peor"], weight: 1 },
    { intent: "recommendations", keywords: ["recomendar", "recomendación", "consejo", "sugerencia", "qué hago", "qué debería", "estrategia", "ayuda", "tip"], weight: 1 },
    { intent: "channels", keywords: ["canal", "canales", "email", "whatsapp", "sms", "llamada", "comunicación", "medio"], weight: 1 },
    { intent: "performance", keywords: ["rendimiento", "performance", "conversión", "tasa", "ratio", "eficiencia", "kpi", "métricas", "estadísticas"], weight: 1 },
    { intent: "greeting", keywords: ["hola", "buenos días", "buenas tardes", "hey", "hi", "hello", "qué tal", "cómo estás"], weight: 0.5 },
  ];

  let best = { intent: "unknown", score: 0, entities: [] as string[] };

  for (const p of patterns) {
    let score = 0;
    for (const kw of p.keywords) {
      if (q.includes(kw)) score += p.weight;
    }
    if (score > best.score) best = { intent: p.intent, score, entities: [] };
  }

  return best;
}

export function generateAiResponse(query: string, data: CrmData): string {
  const { contacts, deals, conversations } = data;
  const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const qOrig = query.toLowerCase();

  // First try to find a contact/company match
  const contactMatch = contacts.find((c) => {
    const name = c.name.toLowerCase();
    const company = c.company.toLowerCase();
    return qOrig.includes(name) || qOrig.includes(company) || 
           q.includes(name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")) ||
           q.includes(company.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
  });

  if (contactMatch) {
    const contactDeals = deals.filter((d) => d.contactId === contactMatch.id);
    const contactConvs = conversations.filter((cv) => cv.contactId === contactMatch.id);
    const pendingTasks = contactMatch.tasks.filter((t) => !t.completed);
    const recentActivity = contactMatch.activities.slice(0, 3);

    let response = `👤 **${contactMatch.name}**\n\n`;
    response += `• **Empresa**: ${contactMatch.company}\n`;
    response += `• **Email**: ${contactMatch.email}\n`;
    response += `• **Teléfono**: ${contactMatch.phone}\n`;
    response += `• **Etapa**: ${contactMatch.stage}\n`;
    response += `• **Valor**: ${fmt(contactMatch.value)}\n`;
    response += `• **Tags**: ${contactMatch.tags.join(", ") || "Sin tags"}\n`;
    response += `• **Fuente**: ${contactMatch.source || "N/A"}\n`;
    response += `• **Creado**: ${new Date(contactMatch.createdAt).toLocaleDateString("es")}\n`;

    if (contactDeals.length > 0) {
      response += `\n📊 **Deals (${contactDeals.length})**:\n`;
      contactDeals.forEach((d) => {
        response += `• ${d.title} — ${fmt(d.value)} (${d.stage}, ${d.probability}% prob.)\n`;
      });
    }

    if (contactConvs.length > 0) {
      response += `\n💬 **Conversaciones (${contactConvs.length})**:\n`;
      contactConvs.forEach((cv) => {
        response += `• ${cv.channel}: *"${cv.lastMessage}"* ${cv.unread > 0 ? `(${cv.unread} sin leer)` : ""}\n`;
      });
    }

    if (contactMatch.notes.length > 0) {
      response += `\n📝 **Notas (${contactMatch.notes.length})**:\n`;
      contactMatch.notes.slice(0, 3).forEach((n) => {
        response += `• *"${n.text}"* — ${new Date(n.createdAt).toLocaleDateString("es")}\n`;
      });
    }

    if (pendingTasks.length > 0) {
      response += `\n✅ **Tareas pendientes (${pendingTasks.length})**:\n`;
      pendingTasks.forEach((t) => {
        response += `• ${t.title} (vence: ${t.dueDate})\n`;
      });
    }

    if (recentActivity.length > 0) {
      response += `\n🕐 **Actividad reciente**:\n`;
      recentActivity.forEach((a) => {
        response += `• ${a.title} — ${a.description} (${new Date(a.createdAt).toLocaleDateString("es")})\n`;
      });
    }

    return response;
  }

  // Intent matching
  const { intent } = matchIntent(q);

  switch (intent) {
    case "greeting": {
      const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);
      const tasksPending = contacts.reduce((s, c) => s + c.tasks.filter((t) => !t.completed).length, 0);
      return `👋 **¡Hola!** Soy tu asistente del CRM.\n\nAquí tienes un vistazo rápido:\n\n• 👥 **${contacts.length}** contactos\n• 📊 **${deals.length}** deals activos\n• 💬 **${totalUnread}** mensajes sin leer\n• ✅ **${tasksPending}** tareas pendientes\n\nPregúntame cualquier cosa sobre tu CRM: contactos, pipeline, deals, inbox, tareas, métricas o pide recomendaciones.`;
    }

    case "pipeline": {
      const stages: Record<string, { count: number; value: number; deals: Deal[] }> = {};
      deals.forEach((d) => {
        if (!stages[d.stage]) stages[d.stage] = { count: 0, value: 0, deals: [] };
        stages[d.stage].count++;
        stages[d.stage].value += d.value;
        stages[d.stage].deals.push(d);
      });
      const stageOrder = ["Nuevo", "Contactado", "Calificado", "Propuesta", "Negociación", "Cerrado"];
      const lines = stageOrder.filter((s) => stages[s]).map((s) => {
        const st = stages[s];
        const dealNames = st.deals.map((d) => d.title).join(", ");
        return `• **${s}**: ${st.count} deal(s) — ${fmt(st.value)}\n  └ ${dealNames}`;
      });
      const totalValue = deals.reduce((s, d) => s + d.value, 0);
      const weighted = deals.reduce((s, d) => s + d.value * (d.probability / 100), 0);
      const avgDays = deals.reduce((s, d) => s + d.daysInStage, 0) / (deals.length || 1);
      return `📊 **Estado del Pipeline**\n\n${lines.join("\n\n")}\n\n---\n\n💰 **Valor total**: ${fmt(totalValue)}\n🎯 **Valor ponderado**: ${fmt(weighted)}\n📈 **Total deals**: ${deals.length}\n⏱️ **Promedio días en etapa**: ${avgDays.toFixed(1)}\n\n💡 *Los deals en Negociación (${stages["Negociación"]?.count || 0}) están más cerca de cerrar. Prioriza el seguimiento ahí.*`;
    }

    case "contacts_summary": {
      const byStage: Record<string, Contact[]> = {};
      contacts.forEach((c) => {
        if (!byStage[c.stage]) byStage[c.stage] = [];
        byStage[c.stage].push(c);
      });
      const lines = Object.entries(byStage).map(([s, cs]) =>
        `• **${s}** (${cs.length}): ${cs.map((c) => c.name).join(", ")}`
      );
      const totalValue = contacts.reduce((s, c) => s + c.value, 0);
      const topContact = contacts.reduce((max, c) => (c.value > max.value ? c : max), contacts[0]);
      const allTags = [...new Set(contacts.flatMap((c) => c.tags))];
      const sources = [...new Set(contacts.map((c) => c.source).filter(Boolean))];
      return `👥 **Resumen de Contactos**\n\n${lines.join("\n")}\n\n---\n\n📊 **Total**: ${contacts.length} contactos\n💰 **Valor acumulado**: ${fmt(totalValue)}\n⭐ **Más valioso**: ${topContact.name} (${topContact.company}) — ${fmt(topContact.value)}\n🏷️ **Tags**: ${allTags.join(", ") || "Ninguno"}\n🌐 **Fuentes**: ${sources.join(", ") || "N/A"}`;
    }

    case "deal_value": {
      const total = deals.reduce((s, d) => s + d.value, 0);
      const avg = total / (deals.length || 1);
      const biggest = deals.reduce((max, d) => (d.value > max.value ? d : max), deals[0]);
      const smallest = deals.reduce((min, d) => (d.value < min.value ? d : min), deals[0]);
      const closed = deals.filter((d) => d.stage === "Cerrado");
      const closedValue = closed.reduce((s, d) => s + d.value, 0);
      const openValue = total - closedValue;
      const weighted = deals.reduce((s, d) => s + d.value * (d.probability / 100), 0);
      return `💰 **Análisis de Valor del Pipeline**\n\n• **Valor total**: ${fmt(total)}\n• **Valor ponderado**: ${fmt(weighted)}\n• **Promedio por deal**: ${fmt(avg)}\n• **Deal más grande**: ${biggest.title} (${biggest.company}) — ${fmt(biggest.value)}\n• **Deal más pequeño**: ${smallest.title} — ${fmt(smallest.value)}\n\n---\n\n• **Deals cerrados**: ${closed.length} → ${fmt(closedValue)}\n• **Deals abiertos**: ${deals.length - closed.length} → ${fmt(openValue)}\n\n💡 *El ${((closedValue / total) * 100).toFixed(0)}% del valor ha sido cerrado. Enfócate en convertir los deals de Negociación.*`;
    }

    case "unread": {
      const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);
      const unreadConvs = conversations.filter((c) => c.unread > 0);
      if (totalUnread === 0) return "✅ **¡Todo al día!** No tienes mensajes sin leer en ningún canal.\n\n💡 *Buen momento para hacer seguimiento proactivo a tus deals.*";
      const lines = unreadConvs.map((c) => {
        const contact = contacts.find((ct) => ct.id === c.contactId);
        return `• **${c.contactName}** (${c.channel}) — ${c.unread} sin leer\n  └ *"${c.lastMessage}"*${contact ? ` | Valor: ${fmt(contact.value)}` : ""}`;
      });
      return `📬 **Mensajes sin leer: ${totalUnread}**\n\n${lines.join("\n\n")}\n\n💡 *Prioriza responder a los contactos de mayor valor comercial para acelerar los cierres.*`;
    }

    case "prospect": {
      const openDeals = deals.filter((d) => d.stage !== "Cerrado");
      const scored = openDeals.map((d) => ({ ...d, score: d.value * (d.probability / 100) })).sort((a, b) => b.score - a.score);
      if (scored.length === 0) return "No hay deals abiertos en el pipeline.";
      const top3 = scored.slice(0, 3);
      const lines = top3.map((d, i) => {
        const contact = contacts.find((c) => c.id === d.contactId);
        return `**${i + 1}. ${d.title}** (${d.company})\n• Valor: ${fmt(d.value)} | Prob: ${d.probability}% | Ponderado: ${fmt(d.score)}\n• Etapa: ${d.stage} (${d.daysInStage} días)\n• Contacto: ${d.contactName}${contact ? ` — ${contact.email}` : ""}`;
      });
      return `🏆 **Top 3 Mejores Prospectos**\n\n${lines.join("\n\n")}\n\n💡 *Enfócate en el #1 — tiene el mayor retorno esperado. Agenda una reunión esta semana.*`;
    }

    case "full_analysis": {
      const totalContacts = contacts.length;
      const totalDeals = deals.length;
      const totalValue = deals.reduce((s, d) => s + d.value, 0);
      const weighted = deals.reduce((s, d) => s + d.value * (d.probability / 100), 0);
      const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);
      const closedDeals = deals.filter((d) => d.stage === "Cerrado");
      const openDeals = totalDeals - closedDeals.length;
      const topDeal = deals.reduce((max, d) => (d.value > max.value ? d : max), deals[0]);
      const tasksPending = contacts.reduce((s, c) => s + c.tasks.filter((t) => !t.completed).length, 0);
      const tasksComplete = contacts.reduce((s, c) => s + c.tasks.filter((t) => t.completed).length, 0);
      const closedValue = closedDeals.reduce((s, d) => s + d.value, 0);
      const convRate = totalDeals > 0 ? ((closedDeals.length / totalDeals) * 100).toFixed(0) : "0";
      const allTags = [...new Set(contacts.flatMap((c) => c.tags))];

      return `🤖 **Análisis Completo del CRM**\n\n---\n\n**📊 Métricas clave**\n• Contactos: **${totalContacts}**\n• Deals: **${totalDeals}** (${openDeals} abiertos, ${closedDeals.length} cerrados)\n• Valor total: **${fmt(totalValue)}**\n• Valor ponderado: **${fmt(weighted)}**\n• Valor cerrado: **${fmt(closedValue)}**\n• Tasa de conversión: **${convRate}%**\n\n**💬 Comunicación**\n• Conversaciones: **${conversations.length}**\n• Mensajes sin leer: **${totalUnread}**\n• Canales activos: ${[...new Set(conversations.map((c) => c.channel))].join(", ")}\n\n**✅ Productividad**\n• Tareas completadas: **${tasksComplete}**\n• Tareas pendientes: **${tasksPending}**\n\n**⭐ Highlights**\n• Deal estrella: ${topDeal.title} (${topDeal.company}) — ${fmt(topDeal.value)}\n• Tags en uso: ${allTags.join(", ") || "Ninguno"}\n\n---\n\n**💡 Recomendaciones:**\n1. ${totalUnread > 0 ? `Tienes ${totalUnread} mensajes sin leer — responde para no perder oportunidades.` : "¡Inbox al día!"}\n2. ${tasksPending > 0 ? `${tasksPending} tareas pendientes. Revísalas hoy.` : "Todas las tareas al día."}\n3. Enfócate en Negociación para cerrar más deals este mes.\n4. Tu tasa de conversión es ${convRate}% — busca mejorarla con mejor calificación de leads.`;
    }

    case "tasks": {
      const allTasks = contacts.flatMap((c) => c.tasks.map((t) => ({ ...t, contactName: c.name, contactId: c.id })));
      const pending = allTasks.filter((t) => !t.completed);
      const completed = allTasks.filter((t) => t.completed);
      if (allTasks.length === 0) return "📝 No hay tareas registradas. Crea tareas desde el detalle de cada contacto para dar seguimiento.";
      const pendingLines = pending.map((t) => `• **${t.title}** — ${t.contactName} (vence: ${t.dueDate})`);
      const completedLines = completed.map((t) => `• ~~${t.title}~~ — ${t.contactName}`);
      return `📝 **Tareas del CRM**\n\n**Pendientes (${pending.length}):**\n${pendingLines.join("\n") || "Ninguna"}\n\n**Completadas (${completed.length}):**\n${completedLines.join("\n") || "Ninguna"}\n\n💡 *Completa las tareas pendientes para avanzar tus deals en el pipeline.*`;
    }

    case "notes": {
      const allNotes = contacts.flatMap((c) => c.notes.map((n) => ({ ...n, contactName: c.name })));
      if (allNotes.length === 0) return "📝 No hay notas registradas en el CRM.";
      const sorted = [...allNotes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const lines = sorted.slice(0, 8).map((n) => `• **${n.contactName}**: *"${n.text}"* — ${new Date(n.createdAt).toLocaleDateString("es")}`);
      return `📝 **Notas recientes (${allNotes.length} total)**\n\n${lines.join("\n")}\n\n💡 *Las notas te ayudan a recordar contexto importante de cada contacto.*`;
    }

    case "channels": {
      const byChannel: Record<string, { count: number; unread: number }> = {};
      conversations.forEach((c) => {
        if (!byChannel[c.channel]) byChannel[c.channel] = { count: 0, unread: 0 };
        byChannel[c.channel].count++;
        byChannel[c.channel].unread += c.unread;
      });
      const labels: Record<string, string> = { email: "📧 Email", whatsapp: "💬 WhatsApp", sms: "📱 SMS", call: "📞 Llamadas" };
      const lines = Object.entries(byChannel).map(([ch, v]) => `• ${labels[ch] || ch}: ${v.count} conversación(es), ${v.unread} sin leer`);
      return `📡 **Canales de Comunicación**\n\n${lines.join("\n")}\n\n📊 **Total**: ${conversations.length} conversaciones\n\n💡 *Diversifica tus canales para maximizar el alcance con cada contacto.*`;
    }

    case "performance": {
      const totalDeals = deals.length;
      const closed = deals.filter((d) => d.stage === "Cerrado");
      const convRate = totalDeals > 0 ? ((closed.length / totalDeals) * 100).toFixed(1) : "0";
      const avgValue = deals.reduce((s, d) => s + d.value, 0) / (totalDeals || 1);
      const avgDays = deals.reduce((s, d) => s + d.daysInStage, 0) / (totalDeals || 1);
      const totalActivities = contacts.reduce((s, c) => s + c.activities.length, 0);
      const responseRate = conversations.length > 0 ? ((conversations.filter((c) => c.messages.some((m) => m.sender === "user")).length / conversations.length) * 100).toFixed(0) : "0";
      return `📈 **Métricas de Rendimiento**\n\n• **Tasa de conversión**: ${convRate}%\n• **Valor promedio deal**: ${fmt(avgValue)}\n• **Promedio días en etapa**: ${avgDays.toFixed(1)}\n• **Total actividades**: ${totalActivities}\n• **Tasa de respuesta**: ${responseRate}%\n• **Deals en pipeline**: ${totalDeals}\n• **Cerrados**: ${closed.length}\n\n💡 *Busca reducir los días en cada etapa para acelerar tu ciclo de venta.*`;
    }

    case "recommendations": {
      const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);
      const tasksPending = contacts.reduce((s, c) => s + c.tasks.filter((t) => !t.completed).length, 0);
      const staleDeals = deals.filter((d) => d.daysInStage > 5 && d.stage !== "Cerrado");
      const highValueOpen = deals.filter((d) => d.stage !== "Cerrado").sort((a, b) => b.value - a.value).slice(0, 2);

      let tips: string[] = [];
      if (totalUnread > 0) tips.push(`📬 Responde los ${totalUnread} mensajes pendientes — la velocidad de respuesta impacta directamente en la conversión.`);
      if (tasksPending > 0) tips.push(`✅ Completa las ${tasksPending} tareas pendientes para mantener el momentum con tus contactos.`);
      if (staleDeals.length > 0) tips.push(`⚠️ ${staleDeals.length} deals llevan más de 5 días en su etapa actual: ${staleDeals.map((d) => d.title).join(", ")}. Haz seguimiento.`);
      if (highValueOpen.length > 0) tips.push(`💎 Prioriza: ${highValueOpen.map((d) => `${d.title} (${fmt(d.value)})`).join(" y ")} — son tus deals de mayor valor.`);
      tips.push("🔄 Revisa tu pipeline semanalmente para identificar cuellos de botella.");
      tips.push("📊 Usa tags para segmentar mejor a tus contactos y personalizar tu comunicación.");

      return `💡 **Recomendaciones para tu CRM**\n\n${tips.map((t, i) => `${i + 1}. ${t}`).join("\n\n")}\n\n---\n\n*Estas recomendaciones se basan en el estado actual de tu CRM.*`;
    }

    case "comparison": {
      const byStage = deals.reduce((acc, d) => {
        acc[d.stage] = (acc[d.stage] || 0) + d.value;
        return acc;
      }, {} as Record<string, number>);
      const lines = Object.entries(byStage).sort((a, b) => b[1] - a[1]).map(([s, v]) => `• **${s}**: ${fmt(v)}`);
      return `📊 **Comparación por etapa (valor)**\n\n${lines.join("\n")}\n\n💡 *La etapa con mayor valor acumulado indica dónde está concentrado tu pipeline.*`;
    }

    default: {
      // Fuzzy match — try partial keywords
      if (q.includes("cuanto") || q.includes("cuánto") || q.includes("número") || q.includes("cantidad")) {
        if (q.includes("contacto") || q.includes("cliente")) return `Tienes **${contacts.length}** contactos en el CRM.`;
        if (q.includes("deal") || q.includes("negocio") || q.includes("oportunidad")) return `Hay **${deals.length}** deals en tu pipeline por un valor total de **${fmt(deals.reduce((s, d) => s + d.value, 0))}**.`;
        if (q.includes("conversación") || q.includes("conversacion") || q.includes("chat")) return `Tienes **${conversations.length}** conversaciones, con **${conversations.reduce((s, c) => s + c.unread, 0)}** mensajes sin leer.`;
      }

      // General fallback with context
      const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);
      const tasksPending = contacts.reduce((s, c) => s + c.tasks.filter((t) => !t.completed).length, 0);
      return `🤖 Entiendo tu pregunta, pero déjame darte la información que tengo disponible:\n\n📊 **Estado actual del CRM:**\n• ${contacts.length} contactos | ${deals.length} deals | ${conversations.length} conversaciones\n• ${totalUnread} mensajes sin leer | ${tasksPending} tareas pendientes\n• Pipeline: ${fmt(deals.reduce((s, d) => s + d.value, 0))}\n\nPuedes preguntarme cosas como:\n• *"¿Cómo va el pipeline?"*\n• *"Háblame de Danny Quiñones"*\n• *"¿Cuántos mensajes sin leer tengo?"*\n• *"Dame recomendaciones"*\n• *"¿Cuál es mi mejor prospecto?"*\n• *"Análisis completo"*\n• *"¿Qué tareas tengo pendientes?"*\n• Busca cualquier contacto por **nombre** o **empresa**`;
    }
  }
}
