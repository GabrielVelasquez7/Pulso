import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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



function Index() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 20;

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
                  <ProductCard key={p.id} product={p} onSelect={() => { window.location.href = `/productos/${p.id}`; }} />
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
          // Static Grid View
          <div className="max-w-7xl mx-auto px-5 w-full">
            <h2 className="font-serif text-3xl sm:text-4xl text-center mb-12 flex flex-col items-center gap-3">
              Catálogo <span className="text-sm font-sans uppercase tracking-[0.3em] text-muted-foreground">{products.length} Piezas exclusivas</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 lg:gap-10">
              {products.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE).map((p, i) => (
                <div 
                  key={p.id} 
                  className="animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both"
                  style={{ animationDelay: `${Math.min(i * 100, 1000)}ms` }}
                >
                  <ProductCard product={p} onSelect={() => { window.location.href = `/productos/${p.id}`; }} />
                </div>
              ))}
            </div>
            
            {products.length > ITEMS_PER_PAGE && (
              <div className="mt-16 flex items-center justify-center gap-6">
                <button
                  onClick={() => {
                    setCurrentPage(prev => Math.max(0, prev - 1));
                    document.getElementById("coleccion")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  disabled={currentPage === 0}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-border/80 bg-background/80 text-foreground transition-all hover:border-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm uppercase tracking-[0.2em] text-muted-foreground font-bold">
                  {currentPage + 1} / {Math.ceil(products.length / ITEMS_PER_PAGE)}
                </span>
                <button
                  onClick={() => {
                    setCurrentPage(prev => Math.min(Math.ceil(products.length / ITEMS_PER_PAGE) - 1, prev + 1));
                    document.getElementById("coleccion")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  disabled={currentPage >= Math.ceil(products.length / ITEMS_PER_PAGE) - 1}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-border/80 bg-background/80 text-foreground transition-all hover:border-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      <footer className="shrink-0 border-t border-border/80 bg-background py-4 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground z-10">
        <p>© PULSO </p>
      </footer>
    </main>
  );
}
