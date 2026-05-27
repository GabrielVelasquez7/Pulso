import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type Product } from "@/components/ProductCard";
import pulsoLogo from "@/routes/img/pulsgo.png";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "PULSO — Colección íntima" },
      { name: "description", content: "Una colección discreta de bienestar y placer. Diseño sofisticado, envío confidencial." },
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

  const marqueeItemsRow1 = [...products, ...products, ...products, ...products];
  const row2Items = [...products].reverse();
  const marqueeItemsRow2 = [...row2Items, ...row2Items, ...row2Items, ...row2Items];

  return (
    <main className="flex flex-col min-h-[calc(100vh-5rem)] overflow-hidden">
      {/* Hero */}
      <section className="relative flex-1 min-h-[40vh] flex flex-col items-center justify-center border-b border-border/80 bg-background z-10 px-5 text-center">
        {/* Dynamic Background Effects */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-ruby opacity-[0.15] blur-[120px] float-slow" />
          <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] translate-x-1/3 translate-y-1/3 rounded-full bg-gradient-wine opacity-[0.20] blur-[120px] float-slow" style={{ animationDelay: "2s" }} />
          <div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary opacity-[0.05] blur-[100px] glow-pulse" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          <div className="flex justify-center mb-6">
             <img src={pulsoLogo} alt="PULSO Logo" className="h-16 md:h-24 opacity-90 drop-shadow-lg" />
          </div>
          
          <p className="inline-flex items-center gap-3 rounded-full border border-primary/30 bg-background/80 px-6 py-2.5 text-xs uppercase tracking-[0.4em] text-primary backdrop-blur shadow-sm mx-auto">
            <span className="h-2 w-2 rounded-full bg-primary glow-pulse" />
            Solo para adultos · 100% Confidencial
          </p>
          
          <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl leading-[0.95] text-balance text-foreground drop-shadow-sm">
            Encuentra <span className="italic text-gradient-ruby">tu ritmo</span>.
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground text-balance leading-relaxed">
            Una selección exclusiva para quienes exploran el placer sin restricciones.
            Materiales premium, empaques discretos y una experiencia inolvidable.
          </p>
        </div>
      </section>

      {/* Catalog - Double Carousel */}
      <section id="coleccion" className="shrink-0 relative flex flex-col justify-center py-12 md:py-16 overflow-hidden bg-background/50 border-t border-border/40 shadow-[inset_0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background via-background/80 to-transparent z-10" />

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-pulse rounded-[8px] border border-border/60 bg-card/60 h-64 w-64" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10">
             <p className="font-serif text-3xl text-muted-foreground">Próximamente.</p>
             <p className="mt-2 text-muted-foreground/70">Nuestra selección está siendo curada.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-10 md:gap-16">
            {/* Row 1 - Marquee Left */}
            <div className="flex w-max animate-marquee-left pause-hover">
              <div className="flex gap-10 px-5">
                {marqueeItemsRow1.map((p, i) => (
                  <div key={`r1-${i}-${p.id}`} className="w-[260px] sm:w-[320px] shrink-0">
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            </div>

            {/* Row 2 - Marquee Right */}
            {products.length > 1 && (
              <div className="flex w-max animate-marquee-right pause-hover">
                <div className="flex gap-10 px-5">
                  {marqueeItemsRow2.map((p, i) => (
                    <div key={`r2-${i}-${p.id}`} className="w-[260px] sm:w-[320px] shrink-0">
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
        <p>© PULSO · Envío discreto garantizado</p>
      </footer>
    </main>
  );
}
