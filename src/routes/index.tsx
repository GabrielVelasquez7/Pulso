import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type Product } from "@/components/ProductCard";
import pulsoLogo from "@/routes/img/pulsgo.png";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "PULSO — Colección íntima" },
      { name: "description", content: "Una colección discreta de bienestar y placer. Diseño sofisticado, envío confidencial." },
    ],
  }),
});

// A reusable Carousel component that auto-scrolls and supports manual arrows
function CarouselRow({ products, direction = "left" }: { products: Product[], direction?: "left" | "right" }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Repeat the products to simulate infinite scrolling
  const repeatedItems = Array(15).fill(products).flat();

  // Initial scroll position to the middle so we can scroll left or right
  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      el.scrollLeft = el.scrollWidth / 2;
    }
  }, [products]);

  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();

    const step = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      if (scrollRef.current && !isHovered) {
        const el = scrollRef.current;
        // Speed: pixels per millisecond
        const speed = 0.03; 
        const move = speed * delta;

        if (direction === "left") {
          el.scrollLeft += move;
        } else {
          el.scrollLeft -= move;
        }

        // Loop back to middle if reaching bounds to keep it "infinite"
        if (el.scrollLeft <= 0) {
          el.scrollLeft = el.scrollWidth / 2;
        } else if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 10) {
          el.scrollLeft = (el.scrollWidth / 2) - el.clientWidth;
        }
      }
      animationId = requestAnimationFrame(step);
    };

    animationId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationId);
  }, [isHovered, direction]);

  const handleManualScroll = (amount: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Manual Controls */}
      <button 
        onClick={() => handleManualScroll(-350)}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-background/80 backdrop-blur border border-border/80 flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-all opacity-0 group-hover:opacity-100 shadow-elegant"
        aria-label="Anterior"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <div 
        ref={scrollRef}
        className="flex gap-10 px-5 overflow-x-auto no-scrollbar py-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {repeatedItems.map((p, i) => (
          <div key={`${i}-${p.id}`} className="w-[260px] sm:w-[320px] shrink-0">
            <ProductCard product={p} />
          </div>
        ))}
      </div>

      <button 
        onClick={() => handleManualScroll(350)}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-background/80 backdrop-blur border border-border/80 flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-all opacity-0 group-hover:opacity-100 shadow-elegant"
        aria-label="Siguiente"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  );
}

function Index() {
  const [products, setProducts] = useState<Product[]>([]);
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

  // Filter products based on search query (ignoring case and accents)
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
            Solo para adultos · 100% Confidencial
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
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10">
             <p className="font-serif text-3xl text-muted-foreground">Próximamente.</p>
             <p className="mt-2 text-muted-foreground/70">Nuestra selección está siendo curada.</p>
          </div>
        ) : (
          // Carousel View
          <>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background via-background/80 to-transparent z-10" />

            <div className="flex flex-col gap-10 md:gap-16">
              <CarouselRow products={products} direction="left" />
              {products.length > 1 && (
                <CarouselRow products={row2Products} direction="right" />
              )}
            </div>
          </>
        )}
      </section>

      <footer className="shrink-0 border-t border-border/80 bg-background py-4 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground z-10">
        <p>© PULSO · Envío discreto garantizado</p>
      </footer>
    </main>
  );
}
