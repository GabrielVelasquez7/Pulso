import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Acceso · PULSO" }] }),
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
        const { error } = await supabase.auth.signInWithPassword({
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
    <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-5 py-16">
      <div className="w-full max-w-lg rounded-[8px] border border-border/80 bg-card p-10 shadow-elegant">
        <p className="text-xs uppercase tracking-[0.4em] text-primary text-center font-bold">
          {mode === "login" ? "Acceso privado" : "Crear administrador"}
        </p>
        <h1 className="mt-4 text-center font-serif text-4xl text-foreground">
          {mode === "login" ? "Iniciar sesión" : "Registrarse"}
        </h1>
        <p className="mt-3 text-center text-base text-muted-foreground">
          {mode === "login"
            ? "Panel reservado para la administración de PULSO."
            : "Registra una cuenta para gestionar la tienda."}
        </p>

        <form onSubmit={handle} className="mt-10 space-y-6">
          <div>
            <label className="text-sm uppercase tracking-[0.2em] text-muted-foreground font-medium" htmlFor="email">
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-[8px] border border-border bg-input px-5 py-4 text-base focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-sm uppercase tracking-[0.2em] text-muted-foreground font-medium" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-[8px] border border-border bg-input px-5 py-4 text-base focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-[8px] bg-primary py-4 text-sm font-bold uppercase tracking-[0.3em] text-primary-foreground hover:glow-ruby transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-primary/40"
          >
            {loading ? "Procesando..." : mode === "login" ? "Entrar al Atelier" : "Crear Cuenta"}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-border/40 pt-6">
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-sm text-muted-foreground hover:text-primary transition-colors uppercase tracking-[0.1em] font-medium p-2 rounded-[5px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {mode === "login" ? "¿No tienes cuenta? Regístrate aquí" : "¿Ya tienes cuenta? Inicia sesión"}
          </button>
        </div>
      </div>
    </main>
  );
}
