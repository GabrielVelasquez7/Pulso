import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useCurrency } from "@/lib/currency-context";

export function ComboCard({ combo, products }: { combo: any; products: any[] }) {
  const { add, open } = useCart();
  const { formatPrice } = useCurrency();
  const total = combo.price ?? products.reduce((s, p) => s + (p.price || 0), 0);
  const [selected, setSelected] = useState(0);

  const handleAddCombo = () => {
    products.forEach((p) => add({ id: p.id, title: p.title, price: p.is_promo && p.sale_price ? p.sale_price : p.price, image_url: p.image_url }));
    open();
  };

  const handleAddSingle = () => {
    const p = products[selected];
    if (!p) return;
    add({ id: p.id, title: p.title, price: p.is_promo && p.sale_price ? p.sale_price : p.price, image_url: p.image_url });
    open();
  };

  return (
    <article className="group relative cursor-default rounded-[12px] border border-border/40 bg-card p-4 shadow-sm flex flex-col sm:flex-row items-center gap-4">
      <div className="flex items-center gap-2">
        <button onClick={() => setSelected((s) => (s - 1 + products.length) % products.length)} className="p-1 rounded-md bg-input border border-border hover:bg-muted">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="h-20 w-20 overflow-hidden rounded-sm bg-muted border border-border/40">
          {products[selected] && (
            <img src={products[selected].image_url || ""} alt={products[selected].title} className="h-full w-full object-cover" />
          )}
        </div>
        <button onClick={() => setSelected((s) => (s + 1) % products.length)} className="p-1 rounded-md bg-input border border-border hover:bg-muted">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 w-full">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h4 className="font-medium">{combo.name}</h4>
            <p className="text-xs text-muted-foreground">{products.length} productos</p>
            <p className="mt-1 text-sm text-muted-foreground">Seleccionado: {products[selected]?.title}</p>
          </div>
          <div className="text-right">
            <div className="font-bold">{formatPrice(total)}</div>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button onClick={handleAddCombo} className="rounded-md bg-primary px-3 py-2 text-xs text-primary-foreground">Añadir combo</button>
          <button onClick={handleAddSingle} className="rounded-md border border-border px-3 py-2 text-xs">Añadir seleccionado</button>
        </div>
      </div>
    </article>
  );
}
