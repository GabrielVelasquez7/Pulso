import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useCurrency } from "@/lib/currency-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export function ComboCard({ combo, products }: { combo: any; products: any[] }) {
  const { add, open } = useCart();
  const { formatPrice } = useCurrency();
  const total = combo.price ?? products.reduce((s, p) => s + (p.price || 0), 0);
  const [openModal, setOpenModal] = useState(false);

  const handleAddCombo = () => {
    products.forEach((p) => add({ id: p.id, title: p.title, price: p.is_promo && p.sale_price ? p.sale_price : p.price, image_url: p.image_url }));
    open();
  };

  const mainImage = products[0]?.image_url || '';

  return (
    <>
      <article
        onClick={() => setOpenModal(true)}
        className="group relative cursor-pointer rounded-[10px] border border-border/80 bg-card shadow-sm overflow-hidden"
      >
        <div className="h-44 w-full overflow-hidden bg-muted">
          {mainImage ? (
            <img src={mainImage} alt={combo.name} className="w-full h-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-serif italic text-muted-foreground">PULSO</div>
          )}
        </div>

        <div className="p-3 flex items-center justify-between">
          <div>
            <h4 className="font-medium text-sm">{combo.name}</h4>
            <p className="text-xs text-muted-foreground">{products.length} productos</p>
          </div>
          <div className="text-right">
            <div className="font-bold">{formatPrice(total)}</div>
            <button onClick={(e) => { e.stopPropagation(); handleAddCombo(); }} className="mt-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
              +
            </button>
          </div>
        </div>
      </article>

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{combo.name}</DialogTitle>
            <DialogDescription>Detalles del combo</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {products.map((p) => (
                <div key={p.id} className="flex flex-col gap-2">
                  <div className="h-40 w-full overflow-hidden rounded-md bg-muted">
                    {p.image_url ? <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" /> : null}
                  </div>
                  <div>
                    <div className="font-medium">{p.title}</div>
                    <div className="text-sm text-muted-foreground">{formatPrice(p.is_promo && p.sale_price ? p.sale_price : p.price)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-border/50 flex items-center justify-between">
              <div className="font-semibold">Total: {formatPrice(total)}</div>
              <div className="flex gap-2">
                <button onClick={() => setOpenModal(false)} className="rounded-md border px-4 py-2">Cerrar</button>
                <button onClick={() => { handleAddCombo(); setOpenModal(false); }} className="rounded-md bg-primary px-4 py-2 text-primary-foreground">Añadir combo</button>
              </div>
            </div>
          </div>

          <DialogFooter />
        </DialogContent>
      </Dialog>
    </>
  );
}
