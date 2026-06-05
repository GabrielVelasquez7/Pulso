import type { MouseEvent } from "react";
import { useCart } from "@/lib/cart-context";
import { useCurrency } from "@/lib/currency-context";
import { Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

export type Product = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  image_2_url?: string | null;
  image_3_url?: string | null;
  features?: string | null;
  usages?: string | null;
  price: number;
  sale_price: number | null;
  is_promo: boolean;
  stock: number;
  related_product_id?: string | null;
  related_product_id_2?: string | null;
  related_product_id_3?: string | null;
  related_product_id_4?: string | null;
};



export function ProductCard({
  product,
  onSelect,
}: {
  product: Product;
  onSelect?: (product: Product) => void;
}) {
  const { add, open } = useCart();
  const { formatPrice } = useCurrency();
  const isOutOfStock = product.stock <= 0;
  const currentPrice = product.is_promo && product.sale_price ? product.sale_price : product.price;

  const handleAdd = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    add({
      id: product.id,
      title: product.title,
      price: currentPrice,
      image_url: product.image_url,
    });
    toast.success("Añadido a la bolsa", {
      description: product.title,
    });
    open();
  };

  return (
    <article
      onClick={() => onSelect?.(product)}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && onSelect) {
          event.preventDefault();
          onSelect(product);
        }
      }}
      tabIndex={onSelect ? 0 : undefined}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-[8px] border border-border/80 bg-card aspect-square h-full w-full shadow-sm transition-transform duration-500 hover:scale-[1.02] hover:shadow-elegant"
    >
      {product.image_url ? (
        <img
          src={product.image_url}
          alt={product.title}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-110"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="font-serif text-3xl italic text-gradient-ruby opacity-50">PULSO</span>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-background/40 transition-opacity duration-500 opacity-60 group-hover:opacity-40" />

      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
        <div className="inline-flex items-center rounded-full bg-background/80 backdrop-blur px-3 py-1 border border-border/50 shadow-sm">
          <span className="text-sm font-semibold text-foreground">
            {formatPrice(currentPrice)}
          </span>
          {product.is_promo && product.sale_price && (
            <span className="ml-2 text-[10px] line-through text-muted-foreground">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
        {product.is_promo && (
          <span className="inline-flex w-fit items-center rounded-full bg-brand-rose/20 backdrop-blur px-2 py-0.5 text-[10px] uppercase tracking-widest text-brand-rose border border-brand-rose/30 shadow-sm">
            Promo
          </span>
        )}
      </div>

      <button
        onClick={handleAdd}
        disabled={isOutOfStock}
        aria-label="Añadir a la bolsa"
        className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-primary/95 backdrop-blur text-primary-foreground shadow-[0_0_14px_-6px_var(--ruby)] transition-all duration-300 hover:scale-105 hover:bg-primary focus:outline-none focus:ring-4 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
      >
        {isOutOfStock ? <ShoppingBag className="h-5 w-5 opacity-50" /> : <Plus className="h-5 w-5" />}
      </button>

      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col items-start gap-1">
        <h3 className="font-serif text-lg font-medium leading-tight text-foreground drop-shadow-md">
          {product.title}
        </h3>
        {isOutOfStock && (
          <p className="mt-1 text-xs uppercase tracking-widest text-rose-400 font-bold drop-shadow-md">
            Agotado
          </p>
        )}
      </div>
    </article>
  );
}
