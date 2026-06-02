import { BedDouble, Check, Home, MapPin, Sparkles, Star, MessageCircle, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { Product } from "@/components/ProductCard";
import { ProductCard } from "@/components/ProductCard";

const usageIcons = [
  { icon: Home, label: "Hogar" },
  { icon: BedDouble, label: "Dormitorio" },
  { icon: MapPin, label: "Viaje" },
  { icon: Sparkles, label: "Spa" },
];

const defaultPros = [
  "Diseño discreto y premium",
  "Materiales suaves al tacto",
  "Fácil de limpiar y guardar",
  "Entrega confidencial y rápida",
];

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
  const [rating, setRating] = useState(4);
  const { add, open } = useCart();

  const onAdd = () => {
    add({
      id: product.id,
      title: product.title,
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
        <div className="lg:sticky lg:top-6 group relative overflow-hidden rounded-[24px] border border-border/50 bg-card/60 p-4 shadow-elegant backdrop-blur-lg lg:max-w-[45%] w-full">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.title}
              className="h-full w-full rounded-[20px] object-cover"
            />
          ) : (
            <div className="flex h-96 items-center justify-center rounded-[20px] bg-muted text-3xl font-semibold text-muted-foreground">
              Noir
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background/90 via-background/10 to-transparent" />
        </div>

        <div className="flex-1">
          <button
            onClick={onBack}
            className="hidden lg:inline-flex mb-6 items-center gap-2 rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm uppercase tracking-[0.25em] text-muted-foreground transition hover:border-primary hover:text-primary"
          >
            Volver a la colección
          </button>

          <div className="mb-8 flex flex-col gap-4 rounded-[24px] border border-border/50 bg-card/80 p-6 sm:p-8 shadow-elegant backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-primary">Detalle del producto</p>
                <h1 className="mt-2 sm:mt-4 font-serif text-3xl sm:text-4xl leading-tight text-foreground">{product.title}</h1>
              </div>
              <div className="space-y-1 sm:space-y-2 text-left sm:text-right">
                <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-muted-foreground">Precio</p>
                <p className="text-2xl sm:text-3xl font-semibold text-gradient-ruby">
                  {product.is_promo && product.sale_price != null ? product.sale_price.toLocaleString("es-MX", { style: "currency", currency: "USD", minimumFractionDigits: 2 }) : product.price.toLocaleString("es-MX", { style: "currency", currency: "USD", minimumFractionDigits: 2 })}
                </p>
                {product.is_promo && product.sale_price != null ? (
                  <p className="text-xs sm:text-sm text-muted-foreground line-through">{product.price.toLocaleString("es-MX", { style: "currency", currency: "USD", minimumFractionDigits: 2 })}</p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setRating(index + 1)}
                      className="rounded-full p-1 transition hover:text-amber-300"
                      aria-label={`Valorar ${index + 1} estrella${index + 1 === 1 ? "" : "s"}`}
                    >
                      <Star
                        className={`h-6 w-6 ${index < rating ? "text-amber-400" : "text-muted-foreground/60"}`}
                      />
                    </button>
                  ))}
                  <span className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
                    {rating}.0 / 5
                  </span>
                </div>
                <p className="text-sm leading-7 text-muted-foreground">
                  {product.description ?? "Una experiencia íntima diseñada para elevar tu placer con discreción, confort y calidad premium."}
                </p>
              </div>

              <div className="grid gap-3 rounded-[20px] bg-background/90 p-4 text-sm text-muted-foreground">
                <div className="rounded-[16px] bg-muted/30 p-4">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Disponible</p>
                  <p className="mt-2 text-base font-semibold text-foreground">{product.stock > 0 ? "En stock" : "Agotado"}</p>
                </div>
                <div className="rounded-[16px] bg-muted/30 p-4">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Uso recomendado</p>
                  <p className="mt-2 text-base font-semibold text-foreground">Intimidad, relajación, juego sensual</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:gap-6">
            {usageIcons.map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-[20px] border border-border/50 bg-card/75 p-4 sm:p-5 text-center transition-all duration-300 hover:border-primary/30">
                <Icon className="mx-auto mb-2 sm:mb-3 h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-[24px] border border-border/50 bg-card/90 p-6 sm:p-8 shadow-elegant backdrop-blur-xl">
            <h2 className="font-serif text-2xl text-foreground">Pros</h2>
            <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
              {defaultPros.map((pro) => (
                <li key={pro} className="flex items-start gap-3 rounded-[16px] border border-border/40 bg-background/70 p-4 transition-all duration-300 hover:border-primary/20">
                  <Check className="mt-1 h-4 w-4 text-primary shrink-0" />
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card/45 sm:bg-transparent border border-border/30 sm:border-0 rounded-[24px] p-6 sm:p-0">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Precios con envío discreto</p>
              <p className="mt-2 text-base sm:text-lg text-muted-foreground">Compra ahora y recibe en urna sin marca.</p>
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

          {/* WhatsApp Callout */}
          <div className="mt-10 rounded-[24px] border border-emerald-500/20 bg-emerald-500/5 p-6 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-6 transition-all duration-300 hover:border-emerald-500/40 hover:bg-emerald-500/10">
            <div className="flex items-center gap-4 text-left">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-medium text-foreground">¿Tienes dudas sobre esta pieza?</h3>
                <p className="text-sm text-muted-foreground mt-1">Pregúntanos por WhatsApp con total discreción y anonimato.</p>
              </div>
            </div>
            <a
              href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, tengo dudas sobre el producto "${product.title}" (${window.location.href})`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-[12px] bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-sm font-bold uppercase tracking-[0.2em] text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.4)]"
            >
              Consultar dudas
            </a>
          </div>
        </div>
      </div>

      <div className="mt-20">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-serif text-3xl text-foreground">Recomendados</h2>
          <p className="text-sm text-muted-foreground">Sigue explorando otras piezas</p>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {recommendedProducts.map((recommended) => (
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
            <span className="text-lg font-bold text-gradient-ruby leading-none">
              {product.is_promo && product.sale_price != null 
                ? product.sale_price.toLocaleString("es-MX", { style: "currency", currency: "USD", minimumFractionDigits: 0 }) 
                : product.price.toLocaleString("es-MX", { style: "currency", currency: "USD", minimumFractionDigits: 0 })}
            </span>
            {product.is_promo && product.sale_price != null && (
              <span className="text-xs line-through text-muted-foreground leading-none">
                {product.price.toLocaleString("es-MX", { style: "currency", currency: "USD", minimumFractionDigits: 0 })}
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
