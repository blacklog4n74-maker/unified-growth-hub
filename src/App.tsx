import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import LoginPage from "@/pages/Login";
import DashboardPage from "@/pages/Dashboard";
import ContactsPage from "@/pages/Contacts";
import PipelinePage from "@/pages/Pipeline";
import StubPage from "@/components/StubPage";
import NotFound from "@/pages/NotFound";
import {
  Mail, Zap, Globe, Bot, Star, BarChart3, BookOpen, Puzzle, Settings
} from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/contacts" element={<ContactsPage />} />
              <Route path="/pipeline" element={<PipelinePage />} />
              <Route path="/inbox" element={<StubPage title="Inbox unificado" description="Gestiona todas tus conversaciones desde un solo lugar: email, SMS, llamadas y más." icon={Mail} />} />
              <Route path="/automation" element={<StubPage title="Automatización" description="Crea workflows, triggers y acciones automáticas para escalar tu negocio." icon={Zap} />} />
              <Route path="/funnels" element={<StubPage title="Funnels & Websites" description="Diseña landing pages, funnels de conversión y sitios web completos." icon={Globe} />} />
              <Route path="/ai" element={<StubPage title="Inteligencia Artificial" description="Conversation AI, Voice AI, Content AI y más. Potencia tu equipo con IA." icon={Bot} />} />
              <Route path="/reputation" element={<StubPage title="Reputación" description="Monitorea y gestiona reseñas, solicita feedback y mejora tu presencia online." icon={Star} />} />
              <Route path="/analytics" element={<StubPage title="Analítica" description="Dashboards personalizables con métricas de pipeline, conversión e ingresos." icon={BarChart3} />} />
              <Route path="/courses" element={<StubPage title="Cursos & Comunidad" description="Crea membresías, cursos y comunidades privadas para tus clientes." icon={BookOpen} />} />
              <Route path="/integrations" element={<StubPage title="Integraciones" description="Conecta con Google Sheets, APIs externas, webhooks y herramientas de marketing." icon={Puzzle} />} />
              <Route path="/settings" element={<StubPage title="Configuración" description="Administra tu cuenta, branding, subcuentas, roles y dominios personalizados." icon={Settings} />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
