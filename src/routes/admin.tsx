import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  component: Forbidden,
  head: () => ({
    meta: [
      { title: "403 · Acceso restringido" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function Forbidden() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-5">
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-primary">Error 403</p>
        <h1 className="mt-4 font-serif text-6xl sm:text-7xl">Acceso prohibido</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Esta zona está reservada. Si te has perdido, podemos guiarte de regreso.
        </p>
        <Link
          to="/"
          className="mt-10 inline-flex items-center justify-center rounded-full border border-primary px-8 py-3 text-xs uppercase tracking-[0.3em] text-primary transition-all hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_40px_-8px_var(--gold)]"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
