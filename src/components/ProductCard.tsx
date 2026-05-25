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
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-border/60 bg-card/80 transition-all duration-500 hover:border-primary/50 hover:shadow-elegant">
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-serif text-2xl text-muted-foreground">
            Noir
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60" />
        {product.is_promo && (
          <span className="absolute left-3 top-3 rounded-full border border-primary/60 bg-background/70 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-primary backdrop-blur">
            Promoción
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="font-serif text-xl leading-tight text-foreground">{product.title}</h3>
          {product.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between pt-2">
          <div className="flex items-baseline gap-2">
            {product.is_promo && product.sale_price != null ? (
              <>
                <span className="text-lg font-medium text-primary">{formatPrice(Number(product.sale_price))}</span>
                <span className="text-sm text-muted-foreground line-through">{formatPrice(Number(product.price))}</span>
              </>
            ) : (
              <span className="text-lg font-medium text-primary">{formatPrice(Number(product.price))}</span>
            )}
          </div>
          <button
            onClick={onAdd}
            disabled={product.stock <= 0}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-foreground transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-3 w-3" />
            Añadir
          </button>
        </div>
      </div>
    </article>
  );
}
