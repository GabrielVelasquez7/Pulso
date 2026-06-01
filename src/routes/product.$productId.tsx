import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductDetail } from "@/components/ProductDetail";
import { Product } from "@/components/ProductCard";

export const Route = createFileRoute()({
  component: ProductPage,
  head: () => ({
    meta: [
      { title: `PULSO — Producto` },
    ],
  }),
});

function ProductPage({ params }: { params: { productId: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params.productId;
    if (!id) return;
    (async () => {
      try {
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
        }
      } catch (err) {
        console.error('[Supabase] Exception fetching product:', err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.productId]);

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
      recommendedProducts={[]}
      onBack={() => { window.location.href = '/'; }}
      onSelectProduct={(p) => { window.location.href = `/product/${p.id}`; }}
    />
  );
}
