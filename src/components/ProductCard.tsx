import { useCart } from "@/lib/cart-context";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export type Product = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price: number;
  sale_price: number | null;
  is_promo: boolean;
  stock: number;
};

function formatPrice(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}

export function ProductCard({ product }: { product: Product }) {
  const { add, open } = useCart();
  const effectivePrice = product.is_promo && product.sale_price != null ? product.sale_price : product.price;
  const onAdd = () => {
    add({ id: product.id, title: product.title, price: Number(effectivePrice), image_url: product.image_url });
    toast.success("Añadido a tu bolsa", { description: product.title });
    open();
  };

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm transition-silk hover:-translate-y-1 hover:border-primary/60 hover:shadow-elegant">
      {/* ruby halo on hover */}
      <div aria-hidden className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-700 group-hover:opacity-100" style={{ background: "linear-gradient(135deg, oklch(0.52 0.22 15 / 0.35), transparent 50%, oklch(0.35 0.16 15 / 0.25))" }} />

      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-serif text-3xl italic text-gradient-ruby">
            Noir
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-90" />
        {product.is_promo && (
          <span className="absolute left-3 top-3 rounded-full bg-gradient-wine px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-foreground shadow-wine">
            Promoción
          </span>
        )}
        {product.stock <= 0 && (
          <span className="absolute right-3 top-3 rounded-full border border-border bg-background/80 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-muted-foreground backdrop-blur">
            Agotado
          </span>
        )}
      </div>

      <div className="relative flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="font-serif text-xl leading-tight text-foreground transition-colors duration-500 group-hover:text-primary">{product.title}</h3>
          {product.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between pt-2">
          <div className="flex items-baseline gap-2">
            {product.is_promo && product.sale_price != null ? (
              <>
                <span className="text-xl font-medium text-gradient-ruby">{formatPrice(Number(product.sale_price))}</span>
                <span className="text-sm text-muted-foreground line-through">{formatPrice(Number(product.price))}</span>
              </>
            ) : (
              <span className="text-xl font-medium text-gradient-ruby">{formatPrice(Number(product.price))}</span>
            )}
          </div>
          <button
            onClick={onAdd}
            disabled={product.stock <= 0}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-foreground transition-silk hover:scale-105 hover:border-primary hover:bg-gradient-ruby hover:text-primary-foreground hover:shadow-[0_0_25px_-5px_var(--ruby)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          >
            <Plus className="h-3 w-3" />
            Añadir
          </button>
        </div>
      </div>
    </article>
  );
}
