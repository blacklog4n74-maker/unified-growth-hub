import React, { createContext, useContext, useState, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────
export interface Note {
  id: string;
  text: string;
  createdAt: string;
  author: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  type: "email" | "call" | "note" | "meeting" | "task" | "deal" | "sms";
  title: string;
  description: string;
  createdAt: string;
  author: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  stage: string;
  value: number;
  avatar?: string;
  createdAt: string;
  tags: string[];
  notes: Note[];
  tasks: Task[];
  activities: Activity[];
  address?: string;
  source?: string;
}

export interface Deal {
  id: string;
  title: string;
  company: string;
  value: number;
  stage: string;
  contactId: string;
  contactName: string;
  daysInStage: number;
  createdAt: string;
  probability: number;
  description?: string;
}

export interface Message {
  id: string;
  text: string;
  sender: "user" | "contact";
  timestamp: string;
  channel: "email" | "sms" | "call" | "whatsapp";
}

export interface Conversation {
  id: string;
  contactId: string;
  contactName: string;
  contactEmail: string;
  channel: "email" | "sms" | "call" | "whatsapp";
  lastMessage: string;
  timestamp: string;
  unread: number;
  messages: Message[];
}

export const PIPELINE_STAGES = ["Nuevo", "Contactado", "Calificado", "Propuesta", "Negociación", "Cerrado"];
export const CONTACT_STAGES = ["Nuevo", "Contactado", "Calificado", "Propuesta", "Negociación", "Cerrado"];

// ─── Mock Data ───────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);

const INITIAL_CONTACTS: Contact[] = [
  {
    id: "c1", name: "Danny Quiñones", email: "dqventas00@gmail.com", phone: "+1 555-0101",
    company: "DQ Ventures", stage: "Calificado", value: 95000000, createdAt: "2025-03-20T10:00:00Z",
    tags: ["VIP", "Enterprise"], source: "Referido",
    notes: [
      { id: "n1", text: "Interesado en plan enterprise. Llamar el lunes.", createdAt: "2025-03-20T10:30:00Z", author: "demo" },
      { id: "n2", text: "Envió documentos de la empresa.", createdAt: "2025-03-21T09:00:00Z", author: "demo" },
    ],
    tasks: [
      { id: "t1", title: "Enviar propuesta comercial", completed: false, dueDate: "2025-03-25", createdAt: "2025-03-20T10:00:00Z" },
      { id: "t2", title: "Agendar demo personalizada", completed: true, dueDate: "2025-03-22", createdAt: "2025-03-20T10:00:00Z" },
    ],
    activities: [
      { id: "a1", type: "email", title: "Email de bienvenida enviado", description: "Se envió presentación corporativa", createdAt: "2025-03-20T10:15:00Z", author: "demo" },
      { id: "a2", type: "call", title: "Llamada de introducción", description: "15 min — interesado en automatización", createdAt: "2025-03-20T14:00:00Z", author: "demo" },
      { id: "a3", type: "meeting", title: "Demo del producto", description: "Demo completa con equipo de ventas", createdAt: "2025-03-21T11:00:00Z", author: "demo" },
    ],
  },
  {
    id: "c2", name: "María López", email: "maria@empresa.com", phone: "+1 555-0102",
    company: "Tech Corp", stage: "Propuesta", value: 12500, createdAt: "2025-03-19T08:00:00Z",
    tags: ["SMB"], source: "Website",
    notes: [{ id: "n3", text: "Solicita integración con Shopify.", createdAt: "2025-03-19T09:00:00Z", author: "demo" }],
    tasks: [{ id: "t3", title: "Enviar caso de estudio", completed: false, dueDate: "2025-03-26", createdAt: "2025-03-19T08:00:00Z" }],
    activities: [
      { id: "a4", type: "email", title: "Propuesta enviada", description: "Plan Pro — $12,500/año", createdAt: "2025-03-19T10:00:00Z", author: "demo" },
    ],
  },
  {
    id: "c3", name: "Carlos Pérez", email: "carlos@startup.io", phone: "+1 555-0103",
    company: "StartUp IO", stage: "Nuevo", value: 8200, createdAt: "2025-03-18T16:00:00Z",
    tags: ["Startup"], source: "LinkedIn",
    notes: [], tasks: [],
    activities: [
      { id: "a5", type: "sms", title: "SMS de seguimiento", description: "Recordatorio de llamada", createdAt: "2025-03-18T17:00:00Z", author: "demo" },
    ],
  },
  {
    id: "c4", name: "Ana Torres", email: "ana@digital.co", phone: "+1 555-0104",
    company: "Digital Co", stage: "Negociación", value: 45000, createdAt: "2025-03-17T12:00:00Z",
    tags: ["Enterprise", "Priority"], source: "Evento",
    notes: [{ id: "n4", text: "Negociando descuento por contrato anual.", createdAt: "2025-03-17T14:00:00Z", author: "demo" }],
    tasks: [],
    activities: [
      { id: "a6", type: "meeting", title: "Reunión de negociación", description: "Discutieron términos de contrato", createdAt: "2025-03-17T15:00:00Z", author: "demo" },
    ],
  },
  {
    id: "c5", name: "Juan García", email: "juan@corp.com", phone: "+1 555-0105",
    company: "Corp SA", stage: "Cerrado", value: 22000, createdAt: "2025-03-15T09:00:00Z",
    tags: ["Won"], source: "Referido",
    notes: [], tasks: [],
    activities: [
      { id: "a7", type: "deal", title: "Deal cerrado", description: "Contrato firmado — $22,000", createdAt: "2025-03-16T10:00:00Z", author: "demo" },
    ],
  },
];

const INITIAL_DEALS: Deal[] = [
  { id: "d1", title: "Proyecto Web", company: "Tech Corp", value: 12500, stage: "Nuevo", contactId: "c2", contactName: "María López", daysInStage: 2, createdAt: "2025-03-19T08:00:00Z", probability: 20 },
  { id: "d2", title: "App Mobile", company: "StartUp IO", value: 8200, stage: "Nuevo", contactId: "c3", contactName: "Carlos Pérez", daysInStage: 1, createdAt: "2025-03-18T16:00:00Z", probability: 10 },
  { id: "d3", title: "CRM Enterprise", company: "DQ Ventures", value: 95000000, stage: "Calificado", contactId: "c1", contactName: "Danny Quiñones", daysInStage: 5, createdAt: "2025-03-20T10:00:00Z", probability: 60 },
  { id: "d4", title: "Ecommerce", company: "Digital Co", value: 45000, stage: "Propuesta", contactId: "c4", contactName: "Ana Torres", daysInStage: 3, createdAt: "2025-03-17T12:00:00Z", probability: 50 },
  { id: "d5", title: "SEO Campaign", company: "Marketing Pro", value: 6800, stage: "Propuesta", contactId: "c4", contactName: "Ana Torres", daysInStage: 7, createdAt: "2025-03-10T09:00:00Z", probability: 40 },
  { id: "d6", title: "Consultoría", company: "Corp SA", value: 22000, stage: "Negociación", contactId: "c5", contactName: "Juan García", daysInStage: 3, createdAt: "2025-03-15T09:00:00Z", probability: 80 },
  { id: "d7", title: "Plataforma SaaS", company: "DQ Ventures", value: 150000, stage: "Negociación", contactId: "c1", contactName: "Danny Quiñones", daysInStage: 2, createdAt: "2025-03-22T08:00:00Z", probability: 70 },
];

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: "conv1", contactId: "c1", contactName: "Danny Quiñones", contactEmail: "dqventas00@gmail.com",
    channel: "email", lastMessage: "¿Cuándo podemos agendar la demo?", timestamp: "2025-03-23T14:30:00Z", unread: 2,
    messages: [
      { id: "m1", text: "Hola Danny, gracias por tu interés en nuestro CRM Enterprise.", sender: "user", timestamp: "2025-03-23T10:00:00Z", channel: "email" },
      { id: "m2", text: "Gracias! Me interesa mucho el plan enterprise. ¿Tienen integración con SAP?", sender: "contact", timestamp: "2025-03-23T11:30:00Z", channel: "email" },
      { id: "m3", text: "Sí, tenemos conector nativo con SAP. Te envío la documentación.", sender: "user", timestamp: "2025-03-23T12:00:00Z", channel: "email" },
      { id: "m4", text: "Perfecto. ¿Cuándo podemos agendar la demo?", sender: "contact", timestamp: "2025-03-23T14:30:00Z", channel: "email" },
    ],
  },
  {
    id: "conv2", contactId: "c2", contactName: "María López", contactEmail: "maria@empresa.com",
    channel: "whatsapp", lastMessage: "Revisando la propuesta, te confirmo mañana", timestamp: "2025-03-23T16:00:00Z", unread: 1,
    messages: [
      { id: "m5", text: "Hola María, te envié la propuesta por email. ¿La recibiste?", sender: "user", timestamp: "2025-03-23T14:00:00Z", channel: "whatsapp" },
      { id: "m6", text: "Sí, la recibí. Déjame revisarla con mi equipo.", sender: "contact", timestamp: "2025-03-23T15:00:00Z", channel: "whatsapp" },
      { id: "m7", text: "Revisando la propuesta, te confirmo mañana", sender: "contact", timestamp: "2025-03-23T16:00:00Z", channel: "whatsapp" },
    ],
  },
  {
    id: "conv3", contactId: "c3", contactName: "Carlos Pérez", contactEmail: "carlos@startup.io",
    channel: "sms", lastMessage: "Gracias, agendemos para el jueves", timestamp: "2025-03-22T18:00:00Z", unread: 0,
    messages: [
      { id: "m8", text: "Carlos, ¿te gustaría una demo de nuestro producto?", sender: "user", timestamp: "2025-03-22T16:00:00Z", channel: "sms" },
      { id: "m9", text: "Gracias, agendemos para el jueves", sender: "contact", timestamp: "2025-03-22T18:00:00Z", channel: "sms" },
    ],
  },
  {
    id: "conv4", contactId: "c4", contactName: "Ana Torres", contactEmail: "ana@digital.co",
    channel: "email", lastMessage: "Necesitamos revisar los términos del contrato", timestamp: "2025-03-23T09:00:00Z", unread: 1,
    messages: [
      { id: "m10", text: "Ana, adjunto el contrato revisado con los cambios que solicitaste.", sender: "user", timestamp: "2025-03-22T17:00:00Z", channel: "email" },
      { id: "m11", text: "Necesitamos revisar los términos del contrato", sender: "contact", timestamp: "2025-03-23T09:00:00Z", channel: "email" },
    ],
  },
  {
    id: "conv5", contactId: "c5", contactName: "Juan García", contactEmail: "juan@corp.com",
    channel: "call", lastMessage: "Llamada completada — 12 min", timestamp: "2025-03-21T11:00:00Z", unread: 0,
    messages: [
      { id: "m12", text: "Llamada completada — 12 min. Contrato firmado.", sender: "user", timestamp: "2025-03-21T11:00:00Z", channel: "call" },
    ],
  },
];

// ─── Context ─────────────────────────────────────────────
interface CrmContextType {
  contacts: Contact[];
  deals: Deal[];
  conversations: Conversation[];
  addContact: (c: Omit<Contact, "id" | "createdAt" | "notes" | "tasks" | "activities" | "tags">) => Contact;
  updateContact: (id: string, data: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  addNote: (contactId: string, text: string) => void;
  addTask: (contactId: string, title: string, dueDate: string) => void;
  toggleTask: (contactId: string, taskId: string) => void;
  addActivity: (contactId: string, activity: Omit<Activity, "id" | "createdAt">) => void;
  addDeal: (d: Omit<Deal, "id" | "createdAt">) => Deal;
  updateDeal: (id: string, data: Partial<Deal>) => void;
  deleteDeal: (id: string) => void;
  moveDeal: (dealId: string, newStage: string) => void;
  sendMessage: (conversationId: string, text: string, channel: Message["channel"]) => void;
  markConversationRead: (conversationId: string) => void;
  getContact: (id: string) => Contact | undefined;
}

const CrmContext = createContext<CrmContextType | null>(null);

export const useCrm = () => {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error("useCrm must be used within CrmProvider");
  return ctx;
};

export const CrmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);

  const getContact = useCallback((id: string) => contacts.find((c) => c.id === id), [contacts]);

  const addContact = useCallback((data: Omit<Contact, "id" | "createdAt" | "notes" | "tasks" | "activities" | "tags">) => {
    const c: Contact = { ...data, id: uid(), createdAt: new Date().toISOString(), notes: [], tasks: [], activities: [], tags: [] };
    setContacts((prev) => [c, ...prev]);
    return c;
  }, []);

  const updateContact = useCallback((id: string, data: Partial<Contact>) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  }, []);

  const deleteContact = useCallback((id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    setDeals((prev) => prev.filter((d) => d.contactId !== id));
    setConversations((prev) => prev.filter((cv) => cv.contactId !== id));
  }, []);

  const addNote = useCallback((contactId: string, text: string) => {
    const note: Note = { id: uid(), text, createdAt: new Date().toISOString(), author: "demo" };
    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId
          ? { ...c, notes: [note, ...c.notes], activities: [{ id: uid(), type: "note", title: "Nota agregada", description: text, createdAt: new Date().toISOString(), author: "demo" }, ...c.activities] }
          : c
      )
    );
  }, []);

  const addTask = useCallback((contactId: string, title: string, dueDate: string) => {
    const task: Task = { id: uid(), title, completed: false, dueDate, createdAt: new Date().toISOString() };
    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId
          ? { ...c, tasks: [task, ...c.tasks], activities: [{ id: uid(), type: "task", title: "Tarea creada", description: title, createdAt: new Date().toISOString(), author: "demo" }, ...c.activities] }
          : c
      )
    );
  }, []);

  const toggleTask = useCallback((contactId: string, taskId: string) => {
    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId
          ? { ...c, tasks: c.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)) }
          : c
      )
    );
  }, []);

  const addActivity = useCallback((contactId: string, activity: Omit<Activity, "id" | "createdAt">) => {
    const a: Activity = { ...activity, id: uid(), createdAt: new Date().toISOString() };
    setContacts((prev) => prev.map((c) => (c.id === contactId ? { ...c, activities: [a, ...c.activities] } : c)));
  }, []);

  const addDeal = useCallback((data: Omit<Deal, "id" | "createdAt">) => {
    const d: Deal = { ...data, id: uid(), createdAt: new Date().toISOString() };
    setDeals((prev) => [d, ...prev]);
    return d;
  }, []);

  const updateDeal = useCallback((id: string, data: Partial<Deal>) => {
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, ...data } : d)));
  }, []);

  const deleteDeal = useCallback((id: string) => {
    setDeals((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const moveDeal = useCallback((dealId: string, newStage: string) => {
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage: newStage, daysInStage: 0 } : d)));
  }, []);

  const sendMessage = useCallback((conversationId: string, text: string, channel: Message["channel"]) => {
    const msg: Message = { id: uid(), text, sender: "user", timestamp: new Date().toISOString(), channel };
    setConversations((prev) =>
      prev.map((cv) =>
        cv.id === conversationId
          ? { ...cv, messages: [...cv.messages, msg], lastMessage: text, timestamp: msg.timestamp }
          : cv
      )
    );
  }, []);

  const markConversationRead = useCallback((conversationId: string) => {
    setConversations((prev) => prev.map((cv) => (cv.id === conversationId ? { ...cv, unread: 0 } : cv)));
  }, []);

  return (
    <CrmContext.Provider
      value={{
        contacts, deals, conversations,
        addContact, updateContact, deleteContact,
        addNote, addTask, toggleTask, addActivity,
        addDeal, updateDeal, deleteDeal, moveDeal,
        sendMessage, markConversationRead, getContact,
      }}
    >
      {children}
    </CrmContext.Provider>
  );
};
