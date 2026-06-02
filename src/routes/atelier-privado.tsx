import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, LogOut, Upload, MessageSquare, Check, X as XIcon, Clock, Package, ShoppingBag, Settings, Menu, Gift } from "lucide-react";

export const Route = createFileRoute("/atelier-privado")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Atelier · PULSO" }] }),
});

type Product = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  image_2_url?: string | null;
  image_3_url?: string | null;
  features?: string | null;
  usages?: string | null;
  price: number;
  sale_price: number | null;
  is_promo: boolean;
  stock: number;
  related_product_id?: string | null;
  related_product_id_2?: string | null;
  related_product_id_3?: string | null;
  related_product_id_4?: string | null;
};

type FormState = {
  id?: string;
  title: string;
  description: string;
  image_url: string;
  image_2_url: string;
  image_3_url: string;
  features: string;
  usages: string;
  price: string;
  sale_price: string;
  is_promo: boolean;
  stock: string;
  related_product_id: string;
  related_product_id_2: string;
  related_product_id_3: string;
  related_product_id_4: string;
};

const empty: FormState = {
  title: "",
  description: "",
  image_url: "",
  image_2_url: "",
  image_3_url: "",
  features: "",
  usages: "",
  price: "",
  sale_price: "",
  is_promo: false,
  stock: "0",
  related_product_id: "",
  related_product_id_2: "",
  related_product_id_3: "",
  related_product_id_4: "",
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
  items: any;
  status: string;
  created_at: string;
};

function formatPrice(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}

export function AdminPage() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState<FormState>(empty);
  
  // Settings States
  const [waNumber, setWaNumber] = useState("");
  const [pmBanco, setPmBanco] = useState("");
  const [pmTelefono, setPmTelefono] = useState("");
  const [pmCedula, setPmCedula] = useState("");
  const [pmNombre, setPmNombre] = useState("");
  const [zelleEmail, setZelleEmail] = useState("");
  const [binanceId, setBinanceId] = useState("");
  const [discount2, setDiscount2] = useState("0");
  const [discount3, setDiscount3] = useState("0");

  const [activeTab, setActiveTab] = useState<"products" | "orders" | "offers" | "settings">("products");
  const [isUploading, setIsUploading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

        const { data: roleData } = await supabase
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
        
        // Load Settings
        const { data: settingsData } = await supabase.from("site_settings").select("*");
        if (settingsData) {
          settingsData.forEach(s => {
            if (s.key === "whatsapp_number") setWaNumber(s.value);
            if (s.key === "pago_movil_banco") setPmBanco(s.value);
            if (s.key === "pago_movil_telefono") setPmTelefono(s.value);
            if (s.key === "pago_movil_cedula") setPmCedula(s.value);
            if (s.key === "pago_movil_nombre") setPmNombre(s.value);
            if (s.key === "zelle_email") setZelleEmail(s.value);
            if (s.key === "binance_id") setBinanceId(s.value);
            if (s.key === "discount_2_items") setDiscount2(s.value || "0");
            if (s.key === "discount_3_items") setDiscount3(s.value || "0");
          });
        }
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
      image_2_url: form.image_2_url || null,
      image_3_url: form.image_3_url || null,
      features: form.features || null,
      usages: form.usages || null,
      price: Number(form.price) || 0,
      sale_price: form.sale_price ? Number(form.sale_price) : null,
      is_promo: form.is_promo,
      stock: Number(form.stock) || 0,
      related_product_id: form.related_product_id || null,
      related_product_id_2: form.related_product_id_2 || null,
      related_product_id_3: form.related_product_id_3 || null,
      related_product_id_4: form.related_product_id_4 || null,
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

  const edit = (p: Product) => {
    setForm({
      id: p.id,
      title: p.title,
      description: p.description ?? "",
      image_url: p.image_url ?? "",
      image_2_url: p.image_2_url ?? "",
      image_3_url: p.image_3_url ?? "",
      features: p.features ?? "",
      usages: p.usages ?? "",
      price: String(p.price),
      sale_price: p.sale_price != null ? String(p.sale_price) : "",
      is_promo: p.is_promo,
      stock: String(p.stock),
      related_product_id: p.related_product_id ?? "",
      related_product_id_2: p.related_product_id_2 ?? "",
      related_product_id_3: p.related_product_id_3 ?? "",
      related_product_id_4: p.related_product_id_4 ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este producto permanentemente?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Producto eliminado");
    load();
  };

  const saveSettings = async () => {
    const keys = [
      { key: "whatsapp_number", value: waNumber },
      { key: "pago_movil_banco", value: pmBanco },
      { key: "pago_movil_telefono", value: pmTelefono },
      { key: "pago_movil_cedula", value: pmCedula },
      { key: "pago_movil_nombre", value: pmNombre },
      { key: "zelle_email", value: zelleEmail },
      { key: "binance_id", value: binanceId },
      { key: "discount_2_items", value: discount2 },
      { key: "discount_3_items", value: discount3 },
    ];
    
    try {
      for (const item of keys) {
        // Upsert logic using count to check if exists, or simply upsert if primary key is set.
        // Assuming 'key' is unique constraint in site_settings.
        const { error } = await supabase.from("site_settings").upsert(item, { onConflict: "key" });
        if (error) throw error;
      }
      toast.success("Configuración guardada correctamente");
    } catch (err: any) {
      toast.error(`Error guardando configuración: ${err.message}`);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "image_url" | "image_2_url" | "image_3_url") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;

    try {
      const { data, error } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });

      if (error) {
        toast.error(`Error al subir imagen: ${error.message}`);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(data.path);
      setForm((prev) => ({ ...prev, [field]: publicUrl }));
      toast.success("Imagen subida con éxito");
    } catch (err) {
      console.error(err);
      toast.error("Error inesperado al subir la imagen");
    } finally {
      setIsUploading(false);
    }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    // If marking as completed, first get the order to decrement stock
    if (status === "completed") {
      const order = orders.find(o => o.id === id);
      if (order && order.status !== "completed") {
        const orderItems = (order.items || []) as OrderItem[];
        for (const item of orderItems) {
          // Decrement stock for each product in the order
          const { error: stockError } = await supabase.rpc('decrement_stock', {
            product_id: item.id,
            qty: item.quantity,
          }).maybeSingle();
          // Fallback: if RPC doesn't exist, do a manual update
          if (stockError) {
            const product = products.find(p => p.id === item.id);
            if (product) {
              const newStock = Math.max(0, product.stock - item.quantity);
              await supabase.from("products").update({ stock: newStock }).eq("id", item.id);
            }
          }
        }
        // Reload products to reflect updated stock
        load();
      }
    }

    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Pedido marcado como: ${status === "completed" ? "Completado" : status === "cancelled" ? "Cancelado" : "Pendiente"}`);
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
    return <div className="flex h-screen items-center justify-center text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  }

  if (!isAdmin) {
    return (
      <main className="flex h-screen items-center justify-center px-5">
        <div className="max-w-xl text-center rounded-[8px] bg-card p-10 border border-border/80 shadow-elegant">
          <h1 className="font-serif text-4xl text-primary">Acceso restringido</h1>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            Tu cuenta no tiene privilegios de administrador. Solicita al propietario que asigne el rol <code className="text-primary font-bold">admin</code> a tu ID de usuario:
          </p>
          <code className="mt-6 block rounded-[8px] border border-border bg-input/50 px-5 py-4 text-sm text-primary font-mono select-all">
            {userId}
          </code>
          <button onClick={logout} className="mt-10 inline-flex items-center gap-2 rounded-[5px] bg-muted px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-foreground hover:bg-border transition-colors">
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
        </div>
      </main>
    );
  }

  const pendingOrdersCount = orders.filter(o => o.status === "pending").length;

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-5 border-b border-border/80 bg-card/50 backdrop-blur sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <span className="font-serif text-2xl text-primary font-bold tracking-widest">PULSO</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-foreground focus:outline-none">
          {isMobileMenuOpen ? <XIcon className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-20 w-72 transform border-r border-border/80 bg-card/80 backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col">
          <div className="hidden lg:flex items-center gap-2 p-8 pb-4">
            <span className="font-serif text-3xl font-bold tracking-widest text-primary">PULSO</span>
          </div>
          <p className="hidden lg:block px-8 text-[10px] uppercase tracking-[0.4em] text-muted-foreground font-bold mb-8">Atelier Admin</p>

          <nav className="flex-1 space-y-2 px-4 py-8 lg:py-0">
            <SidebarItem 
              icon={<Package className="h-5 w-5" />} 
              label="Catálogo" 
              active={activeTab === "products"} 
              onClick={() => { setActiveTab("products"); setIsMobileMenuOpen(false); }} 
            />
            <SidebarItem 
              icon={<ShoppingBag className="h-5 w-5" />} 
              label="Pedidos" 
              badge={pendingOrdersCount > 0 ? pendingOrdersCount : undefined}
              active={activeTab === "orders"} 
              onClick={() => { setActiveTab("orders"); setIsMobileMenuOpen(false); }} 
            />
            <SidebarItem 
              icon={<Gift className="h-5 w-5" />} 
              label="Ofertas" 
              active={activeTab === "offers"} 
              onClick={() => { setActiveTab("offers"); setIsMobileMenuOpen(false); }} 
            />
            <SidebarItem 
              icon={<Settings className="h-5 w-5" />} 
              label="Ajustes" 
              active={activeTab === "settings"} 
              onClick={() => { setActiveTab("settings"); setIsMobileMenuOpen(false); }} 
            />
          </nav>

          <div className="p-4 border-t border-border/40">
            <button onClick={logout} className="flex w-full items-center gap-3 rounded-[8px] px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors focus:outline-none focus:ring-2 focus:ring-destructive/40">
              <LogOut className="h-5 w-5" /> Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-10 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex-1 p-5 sm:p-8 lg:p-12 overflow-y-auto w-full">
        <div className="max-w-6xl mx-auto">
          {activeTab === "products" && (
            <div className="animate-in fade-in duration-500">
              {/* Form Section - Full Width */}
              <header className="mb-10">
                <h1 className="font-serif text-4xl sm:text-5xl text-foreground">{form.id ? "Editar Pieza" : "Nueva Pieza"}</h1>
                <p className="mt-2 text-muted-foreground">Completa los datos del producto para añadirlo al catálogo.</p>
              </header>

              <section className="rounded-[8px] border border-border/80 bg-card p-6 sm:p-8 shadow-sm max-w-2xl">
                <form onSubmit={submit} className="space-y-5">
                  <Field label="Título" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
                  <Field label="Descripción" value={form.description} onChange={(v) => setForm({ ...form, description: v })} textarea />
                  <Field label="Características (Pros)" placeholder="Separa cada punto por una nueva línea" value={form.features} onChange={(v) => setForm({ ...form, features: v })} textarea />
                  <Field label="Usos Recomendados" placeholder="Ej: Hogar, Viaje, Spa (separados por coma)" value={form.usages} onChange={(v) => setForm({ ...form, usages: v })} />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">Miniatura (Img 1)</label>
                      <div className="mt-3 space-y-4">
                        {form.image_url && (
                          <div className="h-32 w-full rounded-[8px] overflow-hidden bg-muted border border-border/40">
                            <img src={form.image_url} alt="Vista previa 1" className="h-full w-full object-cover" />
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="URL img..." className="w-0 flex-1 rounded-[8px] border border-border bg-input px-3 py-2 text-xs focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none" />
                          <label className="cursor-pointer inline-flex items-center justify-center rounded-[8px] border border-border bg-background px-3 text-foreground hover:border-primary hover:bg-muted transition-all">
                            {isUploading ? <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Upload className="h-4 w-4" />}
                            <input type="file" accept="image/*" disabled={isUploading} onChange={(e) => handleImageUpload(e, "image_url")} className="sr-only" />
                          </label>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">Imagen 2 (Opc)</label>
                      <div className="mt-3 space-y-4">
                        {form.image_2_url && (
                          <div className="h-32 w-full rounded-[8px] overflow-hidden bg-muted border border-border/40">
                            <img src={form.image_2_url} alt="Vista previa 2" className="h-full w-full object-cover" />
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input type="url" value={form.image_2_url} onChange={(e) => setForm({ ...form, image_2_url: e.target.value })} placeholder="URL img..." className="w-0 flex-1 rounded-[8px] border border-border bg-input px-3 py-2 text-xs focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none" />
                          <label className="cursor-pointer inline-flex items-center justify-center rounded-[8px] border border-border bg-background px-3 text-foreground hover:border-primary hover:bg-muted transition-all">
                            {isUploading ? <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Upload className="h-4 w-4" />}
                            <input type="file" accept="image/*" disabled={isUploading} onChange={(e) => handleImageUpload(e, "image_2_url")} className="sr-only" />
                          </label>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">Imagen 3 (Opc)</label>
                      <div className="mt-3 space-y-4">
                        {form.image_3_url && (
                          <div className="h-32 w-full rounded-[8px] overflow-hidden bg-muted border border-border/40">
                            <img src={form.image_3_url} alt="Vista previa 3" className="h-full w-full object-cover" />
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input type="url" value={form.image_3_url} onChange={(e) => setForm({ ...form, image_3_url: e.target.value })} placeholder="URL img..." className="w-0 flex-1 rounded-[8px] border border-border bg-input px-3 py-2 text-xs focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none" />
                          <label className="cursor-pointer inline-flex items-center justify-center rounded-[8px] border border-border bg-background px-3 text-foreground hover:border-primary hover:bg-muted transition-all">
                            {isUploading ? <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Upload className="h-4 w-4" />}
                            <input type="file" accept="image/*" disabled={isUploading} onChange={(e) => handleImageUpload(e, "image_3_url")} className="sr-only" />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Precio" type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} required />
                    <Field label="Stock" type="number" value={form.stock} onChange={(v) => setForm({ ...form, stock: v })} />
                    <Field label="Precio Promo" type="number" value={form.sale_price} onChange={(v) => setForm({ ...form, sale_price: v })} placeholder="Opcional" />
                  </div>
                  
                  <label className="flex items-center gap-4 rounded-[8px] border border-border/60 bg-background/50 p-4 cursor-pointer hover:border-primary/50 transition-colors">
                    <input type="checkbox" checked={form.is_promo} onChange={(e) => setForm({ ...form, is_promo: e.target.checked })} className="h-5 w-5 rounded border-border accent-primary bg-input" />
                    <span className="text-sm font-medium">Activar etiqueta de promoción</span>
                  </label>

                  <div className="pt-4 border-t border-border/40">
                    <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">Acompañantes Ideales (Cross-Selling)</label>
                    <p className="text-sm text-muted-foreground mb-3">Selecciona hasta 4 productos para mostrar como combinación perfecta en la página de esta pieza.</p>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <select
                        value={form.related_product_id}
                        onChange={(e) => setForm({ ...form, related_product_id: e.target.value })}
                        className="w-full rounded-[8px] border border-border bg-input px-4 py-3 text-base focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none appearance-none"
                      >
                        <option value="">Acompañante 1 (Ninguno)</option>
                        {products.filter(p => p.id !== form.id).map(p => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>

                      <select
                        value={form.related_product_id_2}
                        onChange={(e) => setForm({ ...form, related_product_id_2: e.target.value })}
                        className="w-full rounded-[8px] border border-border bg-input px-4 py-3 text-base focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none appearance-none"
                      >
                        <option value="">Acompañante 2 (Ninguno)</option>
                        {products.filter(p => p.id !== form.id).map(p => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>

                      <select
                        value={form.related_product_id_3}
                        onChange={(e) => setForm({ ...form, related_product_id_3: e.target.value })}
                        className="w-full rounded-[8px] border border-border bg-input px-4 py-3 text-base focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none appearance-none"
                      >
                        <option value="">Acompañante 3 (Ninguno)</option>
                        {products.filter(p => p.id !== form.id).map(p => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>

                      <select
                        value={form.related_product_id_4}
                        onChange={(e) => setForm({ ...form, related_product_id_4: e.target.value })}
                        className="w-full rounded-[8px] border border-border bg-input px-4 py-3 text-base focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none appearance-none"
                      >
                        <option value="">Acompañante 4 (Ninguno)</option>
                        {products.filter(p => p.id !== form.id).map(p => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-border/40">
                    <button type="submit" className="flex-1 inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-primary text-sm uppercase tracking-[0.2em] font-bold text-primary-foreground hover:glow-ruby transition-all focus:outline-none focus:ring-4 focus:ring-primary/40">
                      <Plus className="h-4 w-4" /> {form.id ? "Guardar" : "Crear Pieza"}
                    </button>
                    {form.id && (
                      <button type="button" onClick={() => setForm(empty)} className="inline-flex h-12 items-center justify-center rounded-[8px] border border-border bg-background px-6 text-sm uppercase tracking-[0.2em] font-bold hover:bg-muted transition-all focus:outline-none">
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </section>

              {/* Catalog Section - Below Form */}
              <div className="mt-16 border-t border-border/40 pt-12">
                <header className="mb-8 flex items-end justify-between">
                  <div>
                    <h2 className="font-serif text-4xl sm:text-5xl text-foreground">Catálogo</h2>
                    <p className="mt-2 text-muted-foreground">Todos los productos disponibles en la tienda.</p>
                  </div>
                  <span className="text-sm font-sans bg-muted text-muted-foreground px-4 py-1.5 rounded-full font-medium">{products.length} piezas</span>
                </header>
                
                {products.length === 0 ? (
                  <div className="p-10 text-center rounded-[8px] border border-border/40 bg-card/30">
                    <p className="text-muted-foreground">No hay productos en el catálogo.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                    {products.map((p) => (
                      <article key={p.id} className="group relative flex flex-col overflow-hidden rounded-[8px] border border-border/60 bg-card shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-300">
                        {/* Image */}
                        <div className="relative aspect-square overflow-hidden bg-muted border-b border-border/40">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center font-serif italic text-muted-foreground/50 text-lg">PULSO</div>
                          )}
                          {/* Promo Badge */}
                          {p.is_promo && (
                            <span className="absolute top-2 right-2 inline-flex items-center rounded-full bg-primary/20 backdrop-blur-sm px-2 py-0.5 text-[10px] uppercase tracking-widest text-primary border border-primary/20 font-bold">
                              Promo
                            </span>
                          )}
                          {/* Hover Actions Overlay */}
                          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button onClick={() => edit(p)} className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform" aria-label="Editar">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => remove(p.id)} className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-destructive text-destructive-foreground shadow-lg hover:scale-110 transition-transform" aria-label="Eliminar">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        {/* Info */}
                        <div className="p-3 flex flex-col gap-1.5">
                          <h3 className="font-serif text-sm font-medium leading-tight truncate text-foreground" title={p.title}>{p.title}</h3>
                          <div className="flex items-center gap-2">
                            {p.is_promo && p.sale_price != null ? (
                              <>
                                <span className="text-sm font-bold text-primary">{formatPrice(p.sale_price)}</span>
                                <span className="text-[10px] line-through text-muted-foreground">{formatPrice(p.price)}</span>
                              </>
                            ) : (
                              <span className="text-sm font-bold text-foreground">{formatPrice(p.price)}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              p.stock <= 0 ? 'bg-rose-400' : p.stock <= 5 ? 'bg-amber-400' : 'bg-emerald-400'
                            }`} />
                            {p.stock <= 0 ? 'Agotado' : `Stock: ${p.stock}`}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="animate-in fade-in duration-500">
              <header className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <h1 className="font-serif text-4xl sm:text-5xl text-foreground">Pedidos</h1>
                  <p className="mt-2 text-muted-foreground">Historial y gestión de órdenes recientes.</p>
                </div>
                <div className="inline-flex items-center bg-card rounded-[8px] border border-border/80 px-4 py-2">
                  <span className="text-sm font-medium">Total: {orders.length}</span>
                </div>
              </header>

              {orders.length === 0 ? (
                <div className="p-20 text-center rounded-[8px] border border-border/40 bg-card/30">
                  <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-lg text-muted-foreground">No hay pedidos registrados.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {orders.map((order) => {
                    const orderItems = (order.items || []) as OrderItem[];
                    return (
                      <div key={order.id} className="rounded-[8px] border border-border/80 bg-card p-6 shadow-md flex flex-col gap-6 lg:flex-row">
                        {/* Order Meta & Status */}
                        <div className="flex-1 min-w-[250px] space-y-5 border-b lg:border-b-0 lg:border-r border-border/40 pb-6 lg:pb-0 lg:pr-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-serif text-2xl font-bold text-primary">{order.order_id}</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {new Date(order.created_at).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                              order.status === "completed" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : order.status === "cancelled" ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                              : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            }`}>
                              {order.status === "completed" ? "Completado" : order.status === "cancelled" ? "Cancelado" : "Pendiente"}
                            </span>
                          </div>

                          <div className="space-y-3 bg-background/50 rounded-[5px] p-4 border border-border/40">
                            <h4 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">Cliente</h4>
                            <p className="text-sm font-medium">{order.customer_name}</p>
                            <p className="text-sm flex items-center justify-between">
                              <span>{order.customer_phone}</span>
                              <a href={`https://wa.me/${order.customer_phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary bg-primary/10 px-2 py-1 rounded-[5px] hover:bg-primary/20 transition-colors">
                                <MessageSquare className="h-3 w-3" /> Chat
                              </a>
                            </p>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button onClick={() => updateOrderStatus(order.id, "pending")} title="Pendiente" className={`flex-1 inline-flex items-center justify-center h-10 rounded-[5px] transition-colors border ${order.status === "pending" ? "bg-amber-500/20 text-amber-500 border-amber-500/30" : "bg-input text-muted-foreground border-border hover:border-amber-500/50"}`}>
                              <Clock className="h-4 w-4" />
                            </button>
                            <button onClick={() => updateOrderStatus(order.id, "completed")} title="Completado" className={`flex-1 inline-flex items-center justify-center h-10 rounded-[5px] transition-colors border ${order.status === "completed" ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" : "bg-input text-muted-foreground border-border hover:border-emerald-500/50"}`}>
                              <Check className="h-4 w-4" />
                            </button>
                            <button onClick={() => updateOrderStatus(order.id, "cancelled")} title="Cancelar" className={`flex-1 inline-flex items-center justify-center h-10 rounded-[5px] transition-colors border ${order.status === "cancelled" ? "bg-rose-500/20 text-rose-500 border-rose-500/30" : "bg-input text-muted-foreground border-border hover:border-rose-500/50"}`}>
                              <XIcon className="h-4 w-4" />
                            </button>
                            <button onClick={() => removeOrder(order.id)} title="Eliminar" className="flex-1 inline-flex items-center justify-center h-10 rounded-[5px] transition-colors bg-input border border-border text-muted-foreground hover:bg-destructive hover:text-destructive-foreground hover:border-destructive">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Order Details */}
                        <div className="flex-[2] grid sm:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h4 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">Entrega y Pago</h4>
                            <ul className="text-sm space-y-3">
                              <li className="flex gap-2"><span className="text-muted-foreground font-medium w-16">Tipo:</span> <span>{order.delivery_type}</span></li>
                              {order.delivery_address && order.delivery_address !== "N/A (Retiro Discreto)" && (
                                <li className="flex gap-2"><span className="text-muted-foreground font-medium w-16">Lugar:</span> <span>{order.delivery_address}</span></li>
                              )}
                              <li className="flex gap-2"><span className="text-muted-foreground font-medium w-16">Pago:</span> <span>{order.payment_method}</span></li>
                            </ul>

                            <h4 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold pt-4 border-t border-border/40">Resumen Financiero</h4>
                            <div className="bg-background/40 p-4 rounded-[5px] border border-border/40 space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span><span>{formatPrice(order.subtotal)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Envío</span><span>{order.shipping_cost === 0 ? "Gratis" : formatPrice(order.shipping_cost)}</span>
                              </div>
                              {order.payment_adjustment !== 0 && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Ajuste</span>
                                  <span className={order.payment_adjustment < 0 ? "text-emerald-500 font-medium" : ""}>
                                    {order.payment_adjustment < 0 ? "-" : "+"}{formatPrice(Math.abs(order.payment_adjustment))}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between border-t border-border/40 pt-2 font-serif text-xl font-bold text-primary">
                                <span>Total</span><span>{formatPrice(order.total)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">Piezas ({orderItems.length})</h4>
                            <ul className="space-y-3">
                              {orderItems.map((item, idx) => (
                                <li key={idx} className="flex items-center gap-3 bg-background/50 p-3 rounded-[5px] border border-border/40">
                                  <div className="h-12 w-12 shrink-0 rounded-[5px] bg-muted overflow-hidden border border-border/20">
                                    {item.image_url && <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-serif text-base truncate">{item.title}</p>
                                    <p className="text-xs text-muted-foreground">{item.quantity} x {formatPrice(item.price)}</p>
                                  </div>
                                  <span className="font-bold text-foreground">{formatPrice(item.price * item.quantity)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "offers" && (
            <div className="animate-in fade-in duration-500 max-w-2xl space-y-10">
              <header>
                <h1 className="font-serif text-4xl sm:text-5xl text-foreground">Ofertas y Combos</h1>
                <p className="mt-2 text-muted-foreground">Configura los descuentos globales por llevar múltiples piezas (Bundles).</p>
              </header>

              <section className="rounded-[8px] border border-border/80 bg-card p-8 shadow-sm">
                <h2 className="font-serif text-2xl mb-2 text-primary">Descuento Global por Volumen</h2>
                <p className="text-sm text-muted-foreground mb-6">Esta regla aplica a cualquier par de ítems que el cliente agregue a su bolsa.</p>
                
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">Si llevan 2 piezas, descontar ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={discount2}
                      onChange={(e) => setDiscount2(e.target.value)}
                      placeholder="Ej. 5"
                      className="mt-3 w-full rounded-[8px] border border-border bg-input px-4 py-3 text-base focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">Si llevan 3 piezas o más, descontar ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={discount3}
                      onChange={(e) => setDiscount3(e.target.value)}
                      placeholder="Ej. 10"
                      className="mt-3 w-full rounded-[8px] border border-border bg-input px-4 py-3 text-base focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    />
                  </div>
                </div>
              </section>

              <div className="sticky bottom-5 border-t border-border/40 pt-5 flex justify-end">
                <button onClick={saveSettings} className="inline-flex h-[58px] min-w-[200px] items-center justify-center rounded-[8px] bg-primary text-sm font-bold uppercase tracking-[0.2em] text-primary-foreground hover:glow-ruby transition-all focus:outline-none focus:ring-4 focus:ring-primary/40 shadow-lg">
                  Guardar Ofertas
                </button>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="animate-in fade-in duration-500 max-w-2xl space-y-10">
              <header>
                <h1 className="font-serif text-4xl sm:text-5xl text-foreground">Ajustes</h1>
                <p className="mt-2 text-muted-foreground">Configuraciones generales del sistema.</p>
              </header>

              <section className="rounded-[8px] border border-border/80 bg-card p-8 shadow-sm">
                <h2 className="font-serif text-2xl mb-2 text-primary">Atención al Cliente</h2>
                <p className="text-sm text-muted-foreground mb-6">Configura el número de WhatsApp a donde llegarán las órdenes de los clientes.</p>
                
                <div className="space-y-3">
                  <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">Número de WhatsApp</label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">+</span>
                      <input
                        value={waNumber}
                        onChange={(e) => setWaNumber(e.target.value)}
                        placeholder="52 1 555 555 5555"
                        className="w-full rounded-[8px] border border-border bg-input pl-8 pr-4 py-4 text-base focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Incluye el código de país sin el símbolo "+". Ejemplo para México: 5215512345678</p>
                </div>
              </section>

              <section className="rounded-[8px] border border-border/80 bg-card p-8 shadow-sm">
                <h2 className="font-serif text-2xl mb-2 text-primary">Métodos de Pago</h2>
                <p className="text-sm text-muted-foreground mb-8">Configura las credenciales para los distintos métodos de pago. Efectivo siempre estará activo.</p>
                
                <div className="space-y-10">
                  {/* Pago Movil */}
                  <div>
                    <h3 className="font-sans text-sm font-bold uppercase tracking-widest text-foreground mb-4 border-b border-border/40 pb-2">Pago Móvil (Venezuela)</h3>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <Field label="Banco" placeholder="Ej. Banesco (0134)" value={pmBanco} onChange={setPmBanco} />
                      <Field label="Teléfono" placeholder="Ej. 04141234567" value={pmTelefono} onChange={setPmTelefono} />
                      <Field label="Cédula / RIF" placeholder="Ej. V-12345678" value={pmCedula} onChange={setPmCedula} />
                      <Field label="Nombre del Titular" placeholder="Ej. Juan Pérez" value={pmNombre} onChange={setPmNombre} />
                    </div>
                  </div>

                  {/* Zelle */}
                  <div>
                    <h3 className="font-sans text-sm font-bold uppercase tracking-widest text-foreground mb-4 border-b border-border/40 pb-2">Zelle</h3>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <Field label="Correo Zelle" placeholder="ejemplo@correo.com" value={zelleEmail} onChange={setZelleEmail} />
                    </div>
                  </div>

                  {/* Binance */}
                  <div>
                    <h3 className="font-sans text-sm font-bold uppercase tracking-widest text-foreground mb-4 border-b border-border/40 pb-2">Binance Pay</h3>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <Field label="Pay ID o Correo Binance" placeholder="Ej. 123456789 o email" value={binanceId} onChange={setBinanceId} />
                    </div>
                  </div>
                </div>
              </section>

              <div className="sticky bottom-5 border-t border-border/40 pt-5 flex justify-end">
                <button onClick={saveSettings} className="inline-flex h-[58px] min-w-[200px] items-center justify-center rounded-[8px] bg-primary text-sm font-bold uppercase tracking-[0.2em] text-primary-foreground hover:glow-ruby transition-all focus:outline-none focus:ring-4 focus:ring-primary/40 shadow-lg">
                  Guardar Cambios
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick, badge }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-3 px-4 py-4 rounded-[8px] transition-all focus:outline-none ${
        active ? "bg-primary/10 text-primary font-bold border border-primary/20" : "text-muted-foreground hover:bg-input hover:text-foreground font-medium border border-transparent"
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-base">{label}</span>
      </div>
      {badge !== undefined && (
        <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
          {badge}
        </span>
      )}
    </button>
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
      <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">{label}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder={placeholder}
          className="mt-3 w-full rounded-[8px] border border-border bg-input px-4 py-3 text-base focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none resize-none"
        />
      ) : (
        <input
          type={type}
          step={type === "number" ? "0.01" : undefined}
          value={value}
          required={required}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="mt-3 w-full rounded-[8px] border border-border bg-input px-4 py-3 text-base focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
        />
      )}
    </div>
  );
}
