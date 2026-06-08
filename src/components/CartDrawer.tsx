import { useEffect, useState, useMemo, type MouseEvent } from "react";
import { Minus, Plus, X, Trash2, ArrowLeft, SmartphoneNfc, DollarSign, Bitcoin, Banknote, Sparkles } from "lucide-react";
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
  const { items, isOpen, close, setQty, remove, add, open, total: subtotal, clear } = useCart();
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

  const handleAddRecommended = (event: MouseEvent<HTMLButtonElement>, product: Product) => {
    event.preventDefault();
    event.stopPropagation();
    add({
      id: product.id,
      title: product.title,
      price: product.is_promo && product.sale_price ? product.sale_price : product.price,
      image_url: product.image_url,
    });
    open();
  };
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

  const recommendedProducts = useMemo(() => {
    if (totalQty >= 3) return [];
    
    const relatedIds = items.map(i => {
      const p = catalogProducts.find(cp => cp.id === i.id);
      return p ? [p.related_product_id, p.related_product_id_2, p.related_product_id_3, p.related_product_id_4] : [];
    }).flat().filter(Boolean) as string[];

    let candidates = catalogProducts.filter(p => !items.some(i => i.id === p.id));
    if (candidates.length === 0) return [];

    const relatedCandidates = candidates.filter(p => relatedIds.includes(p.id));
    if (relatedCandidates.length > 0) {
      return [relatedCandidates[0]];
    }

    const pseudoRandomIndex = items.reduce((acc, i) => acc + i.id.charCodeAt(0), 0) % candidates.length;
    return [candidates[pseudoRandomIndex]];
  }, [catalogProducts, items, totalQty]);

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
        `Teléfono: ${pendingOrder.customer_phone}\n` +
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
                <div className="mt-8 rounded-[12px] border border-primary/20 bg-primary/5 p-4 relative overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="absolute -top-6 -right-6 p-3 opacity-10 pointer-events-none">
                    <Sparkles className="h-24 w-24 text-primary" />
                  </div>
                  <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-primary mb-1 flex items-center gap-2">
                    <Sparkles className="h-3 w-3" /> Sugerencia Especial
                  </h4>
                  {discountSuggestion ? (
                    <p className="text-[11px] text-foreground font-medium mb-3">{discountSuggestion}</p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground mb-3">Perfecto para complementar tu selección actual.</p>
                  )}
                  <div className="flex items-center gap-3 mt-3 relative z-10 bg-background/60 p-2 rounded-[10px] backdrop-blur-md border border-border/40">
                    <div className="h-16 w-16 rounded-[8px] bg-muted overflow-hidden shrink-0 border border-border/40">
                      {recommendedProducts[0].image_url && <img src={recommendedProducts[0].image_url} alt="Recomendado" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-serif font-medium truncate text-foreground">
                        {recommendedProducts[0].title.toUpperCase().startsWith("[COMBO] ") ? recommendedProducts[0].title.substring(8) : recommendedProducts[0].title}
                      </p>
                      <p className="text-xs font-bold text-primary mt-0.5">{formatPrice(recommendedProducts[0].is_promo && recommendedProducts[0].sale_price ? recommendedProducts[0].sale_price : recommendedProducts[0].price)}</p>
                    </div>
                    <button
                      onClick={(e) => handleAddRecommended(e, recommendedProducts[0])}
                      className="shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
                      aria-label="Añadir sugerencia"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
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
          <DialogContent className="max-w-[95vw] sm:max-w-md rounded-[24px] p-6 sm:p-8 bg-card/95 backdrop-blur-xl border-border/50 shadow-elegant">
            <DialogHeader className="text-center sm:text-left space-y-3 mb-6 border-b border-border/40 pb-6">
              <div className="mx-auto sm:mx-0 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <SmartphoneNfc className="h-6 w-6 text-primary" />
              </div>
              <DialogTitle className="font-serif text-2xl sm:text-3xl">Confirmar tu Pedido</DialogTitle>
              <DialogDescription className="text-base text-muted-foreground/90">
                Verifica los detalles de tu compra. Al confirmar, abriremos WhatsApp para que envíes el comprobante.
              </DialogDescription>
            </DialogHeader>

            {pendingOrder && (
              <div className="space-y-6">
                <div className="bg-background/50 rounded-[12px] p-4 border border-border/40 space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Pedido:</span>
                    <strong className="font-mono text-primary text-base">{pendingOrder.order_id}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">A nombre de:</span>
                    <span className="font-medium">{pendingOrder.customer_name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Método de pago:</span>
                    <span className="font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs uppercase tracking-wider">{pendingOrder.payment_method}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">Resumen de piezas</h4>
                  <div className="max-h-[150px] overflow-y-auto pr-2 space-y-3 scrollbar-thin">
                    {pendingOrder.items.map((i: any) => (
                      <div key={i.id} className="flex justify-between items-center bg-input/30 p-2.5 rounded-[8px] text-sm">
                        <span className="truncate pr-4"><span className="text-muted-foreground mr-2">{i.quantity}x</span> {i.title}</span>
                        <span className="font-medium shrink-0">{formatPrice(i.price * i.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-border/40 space-y-2">
                  {pendingOrder.payment_adjustment < 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-primary font-medium">Descuento aplicado</span>
                      <span className="text-primary font-medium">-{formatPrice(Math.abs(pendingOrder.payment_adjustment))}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-end pt-2">
                    <span className="text-sm uppercase tracking-[0.2em] text-muted-foreground font-bold">Total a pagar</span>
                    <div className="text-right">
                      <div className="font-serif text-3xl font-bold text-gradient-brand leading-none mb-1">
                        {formatPrice(pendingOrder.total)}
                      </div>
                      {pendingOrder.payment_method === "Pago Móvil" && (
                        <div className="text-xs font-bold text-muted-foreground bg-primary/10 px-2 py-0.5 rounded-sm inline-block">
                          ~ {formatPrice(pendingOrder.total, "VES")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
              <button 
                onClick={() => setConfirmModalOpen(false)} 
                className="w-full sm:w-auto flex-1 rounded-[12px] border border-border/80 bg-input/50 px-4 py-3.5 text-sm font-bold uppercase tracking-[0.2em] text-foreground hover:bg-muted transition-colors"
              >
                Volver
              </button>
              <button 
                onClick={confirmAndSend} 
                className="w-full sm:w-auto flex-[2] rounded-[12px] bg-primary px-4 py-3.5 text-sm font-bold uppercase tracking-[0.2em] text-primary-foreground shadow-[0_0_20px_rgba(var(--ruby-rgb),0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(var(--ruby-rgb),0.5)]"
              >
                Enviar por WhatsApp
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </>
  );
}
