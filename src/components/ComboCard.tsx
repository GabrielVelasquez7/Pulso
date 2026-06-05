import { useCart } from "@/lib/cart-context";
import { useCurrency } from "@/lib/currency-context";

export function ComboCard({ combo, products }: { combo: any; products: any[] }) {
  const { add, open } = useCart();
  const { formatPrice } = useCurrency();
  const total = combo.price ?? products.reduce((s, p) => s + (p.price || 0), 0);

  const handleAddCombo = () => {
    products.forEach((p) => add({ id: p.id, title: p.title, price: p.is_promo && p.sale_price ? p.sale_price : p.price, image_url: p.image_url }));
    open();
  };

  return (
    <article className="group relative cursor-default rounded-[12px] border border-border/40 bg-card p-4 shadow-sm flex items-center gap-4">
      <div className="flex gap-2">
        {products.slice(0,3).map(p => (
          <img key={p.id} src={p.image_url || ''} alt={p.title} className="h-16 w-16 object-cover rounded-sm" />
        ))}
      </div>
      <div className="flex-1">
        <h4 className="font-medium">{combo.name}</h4>
        <p className="text-xs text-muted-foreground">{products.length} productos</p>
      </div>
      <div className="text-right">
        <div className="font-bold">{formatPrice(total)}</div>
        <button onClick={handleAddCombo} className="mt-2 rounded-md bg-primary px-3 py-2 text-xs text-primary-foreground">Añadir combo</button>
      </div>
    </article>
  );
}
