import { useCart } from "@/lib/cart-context";
import { Plus, ShoppingBag } from "lucide-react";
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
    minimumFractionDigits: 0,
  }).format(n);
}

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();

  const handleAdd = () => {
    add({
      id: product.id,
      title: product.title,
      price: product.is_promo && product.sale_price ? product.sale_price : product.price,
      image_url: product.image_url,
    });
    toast.success("Añadido a la bolsa", {
      description: product.title,
    });
  };

  const isOutOfStock = product.stock <= 0;
  const currentPrice = product.is_promo && product.sale_price ? product.sale_price : product.price;

  return (
    <article className="group relative flex overflow-hidden rounded-[8px] border border-border/80 bg-card aspect-square h-full w-full shadow-sm transition-transform duration-500 hover:scale-[1.02] hover:shadow-elegant">
      {/* Background Image */}
      {product.image_url ? (
        <img
          src={product.image_url}
          alt={product.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-110"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="font-serif text-3xl italic text-gradient-ruby opacity-50">PULSO</span>
        </div>
      )}

      {/* Overlays to ensure text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-background/40 opacity-80 transition-opacity duration-500 group-hover:opacity-60" />

      {/* Top Left: Price Badge */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <div className="inline-flex items-center rounded-full bg-background/80 backdrop-blur px-3 py-1.5 border border-border/50 shadow-sm">
          <span className="text-sm font-bold text-foreground">
            {formatPrice(currentPrice)}
          </span>
          {product.is_promo && product.sale_price && (
            <span className="ml-2 text-[10px] line-through text-muted-foreground">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
        {product.is_promo && (
          <span className="inline-flex w-fit items-center rounded-full bg-primary/20 backdrop-blur px-2 py-0.5 text-[10px] uppercase tracking-widest text-primary border border-primary/20">
            Promo
          </span>
        )}
      </div>

      {/* Bottom Content Area */}
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
        {/* Bottom Left: Title */}
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-2xl font-medium leading-tight text-foreground truncate drop-shadow-md">
            {product.title}
          </h3>
          {isOutOfStock && (
            <p className="mt-1 text-xs uppercase tracking-widest text-rose-400 font-bold">
              Agotado
            </p>
          )}
        </div>

        {/* Bottom Right: Add Button */}
        <button
          onClick={handleAdd}
          disabled={isOutOfStock}
          aria-label="Añadir a la bolsa"
          className="shrink-0 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_20px_-5px_var(--ruby)] transition-all duration-300 hover:scale-110 hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          {isOutOfStock ? <ShoppingBag className="h-5 w-5 opacity-50" /> : <Plus className="h-6 w-6" />}
        </button>
      </div>
    </article>
  );
}
