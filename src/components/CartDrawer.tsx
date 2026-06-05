import { useEffect, useState } from "react";
import { Minus, Plus, X, Trash2, ArrowLeft, SmartphoneNfc, DollarSign, Bitcoin, Banknote } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/components/ProductCard";
import { useCurrency } from "@/lib/currency-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DEFAULT_ZONES, DeliveryZonesConfig } from "@/lib/default-zones";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

function generateOrderId() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `#P${n}`; // Changed to P for PULSO
}



export function CartDrawer() {
  const { items, isOpen, close, setQty, remove, total: subtotal, clear } = useCart();
  const { formatPrice, currency } = useCurrency();
  
  const [waNumber, setWaNumber] = useState<string>("");
  const [pmData, setPmData] = useState({ banco: "", telefono: "", cedula: "", nombre: "" });
  const [zelleEmail, setZelleEmail] = useState("");
  const [binanceId, setBinanceId] = useState("");
  const [discount2, setDiscount2] = useState(0);
  const [discount3, setDiscount3] = useState(0);
  const [zonesConfig, setZonesConfig] = useState<DeliveryZonesConfig>(DEFAULT_ZONES);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);

  // Checkout form states
  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryType, setDeliveryType] = useState<"home" | "pickup">("home");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pago_movil" | "zelle" | "binance" | "cash">("pago_movil");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<any | null>(null);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("*")
      .then(({ data }) => {
        if (data) {
          const dict: Record<string, string> = {};
          data.forEach(d => dict[d.key] = d.value);
          if (dict.whatsapp_number) setWaNumber(dict.whatsapp_number);
          setPmData({
            banco: dict.pago_movil_banco || "",
            telefono: dict.pago_movil_telefono || "",
            cedula: dict.pago_movil_cedula || "",
            nombre: dict.pago_movil_nombre || "",
          });
          if (dict.zelle_email) setZelleEmail(dict.zelle_email);
          if (dict.binance_id) setBinanceId(dict.binance_id);
          if (dict.discount_2_items) setDiscount2(Number(dict.discount_2_items));
          if (dict.discount_3_items) setDiscount3(Number(dict.discount_3_items));
          if (dict.delivery_zones) {
            try {
              const parsed = JSON.parse(dict.delivery_zones);
              if (Object.keys(parsed).length > 0) setZonesConfig(parsed);
            } catch(e) {}
          }
        }
      });
  }, []);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .order("title", { ascending: true })
      .then(({ data }) => {
        setCatalogProducts((data ?? []) as Product[]);
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
  const totalQty = items.reduce((acc, i) => acc + i.quantity, 0);
  let bundleDiscount = 0;
  if (totalQty >= 3 && discount3 > 0) {
    bundleDiscount = discount3;
  } else if (totalQty >= 2 && discount2 > 0) {
    bundleDiscount = discount2;
  }

  const discountTarget = totalQty >= 2 ? 3 : 2;
  const itemsToDiscount = Math.max(0, discountTarget - totalQty);
  const nextDiscountValue = totalQty >= 2 ? discount3 : discount2;
  const discountSuggestion = itemsToDiscount > 0 && nextDiscountValue > 0
    ? `Añade ${itemsToDiscount} producto${itemsToDiscount > 1 ? 's' : ''} más y obtén ${formatPrice(nextDiscountValue)} de descuento.`
    : "";

  const recommendedProducts = catalogProducts
    .filter((p) => !items.some((i) => i.id === p.id))
    .slice(0, 3);

  let dynamicShipping = 10;
  if (deliveryType === "home" && selectedLocation) {
    for (const zone of Object.values(zonesConfig)) {
      if (zone.locaciones.includes(selectedLocation)) {
        dynamicShipping = zone.precio;
        break;
      }
    }
  }

  const shippingCost = deliveryType === "pickup" ? 0 : subtotal >= 100 ? 0 : dynamicShipping;
  const grandTotal = Math.max(0, subtotal + shippingCost - bundleDiscount);

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (!name.trim() || !phone.trim() || (deliveryType === "home" && (!address.trim() || !selectedLocation))) {
      toast.error("Por favor completa los campos requeridos");
      return;
    }
    // Build pending order summary and open confirmation modal
    const paymentMethodNames = {
      "pago_movil": "Pago Móvil",
      "zelle": "Zelle",
      "binance": "Binance Pay",
      "cash": "Efectivo",
    };

    const orderId = generateOrderId();
    const orderPayload = {
      order_id: orderId,
      customer_name: name,
      customer_phone: phone,
      delivery_type: deliveryType === "home" ? "Envío a domicilio" : "Retiro en persona",
      delivery_address: deliveryType === "home" ? `${selectedLocation} - ${address}` : "N/A (Retiro en persona)",
      payment_method: paymentMethodNames[paymentMethod],
      subtotal,
      shipping_cost: shippingCost,
      payment_adjustment: -bundleDiscount,
      total: grandTotal,
      items,
      status: "pending",
    };

    setPendingOrder(orderPayload);
    setConfirmModalOpen(true);
  };

  const confirmAndSend = async () => {
    if (!pendingOrder) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("orders").insert(pendingOrder);
      if (error) {
        console.error("Error saving order to Supabase:", error);
      } else {
        try {
          await fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderDetails: pendingOrder })
          });
        } catch (emailErr) {
          console.error("Error triggering email notification:", emailErr);
        }
      }

      const resumen = items.map((i) => `• ${i.quantity}x ${i.title}`).join("\n");
      let paymentMsg = `Te envío los detalles de mi pedido ${pendingOrder.order_id} (Pago mediante ${pendingOrder.payment_method}).`;
      if (pendingOrder.payment_method === "Efectivo") {
        paymentMsg = `He seleccionado realizar el pago en Efectivo para el pedido ${pendingOrder.order_id} al momento del retiro.`;
      }

      let discountMsg = "";
      if (Math.abs(pendingOrder.payment_adjustment) > 0) {
         discountMsg = `(Descuento Aplicado: -${formatPrice(Math.abs(pendingOrder.payment_adjustment))})\n`;
      }

      const msg =
        `¡Hola equipo PULSO! ✨\n\n` +
        `${paymentMsg}\n\n` +
        `Nombre: ${pendingOrder.customer_name}\n` +
        `Productos:\n` +
        `${resumen}\n\n` +
        discountMsg +
        `Total a pagar: ${formatPrice(pendingOrder.total)}\n` +
        `Dirección: ${pendingOrder.delivery_type === "Envío a domicilio" ? pendingOrder.delivery_address : "Retiro en persona"}`;

      const cleanWaNumber = waNumber.replace(/\D/g, "") || "5215555555555";
      const url = `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(msg)}`;

      clear();
      setStep("cart");
      setConfirmModalOpen(false);
      setPendingOrder(null);
      close();
      window.open(url, "_blank");
    } catch (err) {
      console.error("Failed to confirm order:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const allLocations = Object.values(zonesConfig)
    .flatMap((z) => z.locaciones)
    .sort((a, b) => a.localeCompare(b));

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
                <div className="flex items-center gap-3">
                  <h2 className="font-serif text-2xl text-foreground">Bolsa privada</h2>
                  {bundleDiscount > 0 && (
                    <span className="inline-flex items-center rounded-full bg-primary/10 text-primary text-sm font-medium px-3 py-1 border border-primary/20">-{formatPrice(bundleDiscount)}</span>
                  )}
                </div>
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
              <>
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
                        <div className="flex h-full w-full items-center justify-center font-serif italic text-muted-foreground">PULSO</div>
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

              {recommendedProducts.length > 0 && (
                <section className="mt-8 space-y-4 rounded-[12px] border border-border/50 bg-background/80 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">Sugerencias para tu bolsa</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Productos que combinan bien con tu selección actual.
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                      Recomendado
                    </span>
                  </div>

                  {itemsToDiscount > 0 && discountSuggestion ? (
                    <div className="rounded-[10px] border border-primary/30 bg-primary/5 p-4 text-sm text-foreground">
                      <p className="font-semibold">Aprovecha un descuento extra</p>
                      <p className="mt-1 text-muted-foreground">{discountSuggestion}</p>
                    </div>
                  ) : null}

                  <div className="grid gap-3">
                    {recommendedProducts.map((p) => (
                      <div
                        key={p.id}
                        className="flex flex-col gap-3 rounded-[14px] border border-border/50 bg-card p-4 transition hover:border-primary/60 hover:shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[12px] bg-muted">
                            {p.image_url ? <img src={p.image_url} alt={p.title} className="h-full w-full object-cover" /> : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm text-foreground truncate">{p.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{formatPrice(p.is_promo && p.sale_price ? p.sale_price : p.price)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              add({ id: p.id, title: p.title, price: p.is_promo && p.sale_price ? p.sale_price : p.price, image_url: p.image_url });
                              open();
                            }}
                            className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50"
                          >
                            Añadir
                          </button>
                        </div>
                        <p className="text-xs leading-5 text-muted-foreground">
                          Añade más de estos productos para mantener tu bolsa privada completa y aprovechar descuentos.
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
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
                    <option value="pickup">Retiro en persona (Punto acordado)</option>
                  </select>
                </div>

                {deliveryType === "home" && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-6 mt-2">
                    <div>
                      <label className="text-sm uppercase tracking-[0.2em] text-muted-foreground font-medium">
                        Locación (Zona de Caracas)
                      </label>
                      <select
                        required
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="mt-2 w-full rounded-[8px] border border-border bg-input px-5 py-4 text-base focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none appearance-none"
                      >
                        <option value="">Selecciona tu zona...</option>
                        {allLocations.map((loc) => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm uppercase tracking-[0.2em] text-muted-foreground font-medium">
                        Dirección Detallada
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Calle, Número de Edificio/Casa, Punto de referencia"
                        className="mt-2 w-full rounded-[8px] border border-border bg-input px-5 py-4 text-base focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Payment Methods */}
                <div className="pt-4 border-t border-border/50">
                  <label className="text-sm uppercase tracking-[0.2em] text-muted-foreground font-medium mb-3 block">
                    Método de Pago
                  </label>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("pago_movil")}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-[12px] border transition-all ${paymentMethod === "pago_movil" ? "bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(var(--ruby-rgb),0.2)]" : "bg-input border-border text-muted-foreground hover:bg-muted"}`}
                    >
                      <SmartphoneNfc className="h-6 w-6" />
                      <span className="text-xs font-bold uppercase tracking-wider">Pago Móvil</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("zelle")}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-[12px] border transition-all ${paymentMethod === "zelle" ? "bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(var(--ruby-rgb),0.2)]" : "bg-input border-border text-muted-foreground hover:bg-muted"}`}
                    >
                      <DollarSign className="h-6 w-6" />
                      <span className="text-xs font-bold uppercase tracking-wider">Zelle</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("binance")}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-[12px] border transition-all ${paymentMethod === "binance" ? "bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(var(--ruby-rgb),0.2)]" : "bg-input border-border text-muted-foreground hover:bg-muted"}`}
                    >
                      <Bitcoin className="h-6 w-6" />
                      <span className="text-xs font-bold uppercase tracking-wider">Binance</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cash")}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-[12px] border transition-all ${paymentMethod === "cash" ? "bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(var(--ruby-rgb),0.2)]" : "bg-input border-border text-muted-foreground hover:bg-muted"}`}
                    >
                      <Banknote className="h-6 w-6" />
                      <span className="text-xs font-bold uppercase tracking-wider">Efectivo</span>
                    </button>
                  </div>

                  {paymentMethod === "pago_movil" && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <h3 className="flex items-center gap-2 font-serif text-xl text-primary mb-4">
                        <SmartphoneNfc className="h-5 w-5" /> Instrucciones de Pago Móvil
                      </h3>
                      <div className="bg-primary/5 rounded-[8px] p-5 border border-primary/20 space-y-3">
                        <p className="text-sm text-foreground/90">
                          Monto a transferir: <strong className="text-primary text-lg">{formatPrice(grandTotal, "VES")}</strong>
                        </p>
                        <p className="text-sm text-foreground/90">
                          Por favor, realiza el pago a los datos indicados a continuación. Una vez que lo tengas hecho, confirma tu pedido y pasa el comprobante por WhatsApp.
                        </p>
                        <ul className="text-sm space-y-2 mt-4 font-mono bg-background/50 p-4 rounded-[5px] border border-border/40">
                          <li><span className="text-muted-foreground font-sans w-20 inline-block">Banco:</span> {pmData.banco || "-"}</li>
                          <li><span className="text-muted-foreground font-sans w-20 inline-block">Teléfono:</span> {pmData.telefono || "-"}</li>
                          <li><span className="text-muted-foreground font-sans w-20 inline-block">Cédula:</span> {pmData.cedula || "-"}</li>
                          <li><span className="text-muted-foreground font-sans w-20 inline-block">Nombre:</span> {pmData.nombre || "-"}</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "zelle" && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <h3 className="flex items-center gap-2 font-serif text-xl text-primary mb-4">
                        <DollarSign className="h-5 w-5" /> Instrucciones de Zelle
                      </h3>
                      <div className="bg-primary/5 rounded-[8px] p-5 border border-primary/20 space-y-3">
                        <p className="text-sm text-foreground/90">
                          Por favor, transfiere el monto exacto por Zelle a la dirección indicada a continuación. Una vez que lo tengas hecho, confirma tu pedido y pasa el comprobante por WhatsApp.
                        </p>
                        <div className="mt-4 font-mono bg-background/50 p-4 rounded-[5px] border border-border/40 text-center text-base">
                          {zelleEmail || "-"}
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "binance" && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <h3 className="flex items-center gap-2 font-serif text-xl text-primary mb-4">
                        <Bitcoin className="h-5 w-5" /> Instrucciones de Binance Pay
                      </h3>
                      <div className="bg-primary/5 rounded-[8px] p-5 border border-primary/20 space-y-3">
                        <p className="text-sm text-foreground/90">
                          Por favor, envía el monto mediante Binance Pay al dato indicado a continuación. Una vez que lo tengas hecho, confirma tu pedido y pasa el comprobante por WhatsApp.
                        </p>
                        <div className="mt-4 font-mono bg-background/50 p-4 rounded-[5px] border border-border/40 text-center text-base">
                          {binanceId || "-"}
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "cash" && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <h3 className="flex items-center gap-2 font-serif text-xl text-primary mb-4">
                        <Banknote className="h-5 w-5" /> Pago en Efectivo
                      </h3>
                      <div className="bg-primary/5 rounded-[8px] p-5 border border-primary/20 space-y-3">
                        <p className="text-sm text-foreground/90 leading-relaxed">
                          Has seleccionado pagar en efectivo. <br/><br/>
                          Este método solo es aplicable si seleccionaste "Retiro en persona (Punto acordado)".
                          El pago se realizará en el momento exacto de la entrega personal, llevando el monto exacto por favor. <br/><br/>
                          Haz clic en Confirmar para coordinar la cita por WhatsApp.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

              </form>
            )}
          </div>

          {/* Footer with Calculations */}
          <div className="border-t border-border/80 px-6 py-4 space-y-4 bg-card shrink-0">
            {items.length > 0 && (
              <div className="space-y-2 border-b border-border/50 pb-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="text-foreground">{formatPrice(subtotal)}</span>
                </div>
                {bundleDiscount > 0 && (
                  <div className="flex justify-between text-primary font-medium">
                    <span>Oferta por Volumen</span>
                    <span>-{formatPrice(bundleDiscount)}</span>
                  </div>
                )}
                {step === "checkout" && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Envío</span>
                    <span className="text-foreground">{shippingCost === 0 ? "Gratis" : formatPrice(shippingCost)}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-end justify-between gap-4">
              <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-bold">
                Total
              </span>
              <span className="font-serif text-2xl font-bold text-primary leading-none">
                {formatPrice(step === "checkout" ? grandTotal : subtotal)}
              </span>
            </div>

            {step === "cart" ? (
              <button
                onClick={() => setStep("checkout")}
                disabled={items.length === 0}
                className="w-full rounded-[8px] bg-primary py-4 text-sm font-bold uppercase tracking-[0.25em] text-primary-foreground transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continuar con el Pedido
              </button>
            ) : (
              <button
                type="submit"
                form="checkout-form"
                disabled={items.length === 0 || isSubmitting}
                className="w-full rounded-[8px] bg-primary py-4 text-sm font-bold uppercase tracking-[0.25em] text-primary-foreground transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Procesando..." : paymentMethod === "cash" ? "Confirmar y Coordinar" : "Confirmar Pedido"}
              </button>
            )}

            {step === "cart" && items.length > 0 && (
              <button
                onClick={clear}
                className="block w-full text-center text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors py-2"
              >
                Vaciar bolsa
              </button>
            )}

            <p className="text-center text-[11px] uppercase tracking-[0.3em] text-muted-foreground/60">
              Compra 100% segura
            </p>
          </div>
        </div>
      </aside>

        {/* Confirmation Dialog */}
        <Dialog open={confirmModalOpen} onOpenChange={(v) => setConfirmModalOpen(v)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar pedido</DialogTitle>
              <DialogDescription>
                Verifica los detalles antes de abrir WhatsApp. Se mostrará el resumen y el total final.
              </DialogDescription>
            </DialogHeader>

            {pendingOrder && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Pedido: <strong>{pendingOrder.order_id}</strong></p>
                <p className="mt-2 text-sm">Nombre: <strong>{pendingOrder.customer_name}</strong></p>
                <p className="mt-2 text-sm">Método de pago: <strong>{pendingOrder.payment_method}</strong></p>
                <div className="mt-3 text-sm">
                  {pendingOrder.items.map((i: any) => (
                    <div key={i.id} className="flex justify-between py-1">
                      <span>{i.quantity}x {i.title}</span>
                      <span className="font-medium">{formatPrice(i.price * i.quantity)}</span>
                    </div>
                  ))}
                </div>
                {pendingOrder.payment_adjustment < 0 && (
                  <div className="mt-3 text-sm text-primary font-medium">Descuento aplicado: -{formatPrice(Math.abs(pendingOrder.payment_adjustment))}</div>
                )}
                <div className="mt-4 text-lg font-semibold">Total: {formatPrice(pendingOrder.total)}</div>
              </div>
            )}

            <DialogFooter>
              <div className="flex gap-3 w-full justify-end">
                <button onClick={() => { setConfirmModalOpen(false); }} className="rounded-md border px-4 py-2">Cancelar</button>
                <button onClick={confirmAndSend} className="rounded-md bg-primary px-4 py-2 text-primary-foreground">Confirmar y abrir WhatsApp</button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </>
  );
}
