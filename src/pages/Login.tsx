import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Completa todos los campos");
      return;
    }
    const ok = await login(email, password);
    if (ok) navigate("/dashboard");
    else setError("Credenciales inválidas");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary flex items-center justify-center font-bold text-primary-foreground text-lg">
            S
          </div>
          <h1 className="text-xl font-semibold text-foreground">Iniciar sesión</h1>
          <p className="text-xs text-muted-foreground">Ingresa a tu cuenta para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@empresa.com"
              className="h-9 text-xs bg-secondary border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-9 text-xs bg-secondary border-border"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button type="submit" className="w-full h-9 text-xs" variant="glow" disabled={isLoading}>
            {isLoading ? "Entrando..." : "Iniciar sesión"}
          </Button>
        </form>

        <p className="text-center text-2xs text-muted-foreground">
          ¿No tienes cuenta? <span className="text-primary cursor-pointer hover:underline">Contactar ventas</span>
        </p>
      </div>
    </div>
  );
}
