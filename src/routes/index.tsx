import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type Product } from "@/components/ProductCard";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "PULSO — Colección íntima" },
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

  // Duplicate items for the infinite scrolling marquee
  const marqueeItemsRow1 = [...products, ...products, ...products];
  // Reverse or offset row 2 for variety
  const row2Items = [...products].reverse();
  const marqueeItemsRow2 = [...row2Items, ...row2Items, ...row2Items];

  return (
    <main className="flex flex-col min-h-[calc(100vh-5rem)] overflow-hidden">
      {/* Hero */}
      <section className="relative shrink-0 border-b border-border/80 bg-background z-10">
        {/* decorative orbs */}
        <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-gradient-ruby opacity-[0.20] blur-[100px] float-slow" />
        <div aria-hidden className="pointer-events-none absolute top-20 -right-24 h-[250px] w-[250px] rounded-full bg-gradient-wine opacity-[0.25] blur-[100px] float-slow" style={{ animationDelay: "1.5s" }} />
        
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 py-10 md:py-16 text-center">
          <p className="inline-flex items-center gap-3 rounded-[8px] border border-primary/50 bg-background/60 px-5 py-2 text-xs uppercase tracking-[0.4em] text-primary backdrop-blur shadow-sm">
            <span className="h-2 w-2 rounded-full bg-primary glow-pulse" />
            +18 · Confidencial
          </p>
          <h1 className="mt-8 font-serif text-5xl sm:text-7xl md:text-8xl leading-[0.9] text-balance text-foreground drop-shadow-sm">
            Bienestar íntimo,
            <br />
            <span className="italic text-gradient-ruby drop-shadow-lg">el ritmo de tu placer.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-balance leading-relaxed">
            Una colección discreta de piezas seleccionadas. Tacto, materiales y diseño pensados para ti.
          </p>
        </div>
      </section>

      {/* Catalog - Double Carousel */}
      <section id="coleccion" className="flex-1 relative flex flex-col justify-center py-6 overflow-hidden bg-background/50">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />

        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-pulse rounded-[8px] border border-border/60 bg-card/60 h-64 w-64" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center">
             <p className="font-serif text-3xl text-muted-foreground">Próximamente.</p>
             <p className="mt-2 text-muted-foreground/70">Nuestra selección está siendo curada.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Row 1 - Marquee Left */}
            <div className="flex w-max animate-marquee-left pause-hover">
              <div className="flex gap-6 px-3">
                {marqueeItemsRow1.map((p, i) => (
                  <div key={`r1-${i}-${p.id}`} className="w-[280px] shrink-0">
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            </div>

            {/* Row 2 - Marquee Right */}
            {products.length > 1 && (
              <div className="flex w-max animate-marquee-right pause-hover">
                <div className="flex gap-6 px-3">
                  {marqueeItemsRow2.map((p, i) => (
                    <div key={`r2-${i}-${p.id}`} className="w-[280px] shrink-0">
                      <ProductCard product={p} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <footer className="shrink-0 border-t border-border/80 bg-background py-4 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground z-10">
        <p>© PULSO · Solo mayores de 18 años · Envío discreto</p>
      </footer>
    </main>
  );
}
