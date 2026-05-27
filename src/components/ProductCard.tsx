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
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

export function ProductCard({ product }: { product: Product }) {
  const { add, open } = useCart();
  const effectivePrice =
    product.is_promo && product.sale_price != null ? product.sale_price : product.price;
  const onAdd = () => {
    add({
      id: product.id,
      title: product.title,
      price: Number(effectivePrice),
      image_url: product.image_url,
    });
    toast.success("Añadido a tu bolsa", { description: product.title });
    open();
  };

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[8px] border border-border/80 bg-card backdrop-blur-sm transition-silk hover:-translate-y-1 hover:border-primary/60 hover:shadow-elegant h-full">
      {/* ruby halo on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-[8px] opacity-0 transition-opacity duration-700 group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.55 0.22 15 / 0.4), transparent 50%, oklch(0.40 0.16 15 / 0.3))",
        }}
      />

      <div className="relative overflow-hidden bg-muted aspect-square w-full shrink-0">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-serif text-3xl italic text-gradient-ruby">
            PULSO
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-95" />
        
        {product.is_promo && (
          <span className="absolute left-4 top-4 rounded-[5px] bg-primary px-3 py-1.5 text-xs uppercase tracking-[0.25em] text-primary-foreground font-bold shadow-ruby">
            Promoción
          </span>
        )}
        {product.stock <= 0 && (
          <span className="absolute right-4 top-4 rounded-[5px] border border-border bg-background/90 px-3 py-1.5 text-xs uppercase tracking-[0.25em] text-muted-foreground font-semibold backdrop-blur">
            Agotado
          </span>
        )}
      </div>

      <div className="relative flex flex-1 flex-col gap-4 p-6">
        <div>
          <h3 className="font-serif text-2xl leading-tight text-foreground transition-colors duration-500 group-hover:text-primary">
            {product.title}
          </h3>
          {product.description && (
            <p className="mt-2 line-clamp-2 text-base text-muted-foreground leading-relaxed">{product.description}</p>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between pt-4">
          <div className="flex flex-col gap-1">
            {product.is_promo && product.sale_price != null ? (
              <>
                <span className="text-sm text-muted-foreground line-through font-medium">
                  {formatPrice(Number(product.price))}
                </span>
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(Number(product.sale_price))}
                </span>
              </>
            ) : (
              <span className="text-2xl font-bold text-primary">
                {formatPrice(Number(product.price))}
              </span>
            )}
          </div>
          <button
            onClick={onAdd}
            disabled={product.stock <= 0}
            className="inline-flex h-12 min-w-[100px] items-center justify-center gap-2 rounded-[5px] border border-border bg-input px-5 text-sm uppercase tracking-[0.2em] text-foreground font-medium transition-silk hover:scale-105 hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-ruby focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-input disabled:hover:text-foreground disabled:hover:border-border disabled:hover:shadow-none"
          >
            <Plus className="h-4 w-4" />
            Añadir
          </button>
        </div>
      </div>
    </article>
  );
}
