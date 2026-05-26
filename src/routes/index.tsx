import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type Product } from "@/components/ProductCard";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Noir & Or — Colección íntima" },
      { name: "description", content: "Una colección discreta de juguetes y bienestar para adultos. Diseño sofisticado, envío confidencial." },
    ],
  }),
});

function Index() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProducts((data ?? []) as Product[]);
        setLoading(false);
      });
  }, []);

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40">
        {/* decorative orbs */}
        <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-gradient-ruby opacity-[0.12] blur-3xl float-slow" />
        <div aria-hidden className="pointer-events-none absolute top-40 -right-24 h-[360px] w-[360px] rounded-full bg-gradient-wine opacity-40 blur-3xl float-slow" style={{ animationDelay: "1.5s" }} />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-20 h-[300px] w-[300px] rounded-full bg-gradient-ruby opacity-[0.08] blur-3xl float-slow" style={{ animationDelay: "3s" }} />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 py-24 md:py-36 text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-background/40 px-4 py-1.5 text-[11px] uppercase tracking-[0.4em] text-primary backdrop-blur">
            <span className="h-1 w-1 rounded-full bg-primary glow-pulse" />
            +18 · Confidencial
          </p>
          <h1 className="mt-8 font-serif text-5xl sm:text-7xl md:text-8xl leading-[0.95] text-balance">
            Bienestar íntimo,
            <br />
            <span className="italic text-gradient-ruby">elegancia nocturna.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-xl text-base text-muted-foreground text-balance">
            Una colección discreta de piezas seleccionadas para quienes entienden que
            el deseo, como el lujo, no se anuncia. Se susurra.
          </p>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#coleccion"
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-ruby px-10 py-4 text-xs uppercase tracking-[0.3em] text-primary-foreground shadow-[var(--shadow-ruby)] transition-silk hover:scale-[1.03] hover:shadow-[0_0_60px_-5px_var(--ruby)]"
            >
              <span className="relative z-10">Explorar la colección</span>
              <span aria-hidden className="absolute inset-0 shimmer opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </a>
            <a
              href="#coleccion"
              className="inline-flex items-center justify-center rounded-full border border-border/80 bg-background/30 px-8 py-4 text-xs uppercase tracking-[0.3em] text-foreground/80 backdrop-blur transition-silk hover:border-primary hover:text-primary"
            >
              Novedades
            </a>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 -bottom-32 h-64 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Catalog */}
      <section id="coleccion" className="mx-auto max-w-7xl px-5 sm:px-8 py-20">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-primary">La colección</p>
            <h2 className="mt-2 font-serif text-4xl sm:text-5xl">Piezas selectas</h2>
          </div>
          <p className="hidden sm:block max-w-sm text-sm text-muted-foreground">
            Cada objeto, una invitación. Tacto, materiales y diseño pensados para el placer adulto.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-lg border border-border/40 bg-card/40" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">Próximamente.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-border/40 py-10 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        © Noir &amp; Or · Solo mayores de 18 años · Empaque y envío discreto
      </footer>
    </main>
  );
}
