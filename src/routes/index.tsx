import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type Product } from "@/components/ProductCard";
import { ProductDetail } from "@/components/ProductDetail";
import pulsoLogo from "@/routes/img/pulsgo.png";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "PULSO — Colección íntima" },
      { name: "description", content: "Una colección discreta de bienestar y placer. Diseño sofisticado, envío confidencial." },
    ],
  }),
});

function CarouselRow({ products, direction = "forward" }: { products: Product[], direction?: "forward" | "backward" }) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true, 
      dragFree: true,
      align: "start"
    },
    [
      AutoScroll({
        playOnInit: true,
        speed: 0.6,
        direction: direction,
        stopOnInteraction: false,
        stopOnMouseEnter: false, // We'll handle this manually on the parent
      })
    ]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onMouseEnter = useCallback(() => {
    if (!emblaApi) return;
    const autoScroll = emblaApi.plugins().autoScroll;
    if (autoScroll) autoScroll.stop();
  }, [emblaApi]);

  const onMouseLeave = useCallback(() => {
    if (!emblaApi) return;
    const autoScroll = emblaApi.plugins().autoScroll;
    if (autoScroll) autoScroll.play();
  }, [emblaApi]);

  return (
    <div 
      className="relative group px-5 py-2"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Manual Controls */}
      <button
        onClick={scrollPrev}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-background/80 backdrop-blur border border-border/80 flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-all opacity-0 group-hover:opacity-100 shadow-elegant"
        aria-label="Anterior"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex" style={{ touchAction: 'pan-y pinch-zoom' }}>
          {products.map((p, i) => (
            <div key={`${i}-${p.id}`} className="flex-[0_0_auto] w-[260px] sm:w-[320px] transform-gpu pr-8">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={scrollNext}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-background/80 backdrop-blur border border-border/80 flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-all opacity-0 group-hover:opacity-100 shadow-elegant"
        aria-label="Siguiente"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  );
}

function Index() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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

  const normalizedSearch = searchQuery.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredProducts = products.filter(p => {
    const titleMatch = p.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(normalizedSearch);
    const descMatch = p.description && p.description.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(normalizedSearch);
    return titleMatch || descMatch;
  });

  const isSearching = searchQuery.trim().length > 0;

  // Separate array for right-scrolling row
  const row2Products = [...products].reverse();

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
            Solo para adultos
          </p>

          <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl leading-[0.95] text-balance text-foreground drop-shadow-sm">
            Encuentra <span className="italic text-gradient-ruby">tu ritmo</span>.
          </h1>

          <p className="mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground text-balance leading-relaxed mb-6">
            Una selección exclusiva para quienes exploran el placer sin restricciones.
            Materiales premium, empaques discretos y una experiencia inolvidable.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-md mx-auto mt-8">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar piezas, categorías..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-input/40 backdrop-blur-md border border-border/80 rounded-full py-4 pl-14 pr-6 text-base focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 transition-all shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* Catalog */}
      {/* Catalog */}
      <section id="coleccion" className="shrink-0 relative flex flex-col justify-center py-12 md:py-16 bg-background/50 border-t border-border/40 shadow-[inset_0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-pulse rounded-[8px] border border-border/60 bg-card/60 h-64 w-64" />
          </div>
        ) : isSearching ? (
          // Grid View for Search Results
          <div className="max-w-7xl mx-auto px-5 w-full">
            <h2 className="font-serif text-3xl mb-8 flex items-center gap-3">
              Resultados de búsqueda <span className="text-sm font-sans bg-muted text-muted-foreground px-3 py-1 rounded-full">{filteredProducts.length}</span>
            </h2>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No encontramos ninguna pieza con ese nombre.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredProducts.map(p => (
                  <ProductCard key={p.id} product={p} onSelect={setSelectedProduct} />
                ))}
              </div>
            )}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10">
            <p className="font-serif text-3xl text-muted-foreground">Próximamente.</p>
            <p className="mt-2 text-muted-foreground/70">Nuestra selección está siendo curada.</p>
          </div>
        ) : selectedProduct ? (
          <ProductDetail
            product={selectedProduct}
            recommendedProducts={products.filter((product) => product.id !== selectedProduct.id).slice(0, 4)}
            onBack={() => setSelectedProduct(null)}
            onSelectProduct={setSelectedProduct}
          />
        ) : (
          // Carousel View
          <>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background via-background/80 to-transparent z-10" />

            <div className="flex flex-col gap-10 md:gap-16">
              <CarouselRow products={products} direction="forward" />
              {products.length > 1 && (
                <CarouselRow products={row2Products} direction="backward" />
              )}
            </div>
          </>
        )}
      </section>

          </div>
        ) : (
          // Carousel View
          <>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background via-background/80 to-transparent z-10" />

            <div className="flex flex-col gap-10 md:gap-16">
              <CarouselRow products={products} direction="forward" />
              {products.length > 1 && (
                <CarouselRow products={row2Products} direction="backward" />
              )}
            </div>
          </>
        )}
      </section>

      <footer className="shrink-0 border-t border-border/80 bg-background py-4 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground z-10">
        <p>© PULSO </p>
      </footer>
    </main>
  );
}
