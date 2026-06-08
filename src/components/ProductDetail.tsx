import { Check, Sparkles, MessageCircle, ArrowLeft, ChevronLeft, ChevronRight, Star, Gift } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { useCart } from "@/lib/cart-context";
import { useCurrency } from "@/lib/currency-context";
import { Product } from "@/components/ProductCard";
import { ProductCard } from "@/components/ProductCard";
import useEmblaCarousel from "embla-carousel-react";
import { supabase } from "@/integrations/supabase/client";

interface ProductDetailProps {
  product: Product;
  recommendedProducts: Product[];
  whatsappNumber?: string;
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
}

export function ProductDetail({
  product,
  recommendedProducts,
  whatsappNumber = "5215555555555",
  onBack,
  onSelectProduct,
}: ProductDetailProps) {
  const { add, open } = useCart();
  const { formatPrice } = useCurrency();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelectEmbla = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  const [discount2, setDiscount2] = useState(0);
  const [discount3, setDiscount3] = useState(0);
  const [relatedProductsList, setRelatedProductsList] = useState<Product[]>([]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelectEmbla);
    onSelectEmbla();
  }, [emblaApi, onSelectEmbla]);

  useEffect(() => {
    supabase.from("site_settings").select("*").in("key", ["discount_2_items", "discount_3_items"]).then(({ data }) => {
      if (data) {
        data.forEach(s => {
          if (s.key === "discount_2_items") setDiscount2(Number(s.value));
          if (s.key === "discount_3_items") setDiscount3(Number(s.value));
        });
      }
    });

    const relatedIds = [
      product.related_product_id,
      product.related_product_id_2,
      product.related_product_id_3,
      product.related_product_id_4
    ].filter(Boolean) as string[];

    if (relatedIds.length > 0) {
      const foundInRecommended = recommendedProducts.filter(p => relatedIds.includes(p.id));
      const missingIds = relatedIds.filter(id => !foundInRecommended.find(p => p.id === id));

      if (missingIds.length > 0) {
        supabase.from("products").select("*").in("id", missingIds).then(({ data }) => {
          const dbProducts = (data || []) as Product[];
          const allRelated = [...foundInRecommended, ...dbProducts];
          const uniqueRelated = Array.from(new Map(allRelated.map(item => [item.id, item])).values());
          setRelatedProductsList(uniqueRelated);
        });
      } else {
        setRelatedProductsList(foundInRecommended);
      }
    } else {
      setRelatedProductsList([]);
    }
  }, [product, recommendedProducts]);

  const relatedIdsForFilter = relatedProductsList.map(rp => rp.id);
  const filteredRecommended = recommendedProducts.filter(p => !relatedIdsForFilter.includes(p.id));

  const images = [product.image_url, product.image_2_url, product.image_3_url].filter(Boolean) as string[];

  const cleanTitle = product.title.toUpperCase().startsWith("[COMBO] ") 
    ? product.title.substring(8) 
    : product.title;

  const onAdd = () => {
    add({
      id: product.id,
      title: cleanTitle,
      price: Number(product.is_promo && product.sale_price != null ? product.sale_price : product.price),
      image_url: product.image_url,
    });
    open();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 overflow-auto p-4 sm:p-6 pb-28 sm:pb-8" role="dialog" aria-modal="true">
      <button
        onClick={onBack}
        className="fixed top-4 left-4 z-50 inline-flex items-center justify-center h-10 w-10 rounded-full border border-border/70 bg-background/80 backdrop-blur-md text-muted-foreground hover:text-primary transition shadow-md lg:hidden"
        aria-label="Volver a la colección"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <section className="mx-auto max-w-7xl px-5 sm:px-8 py-10 sm:py-20">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
          <div className="lg:sticky lg:top-6 group relative overflow-hidden rounded-[24px] border border-border/50 bg-card/60 p-3 sm:p-4 shadow-elegant backdrop-blur-lg lg:max-w-[45%] w-full flex flex-col gap-4 transition-all hover:border-primary/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
            <div className="relative overflow-hidden rounded-[20px] bg-muted/30 flex-1 min-h-[350px] sm:min-h-[500px]" ref={emblaRef}>
              <div className="flex h-full touch-pan-y">
                {images.length > 0 ? (
                  images.map((img, idx) => (
                    <div className="relative flex-[0_0_100%] h-full" key={idx}>
                      <img src={img} alt={`${product.title} - Vista ${idx + 1}`} className="h-full w-full object-cover" />
                    </div>
                  ))
                ) : (
                  <div className="flex flex-[0_0_100%] h-full items-center justify-center text-3xl font-serif text-muted-foreground opacity-50 italic">
                    PULSO
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <>
                  <button onClick={() => emblaApi?.scrollPrev()} className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/60 backdrop-blur-md border border-border/40 text-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg hover:bg-background/90 hover:scale-105" aria-label="Anterior">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button onClick={() => emblaApi?.scrollNext()} className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/60 backdrop-blur-md border border-border/40 text-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg hover:bg-background/90 hover:scale-105" aria-label="Siguiente">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2.5 z-10 bg-background/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-border/20">
                    {images.map((_, idx) => (
                      <button key={idx} onClick={() => emblaApi?.scrollTo(idx)} className={`h-2 rounded-full transition-all duration-500 ${idx === selectedIndex ? "w-6 bg-primary" : "w-2 bg-primary/40 hover:bg-primary/70"}`} aria-label={`Ir a imagen ${idx + 1}`} />
                    ))}
                  </div>
                </>
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
            </div>
          </div>

          <div className="flex-1">
            <button
              onClick={onBack}
              className="hidden lg:inline-flex mb-6 items-center gap-2 rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm uppercase tracking-[0.25em] text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              Volver a la colección
            </button>

            {discount2 > 0 && (
              <div className="mb-6 rounded-[16px] border border-primary/30 bg-primary/5 p-4 flex items-center justify-between gap-4 shadow-sm animate-in fade-in zoom-in duration-500">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-ruby flex items-center justify-center text-primary-foreground shadow-[0_0_15px_rgba(var(--ruby-rgb),0.5)]">
                    <Gift className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground uppercase tracking-widest">Oferta por Volumen</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Lleva 2 piezas y te descontamos <span className="font-bold text-primary">{formatPrice(discount2)}</span></p>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-8 flex flex-col gap-4 rounded-[24px] border border-border/50 bg-card/80 p-6 sm:p-8 shadow-elegant backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-primary">Detalle del producto</p>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-background/50 border border-border/40 shadow-sm">
                      <div className={`h-1.5 w-1.5 rounded-full ${product.stock > 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} />
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">{product.stock > 0 ? 'Disponible' : 'Agotado'}</span>
                    </div>
                  </div>
                  <h1 className="mt-2 sm:mt-4 font-serif text-3xl sm:text-4xl leading-tight text-foreground">{cleanTitle}</h1>

                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star key={idx} className="h-3.5 w-3.5 text-amber-400 fill-amber-400 drop-shadow-sm" />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-foreground/80">5.0</span>
                    <span className="text-xs text-muted-foreground">(+120 reviews)</span>
                  </div>
                </div>
                <div className="space-y-1 sm:space-y-2 text-left sm:text-right mt-2 sm:mt-0">
                  <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-muted-foreground">Precio</p>
                  <p className="text-2xl sm:text-3xl font-semibold text-gradient-brand">
                    {formatPrice(product.is_promo && product.sale_price != null ? product.sale_price : product.price)}
                  </p>
                  {product.is_promo && product.sale_price != null ? (
                    <p className="text-xs sm:text-sm text-muted-foreground line-through">{formatPrice(product.price)}</p>
                  ) : null}
                </div>
              </div>

              {product.description && (
                <div className="mt-4 sm:mt-6 border-t border-border/30 pt-4 sm:pt-6">
                  <p className="text-sm leading-relaxed text-muted-foreground text-pretty max-w-3xl">
                    {product.description}
                  </p>
                </div>
              )}
            </div>

            {product.usages && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-5 mb-8">
                {product.usages.split(",").map((usage, idx) => (
                  <div key={idx} className="rounded-[20px] border border-border/50 bg-card/60 p-4 text-center transition-all duration-500 hover:border-primary/40 hover:bg-card/90 shadow-sm hover:shadow-md group">
                    <Sparkles className="mx-auto mb-2.5 h-6 w-6 text-primary/60 group-hover:text-primary transition-colors duration-500 group-hover:scale-110" />
                    <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-foreground/80 font-bold">{usage.trim()}</p>
                  </div>
                ))}
              </div>
            )}

            {product.features && (
              <div className="mb-10 rounded-[24px] border border-border/50 bg-card/80 p-6 sm:p-8 shadow-elegant backdrop-blur-xl transition-all duration-500 hover:border-border/80">
                <h2 className="font-serif text-2xl text-foreground">Características</h2>
                <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  {product.features.split("\n").filter(f => f.trim()).map((pro, idx) => (
                    <li key={idx} className="flex items-start gap-3 rounded-[16px] border border-border/40 bg-background/50 p-4 transition-all duration-300 hover:border-primary/30 hover:bg-background/80 shadow-sm">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Check className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="leading-relaxed mt-0.5 text-foreground/90">{pro.trim()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card/45 sm:bg-transparent border border-border/30 sm:border-0 rounded-[24px] p-6 sm:p-0">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Envío Seguro</p>
                <p className="mt-2 text-base sm:text-lg text-muted-foreground">Compra ahora y recibe tu pedido de forma segura.</p>
              </div>
              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={onAdd}
                className="inline-flex items-center justify-center rounded-[12px] bg-gradient-ruby px-6 py-3 text-sm uppercase tracking-[0.3em] text-primary-foreground transition hover:scale-[1.01] hover:shadow-[0_0_35px_-10px_var(--ruby)] disabled:cursor-not-allowed disabled:opacity-50 w-full sm:w-auto"
              >
                Añadir a la bolsa
              </button>
            </div>

            {/* Subtle WhatsApp Callout */}
            <div className="mt-12 pt-10 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-6 transition-all">
              <div className="text-left space-y-1.5">
                <h3 className="text-sm uppercase tracking-[0.2em] text-foreground font-medium">Asesoría Personalizada</h3>
                <p className="text-sm text-muted-foreground">Consulta con uno de nuestros especialistas vía WhatsApp.</p>
              </div>
              <a
                href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, quisiera saber más sobre la pieza "${cleanTitle}" (${window.location.href})`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded-full border border-border/60 bg-transparent px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] text-foreground transition-all duration-300 hover:border-foreground/50 hover:bg-foreground/5 focus:outline-none"
              >
                <MessageCircle className="h-4 w-4 opacity-70" />
                <span>Contactar</span>
              </a>
            </div>
          </div>
        </div>

        {relatedProductsList.length > 0 && (
          <div className="mt-16 pt-10 border-t border-border/30 animate-in slide-in-from-bottom-8 duration-700">
            <div className="mb-8 text-center sm:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-rose/30 bg-brand-rose/10 px-3 py-1 text-xs uppercase tracking-widest text-brand-rose font-bold shadow-sm mb-3">
                <Sparkles className="h-3 w-3" /> {product.title.toUpperCase().startsWith("[COMBO] ") ? "Contenido del Combo" : "Combinación Perfecta"}
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-foreground">{product.title.toUpperCase().startsWith("[COMBO] ") ? "Piezas Incluidas" : "Complemento Ideal"}</h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto sm:mx-0">{product.title.toUpperCase().startsWith("[COMBO] ") ? "Este combo incluye las siguientes piezas de nuestra colección." : "Llévalos juntos y eleva tu experiencia."}</p>
            </div>
            <div className={`grid gap-6 ${relatedProductsList.length > 1 ? 'sm:grid-cols-2 xl:grid-cols-4' : 'max-w-xs mx-auto sm:mx-0 sm:max-w-sm'} relative group`}>
              <div className="absolute -inset-4 bg-gradient-ruby opacity-[0.02] blur-2xl rounded-full pointer-events-none group-hover:opacity-[0.06] transition-opacity duration-500" />
              {relatedProductsList.map((rp) => (
                <ProductCard key={rp.id} product={rp} onSelect={onSelectProduct} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-20">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-serif text-3xl text-foreground">Recomendados</h2>
            <p className="text-sm text-muted-foreground">Sigue explorando otras piezas</p>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {filteredRecommended.map((recommended) => (
              <ProductCard key={recommended.id} product={recommended} onSelect={onSelectProduct} />
            ))}
          </div>
        </div>
      </section>

      {/* Sticky Mobile Purchase Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-t border-border/80 p-4 flex items-center justify-between shadow-elegant">
        <div className="flex flex-col text-left">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground truncate max-w-[150px]">
            {product.title}
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-lg font-bold text-gradient-brand leading-none">
              {formatPrice(product.is_promo && product.sale_price != null ? product.sale_price : product.price)}
            </span>
            {product.is_promo && product.sale_price != null && (
              <span className="text-xs line-through text-muted-foreground leading-none">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          disabled={product.stock <= 0}
          onClick={onAdd}
          className="rounded-[10px] bg-gradient-ruby px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground transition hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {product.stock > 0 ? "Añadir" : "Agotado"}
        </button>
      </div>
    </div>
  );
}
