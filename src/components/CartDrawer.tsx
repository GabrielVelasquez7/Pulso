import { useEffect, useState } from "react";
import { Minus, Plus, X, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { supabase } from "@/integrations/supabase/client";

function generateOrderId() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `#A${n}`;
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}

export function CartDrawer() {
  const { items, isOpen, close, setQty, remove, total, clear } = useCart();
  const [waNumber, setWaNumber] = useState<string>("");

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "whatsapp_number")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) setWaNumber(data.value);
      });
  }, []);

  const handleWhatsApp = () => {
    if (items.length === 0) return;
    const orderId = generateOrderId();
    const resumen = items
      .map((i) => `• ${i.quantity}x ${i.title} — ${formatPrice(i.price * i.quantity)}`)
      .join("%0A");
    const msg =
      `Hola. Deseo gestionar el siguiente pedido confidencial ${orderId}.%0A%0A` +
      `Resumen:%0A${resumen}%0A%0A` +
      `Total: ${formatPrice(total)}.%0A%0A` +
      `Quedo a la espera de sus instrucciones para el pago y envío discreto.`;
    const url = `https://wa.me/${waNumber.replace(/\D/g, "")}?text=${msg}`;
    window.open(url, "_blank");
  };

  return (
    <>
      <div
        onClick={close}
        className={`fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md transform border-l border-border/70 bg-card shadow-elegant transition-transform duration-500 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Tu selección</p>
              <h2 className="font-serif text-2xl text-foreground">Bolsa privada</h2>
            </div>
            <button
              onClick={close}
              aria-label="Cerrar"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <p className="font-serif text-xl text-foreground/90">Tu bolsa aguarda.</p>
                <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                  Cada elección, una confidencia. Selecciona una pieza para comenzar.
                </p>
              </div>
            ) : (
              <ul className="space-y-5">
                {items.map((i) => (
                  <li key={i.id} className="flex gap-4 border-b border-border/40 pb-5">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                      {i.image_url && (
                        <img src={i.image_url} alt={i.title} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-serif text-lg leading-tight">{i.title}</h3>
                          <p className="mt-1 text-sm text-primary">{formatPrice(i.price)}</p>
                        </div>
                        <button
                          onClick={() => remove(i.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-3 inline-flex w-fit items-center gap-3 rounded-full border border-border px-2 py-1">
                        <button
                          onClick={() => setQty(i.id, i.quantity - 1)}
                          className="h-6 w-6 inline-flex items-center justify-center rounded-full hover:text-primary"
                          aria-label="Restar"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="min-w-4 text-center text-sm">{i.quantity}</span>
                        <button
                          onClick={() => setQty(i.id, i.quantity + 1)}
                          className="h-6 w-6 inline-flex items-center justify-center rounded-full hover:text-primary"
                          aria-label="Sumar"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-border/60 px-6 py-5 space-y-4 bg-background/40">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Total</span>
              <span className="font-serif text-2xl text-primary">{formatPrice(total)}</span>
            </div>
            <button
              onClick={handleWhatsApp}
              disabled={items.length === 0}
              className="w-full rounded-md bg-primary py-4 text-sm font-semibold uppercase tracking-[0.25em] text-primary-foreground transition-all hover:glow-ruby disabled:cursor-not-allowed disabled:opacity-40"
            >
              Confirmar pedido vía WhatsApp
            </button>
            {items.length > 0 && (
              <button
                onClick={clear}
                className="block w-full text-center text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
              >
                Vaciar bolsa
              </button>
            )}
            <p className="text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
              Envío discreto · Compra confidencial
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
