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
      className="group relative cursor-pointer flex flex-col overflow-hidden rounded-[10px] border border-border/80 bg-card shadow-sm transition-transform duration-300 hover:scale-[1.02]"
    >
      <div className="h-44 sm:h-52 md:h-64 w-full overflow-hidden bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-serif text-3xl italic text-gradient-ruby opacity-50">PULSO</span>
          </div>
        )}
      </div>

      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex-1">
          <h3 className="font-serif text-sm sm:text-base md:text-lg font-medium text-foreground leading-tight">
            {product.title}
          </h3>
          {isOutOfStock && (
            <p className="mt-1 text-xs uppercase tracking-widest text-rose-400 font-bold">Agotado</p>
          )}
        </div>

        <div className="flex flex-col items-end justify-between">
          <div className="text-sm font-semibold text-foreground">
            {formatPrice(currentPrice)}
          </div>
          {product.is_promo && product.sale_price && (
            <div className="text-[11px] line-through text-muted-foreground mt-1">{formatPrice(product.price)}</div>
          )}

          <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            aria-label="Añadir a la bolsa"
            className="mt-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/95 text-primary-foreground shadow-sm hover:scale-105 focus:outline-none"
          >
            {isOutOfStock ? <ShoppingBag className="h-4 w-4 opacity-60" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </article>
  );
}
