import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Acceso · Noir & Or" }] }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          toast.error(`Error al iniciar sesión: ${error.message}`);
          return;
        }
        toast.success("Bienvenido de vuelta");
        navigate({ to: "/atelier-privado" });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) {
          toast.error(`Error al registrarse: ${error.message}`);
          return;
        }
        
        if (data.session) {
          toast.success("Registro exitoso. Bienvenido/a.");
          navigate({ to: "/atelier-privado" });
        } else {
          toast.success("Registro iniciado. Por favor verifica tu correo electrónico si es requerido.");
          setMode("login");
        }
      }
    } catch (err: unknown) {
      toast.error("Error al procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-5 py-16">
      <div className="w-full max-w-md rounded-[5px] border border-border/60 bg-card/80 p-8 shadow-elegant">
        <p className="text-[10px] uppercase tracking-[0.4em] text-primary text-center">
          {mode === "login" ? "Acceso privado" : "Crear administrador"}
        </p>
        <h1 className="mt-3 text-center font-serif text-3xl">
          {mode === "login" ? "Iniciar sesión" : "Registrarse"}
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {mode === "login"
            ? "Panel reservado para administración."
            : "Registra una cuenta para gestionar la tienda."}
        </p>

        <form onSubmit={handle} className="mt-8 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Correo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-[5px] border border-border bg-input/50 px-4 py-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Contraseña</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-[5px] border border-border bg-input/50 px-4 py-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[5px] bg-primary py-3 text-xs uppercase tracking-[0.3em] text-primary-foreground hover:glow-ruby transition-all disabled:opacity-50"
          >
            {loading ? "..." : mode === "login" ? "Entrar" : "Crear Cuenta"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-xs text-muted-foreground hover:text-primary transition-colors uppercase tracking-[0.1em]"
          >
            {mode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
          </button>
        </div>
      </div>
    </main>
  );
}
