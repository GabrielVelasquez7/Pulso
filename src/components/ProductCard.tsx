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
      className="group relative cursor-pointer flex flex-col p-3 sm:p-4 overflow-hidden rounded-[16px] sm:rounded-[20px] border border-primary/20 bg-transparent shadow-sm transition-transform duration-300 hover:scale-[1.02] hover:border-primary/40 h-full"
    >
      {/* Top Badges */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
        <span className="rounded-full bg-[#DE5B61] px-2.5 py-1 text-[10px] sm:text-[11px] font-bold text-white shadow-sm">
          {formatPrice(currentPrice)}
        </span>
      </div>
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
        <button
          onClick={handleAdd}
          disabled={isOutOfStock}
          aria-label="Añadir a la bolsa"
          className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-[#DE5B61] text-white shadow-sm transition-transform duration-200 hover:scale-105 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isOutOfStock ? <ShoppingBag className="h-3 w-3 opacity-60" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>

      {/* Image Container */}
      <div className="relative aspect-square w-full mt-8 mb-4 sm:mt-10 sm:mb-6 overflow-hidden flex items-center justify-center">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-serif text-3xl italic text-gradient-ruby opacity-50">PULSO</span>
          </div>
        )}
      </div>

      {/* Title */}
      <div className="mt-auto text-left">
        <h3 className="font-serif text-sm sm:text-base font-medium text-foreground leading-tight line-clamp-2">
          {product.title}
        </h3>
        {isOutOfStock && (
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-rose-400 font-bold mt-1.5">Agotado</p>
        )}
      </div>
    </article>
  );
}
