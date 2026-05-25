import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Acceso · Noir & Or" }] }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bienvenida de vuelta");
        navigate({ to: "/atelier-privado" });
      } else {
        const redirectTo = `${window.location.origin}/atelier-privado`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectTo },
        });
        if (error) throw error;
        toast.success("Cuenta creada. Verifica tu correo.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-5 py-16">
      <div className="w-full max-w-md rounded-lg border border-border/60 bg-card/80 p-8 shadow-elegant">
        <p className="text-[10px] uppercase tracking-[0.4em] text-primary text-center">Acceso privado</p>
        <h1 className="mt-3 text-center font-serif text-3xl">{mode === "signin" ? "Iniciar sesión" : "Crear cuenta"}</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Panel reservado para administración.
        </p>

        <form onSubmit={handle} className="mt-8 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Correo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-md border border-border bg-input/50 px-4 py-3 text-sm focus:border-primary focus:outline-none"
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
              className="mt-2 w-full rounded-md border border-border bg-input/50 px-4 py-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary py-3 text-xs uppercase tracking-[0.3em] text-primary-foreground hover:glow-gold transition-all disabled:opacity-50"
          >
            {loading ? "..." : mode === "signin" ? "Entrar" : "Crear cuenta"}
          </button>
        </form>

        <button
          onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
          className="mt-6 block w-full text-center text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-primary"
        >
          {mode === "signin" ? "Crear una cuenta" : "Ya tengo cuenta"}
        </button>
      </div>
    </main>
  );
}
