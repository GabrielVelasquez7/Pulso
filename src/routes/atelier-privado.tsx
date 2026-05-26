import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, LogOut, Upload, MessageSquare, Check, X as XIcon, Clock } from "lucide-react";

export const Route = createFileRoute("/atelier-privado")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Atelier · Noir & Or" }] }),
});

type Product = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price: number;
  sale_price: number | null;
  is_promo: boolean;
  stock: number;
};

type FormState = {
  id?: string;
  title: string;
  description: string;
  image_url: string;
  price: string;
  sale_price: string;
  is_promo: boolean;
  stock: string;
};

const empty: FormState = {
  title: "",
  description: "",
  image_url: "",
  price: "",
  sale_price: "",
  is_promo: false,
  stock: "0",
};

type OrderItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image_url?: string | null;
};

type Order = {
  id: string;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  delivery_type: string;
  delivery_address: string | null;
  payment_method: string;
  subtotal: number;
  shipping_cost: number;
  payment_adjustment: number;
  total: number;
  items: any; // will be parsed as OrderItem[]
  status: string;
  created_at: string;
};

export function AdminPage() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState<FormState>(empty);
  const [waNumber, setWaNumber] = useState("");
  const [activeTab, setActiveTab] = useState<"products" | "orders">("products");
  const [isUploading, setIsUploading] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts((data ?? []) as Product[]);
  }, []);

  const loadOrders = useCallback(async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    setOrders((data ?? []) as Order[]);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setAuthChecked(true);
          navigate({ to: "/login" });
          return;
        }
        setUserId(user.id);

        // Verify admin role in user_roles table
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (roleData?.role === "admin") {
          setIsAdmin(true);
          await load();
          await loadOrders();
        } else {
          setIsAdmin(false);
        }
        
        const { data: ws } = await supabase.from("site_settings").select("value").eq("key", "whatsapp_number").maybeSingle();
        if (ws?.value) setWaNumber(ws.value);
      } catch (err) {
        console.error(err);
      } finally {
        setAuthChecked(true);
      }
    };
    init();
  }, [load, loadOrders, navigate]);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: form.title,
      description: form.description || null,
      image_url: form.image_url || null,
      price: Number(form.price) || 0,
      sale_price: form.sale_price ? Number(form.sale_price) : null,
      is_promo: form.is_promo,
      stock: Number(form.stock) || 0,
    };
    
    if (form.id) {
      const { error } = await supabase.from("products").update(payload).eq("id", form.id);
      if (error) return toast.error(error.message);
      toast.success("Producto actualizado");
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Producto creado");
    }
    setForm(empty);
    load();
  };

  const edit = (p: Product) =>
    setForm({
      id: p.id,
      title: p.title,
      description: p.description ?? "",
      image_url: p.image_url ?? "",
      price: String(p.price),
      sale_price: p.sale_price != null ? String(p.sale_price) : "",
      is_promo: p.is_promo,
      stock: String(p.stock),
    });

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este producto?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminado");
    load();
  };

  const saveWhatsApp = async () => {
    const { error } = await supabase.from("site_settings").update({ value: waNumber }).eq("key", "whatsapp_number");
    if (error) return toast.error(error.message);
    toast.success("Número actualizado");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;

    try {
      const { data, error } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        toast.error(`Error al subir imagen: ${error.message}`);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(data.path);

      setForm((prev) => ({ ...prev, image_url: publicUrl }));
      toast.success("Imagen subida con éxito");
    } catch (err) {
      console.error(err);
      toast.error("Error inesperado al subir la imagen");
    } finally {
      setIsUploading(false);
    }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Pedido actualizado a: ${status}`);
    loadOrders();
  };

  const removeOrder = async (id: string) => {
    if (!confirm("¿Eliminar este registro de pedido de forma permanente?")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Pedido eliminado");
    loadOrders();
  };

  if (!authChecked) {
    return <div className="p-20 text-center text-muted-foreground">Cargando…</div>;
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-xl px-5 py-20 text-center">
        <h1 className="font-serif text-3xl">Acceso restringido</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Tu cuenta no tiene rol de administrador. Pídele al propietario que asigne el rol{" "}
          <code className="text-primary font-bold">admin</code> a tu user_id:
        </p>
        <code className="mt-4 inline-block rounded-[5px] border border-border bg-card px-4 py-2 text-xs text-primary font-mono select-all">
          {userId}
        </code>
        <p className="mt-4 text-xs text-muted-foreground">
          (Inserta una fila en la tabla <code>user_roles</code> con role = 'admin'.)
        </p>
        <button onClick={logout} className="mt-8 text-xs uppercase tracking-[0.25em] text-primary hover:underline">
          Cerrar sesión
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-5 sm:px-8 py-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-primary font-medium">Panel</p>
          <h1 className="mt-2 font-serif text-4xl">Administración</h1>
        </div>
        <button onClick={logout} className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-primary transition-colors">
          <LogOut className="h-4 w-4" /> Salir
        </button>
      </div>

      {/* WhatsApp settings */}
      <section className="mb-10 rounded-[5px] border border-border/60 bg-card/70 p-6">
        <h2 className="font-serif text-xl mb-4">Número de WhatsApp para recibir pedidos</h2>
        <div className="flex gap-3">
          <input
            value={waNumber}
            onChange={(e) => setWaNumber(e.target.value)}
            placeholder="5215555555555 (con código de país sin +)"
            className="flex-1 rounded-[5px] border border-border bg-input/50 px-4 py-3 text-sm focus:border-primary focus:outline-none"
          />
          <button onClick={saveWhatsApp} className="rounded-[5px] bg-primary px-6 text-xs uppercase tracking-[0.25em] text-primary-foreground hover:glow-ruby transition-all">
            Guardar
          </button>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-border/40 mb-8">
        <button
          onClick={() => setActiveTab("products")}
          className={`pb-3 text-xs uppercase tracking-[0.25em] font-medium border-b-2 transition-all ${
            activeTab === "products"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Catálogo de Productos
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-3 text-xs uppercase tracking-[0.25em] font-medium border-b-2 transition-all ${
            activeTab === "orders"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Historial de Pedidos ({orders.length})
        </button>
      </div>

      {activeTab === "products" ? (
        /* Tab 1: Products Catalogo */
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          {/* Form */}
          <section className="rounded-[5px] border border-border/60 bg-card/70 p-6 h-fit sticky top-20">
            <h2 className="font-serif text-2xl mb-5">{form.id ? "Editar producto" : "Nuevo producto"}</h2>
            <form onSubmit={submit} className="space-y-4">
              <Field label="Título" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
              <Field label="Descripción" value={form.description} onChange={(v) => setForm({ ...form, description: v })} textarea />
              
              {/* Local Image upload field */}
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Imagen del Producto</label>
                <div className="mt-2 space-y-3">
                  {form.image_url && (
                    <div className="h-28 w-28 rounded-[5px] overflow-hidden bg-muted border border-border/40">
                      <img src={form.image_url} alt="Vista previa" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.image_url}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                      placeholder="https://... o selecciona archivo"
                      className="flex-1 rounded-[5px] border border-border bg-input/50 px-4 py-3 text-sm focus:border-primary focus:outline-none"
                    />
                    <label className="cursor-pointer inline-flex items-center justify-center rounded-[5px] border border-border bg-background/50 px-4 text-xs uppercase tracking-[0.15em] text-foreground hover:border-primary transition-all hover:bg-muted select-none">
                      {isUploading ? "..." : <Upload className="h-4 w-4" />}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploading}
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Precio" type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} required />
                <Field label="Stock" type="number" value={form.stock} onChange={(v) => setForm({ ...form, stock: v })} />
              </div>
              <Field label="Precio de promoción (opcional)" type="number" value={form.sale_price} onChange={(v) => setForm({ ...form, sale_price: v })} />
              <label className="flex items-center gap-3 text-sm cursor-pointer select-none">
                <input type="checkbox" checked={form.is_promo} onChange={(e) => setForm({ ...form, is_promo: e.target.checked })} className="accent-primary h-4 w-4" />
                Activar oferta (mostrar precio tachado)
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 inline-flex items-center justify-center gap-2 rounded-[5px] bg-primary py-3 text-xs uppercase tracking-[0.25em] text-primary-foreground hover:glow-ruby transition-all">
                  <Plus className="h-4 w-4" /> {form.id ? "Guardar" : "Crear"}
                </button>
                {form.id && (
                  <button type="button" onClick={() => setForm(empty)} className="rounded-[5px] border border-border px-5 text-xs uppercase tracking-[0.25em] hover:border-primary transition-all">
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* List */}
          <section>
            <h2 className="font-serif text-2xl mb-5">Catálogo ({products.length})</h2>
            <ul className="space-y-3">
              {products.map((p) => (
                <li key={p.id} className="flex items-center gap-4 rounded-[5px] border border-border bg-card p-4 shadow-sm">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[5px] bg-muted/80">
                    {p.image_url && <img src={p.image_url} alt={p.title} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-xl truncate text-foreground">{p.title}</h3>
                    <p className="text-sm text-foreground/80 mt-1 font-medium">
                      Stock: {p.stock} ·{" "}
                      {p.is_promo && p.sale_price != null ? (
                        <span><span className="text-primary">${p.sale_price}</span> <span className="line-through text-muted-foreground text-xs ml-1">${p.price}</span></span>
                      ) : (
                        <span className="text-primary">${p.price}</span>
                      )}
                    </p>
                  </div>
                  <button onClick={() => edit(p)} className="p-3 text-muted-foreground hover:text-primary transition-colors bg-input/20 rounded-[5px]" aria-label="Editar"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(p.id)} className="p-3 text-muted-foreground hover:text-destructive transition-colors bg-input/20 rounded-[5px]" aria-label="Eliminar"><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : (
        /* Tab 2: Orders History */
        <section className="space-y-6">
          <h2 className="font-serif text-2xl mb-5">Historial de Pedidos registrados ({orders.length})</h2>
          {orders.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No hay pedidos registrados en el sistema.</p>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => {
                const orderItems = (order.items || []) as OrderItem[];
                return (
                  <div key={order.id} className="rounded-[5px] border border-border/80 bg-card p-6 shadow-md space-y-4">
                    {/* Header info */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-serif text-xl text-primary font-bold">{order.order_id}</h3>
                          <span className={`px-2.5 py-0.5 rounded-[5px] text-[10px] uppercase tracking-wider font-semibold border ${
                            order.status === "completed"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : order.status === "cancelled"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}>
                            {order.status === "completed"
                              ? "Completado"
                              : order.status === "cancelled"
                              ? "Cancelado"
                              : "Pendiente"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Realizado el: {new Date(order.created_at).toLocaleString("es-MX")}
                        </p>
                      </div>

                      {/* Status and Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateOrderStatus(order.id, "pending")}
                          title="Marcar como Pendiente"
                          className={`p-2 rounded-[5px] transition-colors ${
                            order.status === "pending"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-input/20 text-muted-foreground hover:text-amber-400"
                          }`}
                        >
                          <Clock className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, "completed")}
                          title="Marcar como Completado"
                          className={`p-2 rounded-[5px] transition-colors ${
                            order.status === "completed"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-input/20 text-muted-foreground hover:text-emerald-400"
                          }`}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, "cancelled")}
                          title="Cancelar Pedido"
                          className={`p-2 rounded-[5px] transition-colors ${
                            order.status === "cancelled"
                              ? "bg-rose-500/20 text-rose-400"
                              : "bg-input/20 text-muted-foreground hover:text-rose-400"
                          }`}
                        >
                          <XIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeOrder(order.id)}
                          title="Eliminar registro"
                          className="p-2 rounded-[5px] bg-input/20 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-4"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Order Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-6">
                      {/* Customer info & Items list */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Datos del Cliente</h4>
                          <div className="mt-2 text-sm space-y-1">
                            <p><strong>Cliente:</strong> {order.customer_name}</p>
                            <p className="flex items-center gap-2">
                              <strong>WhatsApp:</strong> {order.customer_phone}
                              <a
                                href={`https://wa.me/${order.customer_phone.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                <MessageSquare className="h-3 w-3" /> Chatear
                              </a>
                            </p>
                            <p><strong>Entrega:</strong> {order.delivery_type}</p>
                            <p><strong>Dirección:</strong> {order.delivery_address}</p>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Productos</h4>
                          <ul className="space-y-2">
                            {orderItems.map((item, idx) => (
                              <li key={idx} className="flex items-center gap-3 text-sm bg-background/30 p-2 rounded-[5px] border border-border/40">
                                <div className="h-10 w-10 shrink-0 rounded-[5px] bg-muted overflow-hidden">
                                  {item.image_url && <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-serif text-base truncate">{item.title}</p>
                                  <p className="text-xs text-muted-foreground">{item.quantity} unidad(es) x ${item.price}</p>
                                </div>
                                <span className="font-semibold text-primary">${(item.price * item.quantity).toFixed(2)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Pricing Breakdown Card */}
                      <div className="bg-background/40 p-4 rounded-[5px] border border-border/40 h-fit space-y-3">
                        <h4 className="text-xs uppercase tracking-[0.2em] text-muted-foreground border-b border-border/40 pb-2">Resumen de Cuenta</h4>
                        <div className="text-sm space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>${order.subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Envío</span>
                            <span>{order.shipping_cost === 0 ? "Gratis" : `$${order.shipping_cost.toFixed(2)}`}</span>
                          </div>
                          {order.payment_adjustment !== 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Ajuste ({order.payment_method})</span>
                              <span className={order.payment_adjustment < 0 ? "text-emerald-400" : ""}>
                                {order.payment_adjustment < 0 ? "-" : "+"}${Math.abs(order.payment_adjustment).toFixed(2)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between border-t border-border/40 pt-2 font-serif text-lg font-bold text-primary">
                            <span>Total</span>
                            <span>${order.total.toFixed(2)}</span>
                          </div>
                          <div className="pt-2 text-xs text-muted-foreground">
                            <strong>Método elegido:</strong> {order.payment_method}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function Field({
  label, value, onChange, type = "text", required, textarea, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; textarea?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder={placeholder}
          className="mt-2 w-full rounded-[5px] border border-border bg-input/50 px-4 py-3 text-sm focus:border-primary focus:outline-none"
        />
      ) : (
        <input
          type={type}
          step={type === "number" ? "0.01" : undefined}
          value={value}
          required={required}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 w-full rounded-[5px] border border-border bg-input/50 px-4 py-3 text-sm focus:border-primary focus:outline-none"
        />
      )}
    </div>
  );
}
