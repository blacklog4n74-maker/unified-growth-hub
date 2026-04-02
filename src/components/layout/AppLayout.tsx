import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Users, Kanban, Mail, Zap, BarChart3,
  Settings, ChevronLeft, ChevronRight, LogOut, Search, Bell,
  Globe, BookOpen, Star, Puzzle, Bot, Menu, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import AiChatWidget from "@/components/AiChatWidget";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/contacts", icon: Users, label: "Contactos" },
  { to: "/pipeline", icon: Kanban, label: "Pipeline" },
  { to: "/inbox", icon: Mail, label: "Inbox" },
  { to: "/automation", icon: Zap, label: "Automatización" },
  { to: "/funnels", icon: Globe, label: "Funnels" },
  { to: "/ai", icon: Bot, label: "IA" },
  { to: "/reputation", icon: Star, label: "Reputación" },
  { to: "/analytics", icon: BarChart3, label: "Analítica" },
  { to: "/courses", icon: BookOpen, label: "Cursos" },
  { to: "/integrations", icon: Puzzle, label: "Integraciones" },
  { to: "/settings", icon: Settings, label: "Configuración" },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200 lg:relative",
        collapsed ? "w-16" : "w-56",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground text-sm">
            S
          </div>
          {!collapsed && <span className="font-semibold text-foreground text-sm">SuiteCRM</span>}
          <button onClick={() => setMobileOpen(false)} className="ml-auto lg:hidden text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon size={16} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-full items-center justify-center rounded-md py-2 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="flex h-14 items-center gap-3 border-b border-border px-4">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden text-muted-foreground">
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Search size={14} className="text-muted-foreground" />
            <input
              placeholder="Buscar..."
              className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <Bell size={16} />
            </Button>
            <div className="flex items-center gap-2 ml-2">
              <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xs font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              {user && <span className="text-xs text-foreground hidden sm:block">{user.name}</span>}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={handleLogout}>
              <LogOut size={16} />
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
