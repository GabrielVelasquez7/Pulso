import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, LogOut } from "lucide-react";

export const Route = createFileRoute("/atelier-privado")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Atelier · Noir &amp; Or" }] }),
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

export function AdminPage() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<FormState>(empty);
  const [waNumber, setWaNumber] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts((data ?? []) as Product[]);
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsAdmin(true);
      setAuthChecked(true);
      load();
      const { data: ws } = await supabase.from("site_settings").select("value").eq("key", "whatsapp_number").maybeSingle();
      if (ws?.value) setWaNumber(ws.value);
    };
    init();
  }, [load]);

  const logout = async () => {
    localStorage.removeItem("mock_auth");
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

  if (!authChecked) {
    return <div className="p-20 text-center text-muted-foreground">Cargando…</div>;
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-xl px-5 py-20 text-center">
        <h1 className="font-serif text-3xl">Acceso restringido</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Tu cuenta no tiene rol de administrador. Pídele al propietario que asigne el rol{" "}
          <code className="text-primary">admin</code> a tu user_id:
        </p>
        <code className="mt-4 inline-block rounded-md border border-border bg-card px-4 py-2 text-xs text-primary">
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
          <p className="text-[10px] uppercase tracking-[0.4em] text-primary">Panel</p>
          <h1 className="mt-2 font-serif text-4xl">Administración</h1>
        </div>
        <button onClick={logout} className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-primary">
          <LogOut className="h-4 w-4" /> Salir
        </button>
      </div>

      {/* WhatsApp settings */}
      <section className="mb-10 rounded-lg border border-border/60 bg-card/70 p-6">
        <h2 className="font-serif text-xl mb-4">Número de WhatsApp para pedidos</h2>
        <div className="flex gap-3">
          <input
            value={waNumber}
            onChange={(e) => setWaNumber(e.target.value)}
            placeholder="5215555555555 (con código de país)"
            className="flex-1 rounded-md border border-border bg-input/50 px-4 py-3 text-sm focus:border-primary focus:outline-none"
          />
          <button onClick={saveWhatsApp} className="rounded-md bg-primary px-6 text-xs uppercase tracking-[0.25em] text-primary-foreground hover:glow-ruby">
            Guardar
          </button>
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        {/* Form */}
        <section className="rounded-lg border border-border/60 bg-card/70 p-6 h-fit sticky top-20">
          <h2 className="font-serif text-2xl mb-5">{form.id ? "Editar producto" : "Nuevo producto"}</h2>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Título" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
            <Field label="Descripción" value={form.description} onChange={(v) => setForm({ ...form, description: v })} textarea />
            <Field label="URL de imagen" value={form.image_url} onChange={(v) => setForm({ ...form, image_url: v })} placeholder="https://..." />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Precio" type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} required />
              <Field label="Stock" type="number" value={form.stock} onChange={(v) => setForm({ ...form, stock: v })} />
            </div>
            <Field label="Precio de promoción (opcional)" type="number" value={form.sale_price} onChange={(v) => setForm({ ...form, sale_price: v })} />
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={form.is_promo} onChange={(e) => setForm({ ...form, is_promo: e.target.checked })} className="accent-primary h-4 w-4" />
              Activar oferta (mostrar precio tachado)
            </label>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-primary py-3 text-xs uppercase tracking-[0.25em] text-primary-foreground hover:glow-ruby">
                <Plus className="h-4 w-4" /> {form.id ? "Guardar" : "Crear"}
              </button>
              {form.id && (
                <button type="button" onClick={() => setForm(empty)} className="rounded-md border border-border px-5 text-xs uppercase tracking-[0.25em] hover:border-primary">
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
              <li key={p.id} className="flex items-center gap-4 rounded-md border border-border bg-card p-4 shadow-sm">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-muted/80">
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
                <button onClick={() => edit(p)} className="p-3 text-muted-foreground hover:text-primary transition-colors bg-input/20 rounded-md" aria-label="Editar"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => remove(p.id)} className="p-3 text-muted-foreground hover:text-destructive transition-colors bg-input/20 rounded-md" aria-label="Eliminar"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        </section>
      </div>
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
          className="mt-2 w-full rounded-md border border-border bg-input/50 px-4 py-3 text-sm focus:border-primary focus:outline-none"
        />
      ) : (
        <input
          type={type}
          step={type === "number" ? "0.01" : undefined}
          value={value}
          required={required}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 w-full rounded-md border border-border bg-input/50 px-4 py-3 text-sm focus:border-primary focus:outline-none"
        />
      )}
    </div>
  );
}
