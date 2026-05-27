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
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
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
      items,
      status: "pending",
    };

    try {
      const { error } = await supabase.from("orders").insert(orderPayload);
      if (error) {
        console.error("Error saving order to Supabase:", error);
      }
    } catch (err) {
      console.error("Failed to insert order:", err);
    }

    const resumen = items.map((i) => `• ${i.quantity}x ${i.title}`).join("\n");
    const msg =
      `Hola Noir & Or.\n\n` +
      `Nombre: ${name}\n` +
      `ID del pedido: ${orderId}\n` +
      `Productos:\n` +
      `${resumen}\n\n` +
      `Dirección: ${deliveryType === "home" ? address : "Retiro discreto"}`;

    const cleanWaNumber = waNumber.replace(/\D/g, "") || "5215555555555";
    const url = `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(msg)}`;

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
        className={`fixed inset-0 z-50 bg-black/70 backdrop-blur-md transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed right-0 top-0 z-50 h-[100dvh] w-full max-w-md transform border-l border-border bg-card shadow-elegant transition-transform duration-500 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-20 items-center justify-between border-b border-border/80 px-6 bg-card/50">
            {step === "checkout" ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setStep("cart")}
                  className="p-2 -ml-2 rounded-[5px] hover:bg-muted text-muted-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                  aria-label="Volver"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold">
                    Datos del Pedido
                  </p>
                  <h2 className="font-serif text-3xl text-foreground">Checkout</h2>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold">
                  Tu selección
                </p>
                <h2 className="font-serif text-3xl text-foreground">Bolsa privada</h2>
              </div>
            )}
            <button
              onClick={close}
              aria-label="Cerrar"
              className="inline-flex h-11 w-11 items-center justify-center rounded-[5px] border border-border bg-input/50 hover:bg-muted hover:border-primary hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 h-20 w-20 rounded-full bg-gradient-ruby opacity-20 blur-xl" />
                <p className="font-serif text-3xl text-foreground">Tu bolsa aguarda.</p>
                <p className="mt-4 max-w-[250px] text-base text-muted-foreground leading-relaxed">
                  Cada elección, una confidencia. Selecciona una pieza de la colección para comenzar.
                </p>
              </div>
            ) : step === "cart" ? (
              /* Step 1: Cart list */
              <ul className="space-y-6">
                {items.map((i) => (
                  <li key={i.id} className="flex gap-5 border-b border-border/50 pb-6">
                    <div className="h-28 w-24 shrink-0 overflow-hidden rounded-[8px] bg-muted border border-border/40">
                      {i.image_url ? (
                        <img
                          src={i.image_url}
                          alt={i.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-serif italic text-muted-foreground">Noir</div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-serif text-xl leading-tight text-foreground">{i.title}</h3>
                          <p className="mt-2 font-medium text-primary text-lg">{formatPrice(i.price)}</p>
                        </div>
                        <button
                          onClick={() => remove(i.id)}
                          className="p-2 -mr-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-[5px] transition-colors focus:outline-none"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="mt-4 inline-flex w-fit items-center gap-4 rounded-[5px] border border-border bg-input/50 px-2 py-1.5">
                        <button
                          onClick={() => setQty(i.id, i.quantity - 1)}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-[5px] text-foreground hover:bg-muted hover:text-primary focus:outline-none"
                          aria-label="Restar"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="min-w-[1.5rem] text-center font-medium text-base">{i.quantity}</span>
                        <button
                          onClick={() => setQty(i.id, i.quantity + 1)}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-[5px] text-foreground hover:bg-muted hover:text-primary focus:outline-none"
                          aria-label="Sumar"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              /* Step 2: Checkout Form */
              <form id="checkout-form" onSubmit={handleConfirmOrder} className="space-y-6">
                <div>
                  <label className="text-sm uppercase tracking-[0.2em] text-muted-foreground font-medium">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Sofía García"
                    className="mt-2 w-full rounded-[8px] border border-border bg-input px-5 py-4 text-base focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm uppercase tracking-[0.2em] text-muted-foreground font-medium">
                    WhatsApp / Celular
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej. +52 1 55 1234 5678"
                    className="mt-2 w-full rounded-[8px] border border-border bg-input px-5 py-4 text-base focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm uppercase tracking-[0.2em] text-muted-foreground font-medium">
                    Tipo de Entrega
                  </label>
                  <select
                    value={deliveryType}
                    onChange={(e) => setDeliveryType(e.target.value as "home" | "pickup")}
                    className="mt-2 w-full rounded-[8px] border border-border bg-input px-5 py-4 text-base focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none appearance-none"
                  >
                    <option value="home">Envío a domicilio</option>
                    <option value="pickup">Retiro discreto (Punto acordado)</option>
                  </select>
                </div>

                {deliveryType === "home" && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-sm uppercase tracking-[0.2em] text-muted-foreground font-medium">
                      Dirección Completa
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Calle, Número, Colonia, C.P., Ciudad"
                      className="mt-2 w-full rounded-[8px] border border-border bg-input px-5 py-4 text-base focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none resize-none"
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm uppercase tracking-[0.2em] text-muted-foreground font-medium">
                    Método de Pago
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as "transfer" | "cod" | "card")
                    }
                    className="mt-2 w-full rounded-[8px] border border-border bg-input px-5 py-4 text-base focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none appearance-none"
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
          <div className="border-t border-border/80 px-6 py-6 space-y-5 bg-card shrink-0">
            {items.length > 0 && (
              <div className="space-y-3 border-b border-border/50 pb-4 text-base">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="text-foreground">{formatPrice(subtotal)}</span>
                </div>
                {step === "checkout" && (
                  <>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Envío discreto</span>
                      <span className="text-foreground">{shippingCost === 0 ? "Gratis" : formatPrice(shippingCost)}</span>
                    </div>
                    {paymentAdjustment !== 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Ajuste de Pago</span>
                        <span className={paymentAdjustment < 0 ? "text-primary font-medium" : "text-foreground"}>
                          {paymentAdjustment < 0 ? "-" : "+"}
                          {formatPrice(Math.abs(paymentAdjustment))}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="flex items-end justify-between">
              <span className="text-sm uppercase tracking-[0.25em] text-muted-foreground font-bold">
                Total
              </span>
              <span className="font-serif text-3xl font-bold text-primary leading-none">
                {formatPrice(step === "checkout" ? grandTotal : subtotal)}
              </span>
            </div>

            {step === "cart" ? (
              <button
                onClick={() => setStep("checkout")}
                disabled={items.length === 0}
                className="w-full rounded-[8px] bg-primary py-5 text-sm font-bold uppercase tracking-[0.25em] text-primary-foreground transition-all hover:glow-ruby focus:outline-none focus:ring-4 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continuar con el Pedido
              </button>
            ) : (
              <button
                type="submit"
                form="checkout-form"
                disabled={items.length === 0 || isSubmitting}
                className="w-full rounded-[8px] bg-primary py-5 text-sm font-bold uppercase tracking-[0.25em] text-primary-foreground transition-all hover:glow-ruby focus:outline-none focus:ring-4 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Procesando..." : "Enviar por WhatsApp"}
              </button>
            )}

            {step === "cart" && items.length > 0 && (
              <button
                onClick={clear}
                className="block w-full text-center text-sm uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors p-2"
              >
                Vaciar bolsa
              </button>
            )}

            <p className="text-center text-xs uppercase tracking-[0.3em] text-muted-foreground/60">
              Compra 100% confidencial
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
