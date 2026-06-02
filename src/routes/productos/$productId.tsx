import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductDetail } from "@/components/ProductDetail";
import { Product } from "@/components/ProductCard";

export const Route = createFileRoute("/productos/$productId")({
  component: ProductPage,
  head: () => ({
    meta: [
      { title: `PULSO — Producto` },
    ],
  }),
});

function ProductPage() {
  const { productId } = Route.useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [whatsappNumber, setWhatsappNumber] = useState<string>("5215555555555");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = productId;
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        // Fetch current product
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .single();
        if (error) {
          console.error('[Supabase] Fetch product error:', error);
          setProduct(null);
        } else {
          setProduct(data as Product);

          // Fetch recommended products (excluding current, limit 4)
          const { data: recData, error: recError } = await supabase
            .from("products")
            .select("*")
            .neq("id", id)
            .limit(4);
          if (!recError && recData) {
            setRecommendedProducts(recData as Product[]);
          }
        }

        // Fetch WhatsApp number from site_settings
        const { data: settingsData, error: settingsError } = await supabase
          .from("site_settings")
          .select("*");
        if (!settingsError && settingsData) {
          const dict: Record<string, string> = {};
          settingsData.forEach(d => dict[d.key] = d.value);
          if (dict.whatsapp_number) {
            setWhatsappNumber(dict.whatsapp_number);
          }
        }
      } catch (err) {
        console.error('[Supabase] Exception fetching product details data:', err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse rounded-[8px] border border-border/60 bg-card/60 h-64 w-64" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Producto no encontrado.</p>
      </div>
    );
  }

  return (
    <ProductDetail
      product={product}
      recommendedProducts={recommendedProducts}
      whatsappNumber={whatsappNumber}
      onBack={() => { window.location.href = '/'; }}
      onSelectProduct={(p) => { window.location.href = `/productos/${p.id}`; }}
    />
  );
}
