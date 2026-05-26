import { useEffect, useState } from "react";
import { Minus, Plus, X, Trash2, ArrowLeft } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function generateOrderId() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `#A${n}`;
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}

export function CartDrawer() {
  const { items, isOpen, close, setQty, remove, total: subtotal, clear } = useCart();
  const [waNumber, setWaNumber] = useState<string>("");

  // Checkout form states
  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryType, setDeliveryType] = useState<"home" | "pickup">("home");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"transfer" | "cod" | "card">("transfer");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Reset step when drawer closes or items empty
  useEffect(() => {
    if (!isOpen) {
      setStep("cart");
    }
  }, [isOpen]);

  useEffect(() => {
    if (items.length === 0) {
      setStep("cart");
    }
  }, [items]);

  // Pricing calculations
  const shippingCost = deliveryType === "pickup" ? 0 : subtotal >= 100 ? 0 : 10;

  let paymentAdjustment = 0;
  if (paymentMethod === "transfer") {
    paymentAdjustment = -Math.round(subtotal * 0.05 * 100) / 100;
  } else if (paymentMethod === "cod") {
    paymentAdjustment = 5;
  }

  const grandTotal = subtotal + shippingCost + paymentAdjustment;

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (!name.trim() || !phone.trim() || (deliveryType === "home" && !address.trim())) {
      toast.error("Por favor completa los campos requeridos");
      return;
    }

    setIsSubmitting(true);
    const orderId = generateOrderId();

    // Prepare order details for Supabase
    const orderPayload = {
      order_id: orderId,
      customer_name: name,
      customer_phone: phone,
      delivery_type: deliveryType === "home" ? "Envío a domicilio" : "Retiro discreto",
      delivery_address: deliveryType === "home" ? address : "N/A (Retiro Discreto)",
      payment_method:
        paymentMethod === "transfer"
          ? "Transferencia Bancaria"
          : paymentMethod === "cod"
          ? "Pago contra entrega"
          : "Tarjeta de Crédito/Débito",
      subtotal,
      shipping_cost: shippingCost,
      payment_adjustment: paymentAdjustment,
      total: grandTotal,
      items: items as any, // Cast to any to bypass strict JSONB checks in compiler
      status: "pending",
    };

    try {
      // Save order to Supabase
      const { error } = await supabase.from("orders").insert(orderPayload);
      if (error) {
        console.error("Error saving order to Supabase:", error);
      }
    } catch (err) {
      console.error("Failed to insert order:", err);
    }

    // Build the WhatsApp message template
    const resumen = items
      .map((i) => `• ${i.quantity}x ${i.title} — ${formatPrice(i.price * i.quantity)}`)
      .join("%0A");

    const msg =
      `Hola Noir & Or.%0A` +
      `Deseo realizar la siguiente compra (Pedido: *${orderId}*):%0A%0A` +
      `👤 *CLIENTE*%0A` +
      `Nombre: ${name}%0A` +
      `Contacto: ${phone}%0A%0A` +
      `📦 *ENTREGA*%0A` +
      `Tipo: ${deliveryType === "home" ? "Envío a domicilio" : "Retiro discreto"}%0A` +
      (deliveryType === "home" ? `Dirección: ${address}%0A%0A` : `%0A`) +
      `💳 *PAGO*%0A` +
      `Método: ${
        paymentMethod === "transfer"
          ? "Transferencia Bancaria (5% desc.)"
          : paymentMethod === "cod"
          ? "Pago contra entrega"
          : "Tarjeta de Crédito/Débito"
      }%0A%0A` +
      `🛒 *DETALLE DEL PEDIDO*%0A` +
      `${resumen}%0A%0A` +
      `💰 *RESUMEN*%0A` +
      `Subtotal: ${formatPrice(subtotal)}%0A` +
      `Envío: ${shippingCost === 0 ? "Gratis" : formatPrice(shippingCost)}%0A` +
      (paymentAdjustment !== 0
        ? `Ajuste de Pago: ${paymentAdjustment < 0 ? "-" : "+"}${formatPrice(Math.abs(paymentAdjustment))}%0A`
        : "") +
      `*Total a Pagar: ${formatPrice(grandTotal)}*%0A%0A` +
      `Quedo atento a las instrucciones para completar mi compra. ¡Muchas gracias!`;

    const cleanWaNumber = waNumber.replace(/\D/g, "") || "5215555555555";
    const url = `https://wa.me/${cleanWaNumber}?text=${msg}`;

    setIsSubmitting(false);
    clear();
    setStep("cart");
    close();
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
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
            {step === "checkout" ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep("cart")}
                  className="p-1 hover:text-primary transition-colors"
                  aria-label="Volver"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Datos del Pedido</p>
                  <h2 className="font-serif text-2xl text-foreground">Checkout</h2>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Tu selección</p>
                <h2 className="font-serif text-2xl text-foreground">Bolsa privada</h2>
              </div>
            )}
            <button
              onClick={close}
              aria-label="Cerrar"
              className="inline-flex h-9 w-9 items-center justify-center rounded-[5px] border border-border hover:border-primary hover:text-primary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <p className="font-serif text-xl text-foreground/90">Tu bolsa aguarda.</p>
                <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                  Cada elección, una confidencia. Selecciona una pieza para comenzar.
                </p>
              </div>
            ) : step === "cart" ? (
              /* Step 1: Cart list */
              <ul className="space-y-5">
                {items.map((i) => (
                  <li key={i.id} className="flex gap-4 border-b border-border/40 pb-5">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[5px] bg-muted">
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
                      <div className="mt-3 inline-flex w-fit items-center gap-3 rounded-[5px] border border-border px-2 py-1">
                        <button
                          onClick={() => setQty(i.id, i.quantity - 1)}
                          className="h-6 w-6 inline-flex items-center justify-center rounded-[5px] hover:text-primary"
                          aria-label="Restar"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="min-w-4 text-center text-sm">{i.quantity}</span>
                        <button
                          onClick={() => setQty(i.id, i.quantity + 1)}
                          className="h-6 w-6 inline-flex items-center justify-center rounded-[5px] hover:text-primary"
                          aria-label="Sumar"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              /* Step 2: Checkout Form */
              <form onSubmit={handleConfirmOrder} className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Sofía García"
                    className="mt-2 w-full rounded-[5px] border border-border bg-input/50 px-4 py-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">WhatsApp / Celular</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej. +5215512345678"
                    className="mt-2 w-full rounded-[5px] border border-border bg-input/50 px-4 py-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Tipo de Entrega</label>
                  <select
                    value={deliveryType}
                    onChange={(e) => setDeliveryType(e.target.value as "home" | "pickup")}
                    className="mt-2 w-full rounded-[5px] border border-border bg-input/50 px-4 py-3 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="home">Envío a domicilio</option>
                    <option value="pickup">Retiro discreto (Punto acordado)</option>
                  </select>
                </div>

                {deliveryType === "home" && (
                  <div>
                    <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Dirección Completa</label>
                    <textarea
                      required
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Calle, Número, Colonia, C.P., Ciudad"
                      className="mt-2 w-full rounded-[5px] border border-border bg-input/50 px-4 py-3 text-sm focus:border-primary focus:outline-none resize-none"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Método de Pago</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as "transfer" | "cod" | "card")}
                    className="mt-2 w-full rounded-[5px] border border-border bg-input/50 px-4 py-3 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="transfer">Transferencia Bancaria (5% de desc.)</option>
                    <option value="cod">Pago contra entrega (+$5.00)</option>
                    <option value="card">Tarjeta de Crédito / Débito</option>
                  </select>
                </div>
              </form>
            )}
          </div>

          {/* Footer with Calculations */}
          <div className="border-t border-border/60 px-6 py-5 space-y-4 bg-background/40">
            {items.length > 0 && (
              <div className="space-y-2 border-b border-border/40 pb-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {step === "checkout" && (
                  <>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Envío</span>
                      <span>{shippingCost === 0 ? "Gratis" : formatPrice(shippingCost)}</span>
                    </div>
                    {paymentAdjustment !== 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Ajuste de Pago</span>
                        <span className={paymentAdjustment < 0 ? "text-emerald-500" : ""}>
                          {paymentAdjustment < 0 ? "-" : "+"}{formatPrice(Math.abs(paymentAdjustment))}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Total</span>
              <span className="font-serif text-2xl text-primary">
                {formatPrice(step === "checkout" ? grandTotal : subtotal)}
              </span>
            </div>

            {step === "cart" ? (
              <button
                onClick={() => setStep("checkout")}
                disabled={items.length === 0}
                className="w-full rounded-[5px] bg-primary py-4 text-sm font-semibold uppercase tracking-[0.25em] text-primary-foreground transition-all hover:glow-ruby disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continuar con el Pedido
              </button>
            ) : (
              <button
                onClick={handleConfirmOrder}
                disabled={items.length === 0 || isSubmitting}
                className="w-full rounded-[5px] bg-primary py-4 text-sm font-semibold uppercase tracking-[0.25em] text-primary-foreground transition-all hover:glow-ruby disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmitting ? "Procesando..." : "Confirmar y enviar por WhatsApp"}
              </button>
            )}

            {step === "cart" && items.length > 0 && (
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
