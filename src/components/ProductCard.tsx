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
    event.preventDefault();
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
      className="group relative cursor-pointer flex flex-col overflow-hidden rounded-[16px] sm:rounded-[20px] border border-border/80 bg-card shadow-sm transition-transform duration-300 hover:scale-[1.02] h-full"
    >
      <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden border-b border-border/40 bg-muted">
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

      <div className="p-3 sm:p-4 flex flex-col grow justify-between bg-card">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold tracking-widest text-muted-foreground">
              {formatPrice(currentPrice)}
            </span>
            <button
              onClick={handleAdd}
              disabled={isOutOfStock}
              aria-label="Añadir a la bolsa"
              className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform duration-200 hover:scale-105 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isOutOfStock ? <ShoppingBag className="h-3 w-3 opacity-60" /> : <Plus className="h-4 w-4" />}
            </button>
          </div>
          <h3 className="font-serif text-sm sm:text-base font-medium text-foreground leading-tight text-left line-clamp-2">
            {product.title}
          </h3>
        </div>
        {isOutOfStock && (
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-rose-400 font-bold mt-2 text-left">Agotado</p>
        )}
      </div>
    </article>
  );
}
