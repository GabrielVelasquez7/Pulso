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
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-24 md:py-36 text-center">
          <p className="text-[11px] uppercase tracking-[0.4em] text-primary">+18 · Confidencial</p>
          <h1 className="mt-6 font-serif text-5xl sm:text-7xl md:text-8xl leading-[0.95] text-balance">
            Bienestar íntimo,
            <br />
            <span className="italic text-primary">elegancia nocturna.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-xl text-base text-muted-foreground text-balance">
            Una colección discreta de piezas seleccionadas para quienes entienden que
            el deseo, como el lujo, no se anuncia. Se susurra.
          </p>
          <a
            href="#coleccion"
            className="mt-10 inline-flex items-center justify-center rounded-md border border-primary px-8 py-4 text-xs uppercase tracking-[0.3em] text-primary transition-all hover:bg-primary hover:text-primary-foreground hover:glow-gold"
          >
            Explorar la colección
          </a>
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
