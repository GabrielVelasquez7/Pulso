import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductDetail } from "@/components/ProductDetail";
import { Product } from "@/components/ProductCard";

export const Route = createFileRoute("/product/:productId")({
  component: ProductPage,
  head: ({ params }) => ({
    meta: [
      { title: `PULSO — Producto ${params.productId}` },
    ],
  }),
});

function ProductPage({ params }: { params: { productId: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params.productId;
    if (!id) return;
    supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setProduct(data as Product);
        setLoading(false);
      });
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
