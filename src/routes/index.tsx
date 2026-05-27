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
      <section className="relative overflow-hidden border-b border-border/80">
        {/* decorative orbs */}
        <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-gradient-ruby opacity-[0.20] blur-[100px] float-slow" />
        <div aria-hidden className="pointer-events-none absolute top-40 -right-24 h-[400px] w-[400px] rounded-full bg-gradient-wine opacity-[0.25] blur-[100px] float-slow" style={{ animationDelay: "1.5s" }} />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-20 h-[350px] w-[350px] rounded-full bg-gradient-ruby opacity-[0.15] blur-[100px] float-slow" style={{ animationDelay: "3s" }} />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 py-32 md:py-48 text-center">
          <p className="inline-flex items-center gap-3 rounded-[8px] border border-primary/50 bg-background/60 px-5 py-2 text-xs uppercase tracking-[0.4em] text-primary backdrop-blur shadow-sm">
            <span className="h-2 w-2 rounded-full bg-primary glow-pulse" />
            +18 · Confidencial
          </p>
          <h1 className="mt-10 font-serif text-6xl sm:text-8xl md:text-9xl leading-[0.9] text-balance text-foreground drop-shadow-sm">
            Bienestar íntimo,
            <br />
            <span className="italic text-gradient-ruby drop-shadow-lg">elegancia nocturna.</span>
          </h1>
          <p className="mx-auto mt-10 max-w-2xl text-lg sm:text-xl text-muted-foreground text-balance leading-relaxed">
            Una colección discreta de piezas seleccionadas para quienes entienden que
            el deseo, como el lujo, no se anuncia. Se susurra.
          </p>
          <div className="mt-16 flex flex-wrap items-center justify-center gap-6">
            <a
              href="#coleccion"
              className="group relative inline-flex min-h-[60px] min-w-[200px] items-center justify-center overflow-hidden rounded-[8px] bg-gradient-ruby px-12 py-5 text-sm uppercase tracking-[0.3em] text-primary-foreground font-semibold shadow-[var(--shadow-ruby)] transition-silk hover:scale-105 hover:shadow-[0_0_80px_-5px_var(--ruby)] focus:outline-none focus:ring-4 focus:ring-primary/40"
            >
              <span className="relative z-10">Explorar la colección</span>
              <span aria-hidden className="absolute inset-0 shimmer opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </a>
            <a
              href="#coleccion"
              className="inline-flex min-h-[60px] min-w-[180px] items-center justify-center rounded-[8px] border-2 border-border/80 bg-background/50 px-10 py-5 text-sm uppercase tracking-[0.3em] text-foreground/90 font-medium backdrop-blur transition-silk hover:border-primary hover:text-primary hover:bg-muted focus:outline-none focus:ring-4 focus:ring-primary/40"
            >
              Novedades
            </a>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 -bottom-40 h-80 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </section>

      {/* Catalog */}
      <section id="coleccion" className="mx-auto max-w-7xl px-5 sm:px-8 py-24 md:py-32 scroll-mt-24">
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-primary font-bold">La colección</p>
            <h2 className="mt-4 font-serif text-5xl sm:text-6xl text-foreground">Piezas selectas</h2>
          </div>
          <p className="max-w-md text-base text-muted-foreground leading-relaxed">
            Cada objeto, una invitación. Tacto, materiales y diseño pensados para el placer adulto de forma confidencial.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
               <div key={i} className="aspect-[3/4] animate-pulse rounded-[8px] border border-border/60 bg-card/60" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center rounded-[8px] border border-border/40 bg-card/30">
             <p className="font-serif text-3xl text-muted-foreground">Próximamente.</p>
             <p className="mt-2 text-muted-foreground/70">Nuestra selección está siendo curada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-border/80 bg-background/50 py-12 text-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
        <p>© Noir &amp; Or · Solo mayores de 18 años</p>
        <p className="mt-2 text-[10px] text-muted-foreground/60">Empaque y envío estrictamente discreto</p>
      </footer>
    </main>
  );
}
