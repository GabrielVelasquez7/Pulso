import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Currency = "USD" | "VES";

type CurrencyContextValue = {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  bcvRate: number;
  formatPrice: (amountInUsd: number, forceCurrency?: Currency) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [bcvRate, setBcvRate] = useState<number>(1);

  useEffect(() => {
    async function fetchRate() {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "bcv_usd_rate")
          .maybeSingle();
        
        if (data && data.value) {
          const rate = parseFloat(data.value);
          if (!isNaN(rate) && rate > 0) {
            setBcvRate(rate);
          }
        }
      } catch (err) {
        console.error("Error fetching BCV rate:", err);
      }
    }
    fetchRate();
  }, []);

  const formatPrice = (amountInUsd: number, forceCurrency?: Currency) => {
    const activeCurrency = forceCurrency || currency;
    if (activeCurrency === "VES") {
      const amountInVes = amountInUsd * bcvRate;
      return new Intl.NumberFormat("es-VE", {
        style: "currency",
        currency: "VES",
        minimumFractionDigits: 2,
      }).format(amountInVes).replace("VES", "Bs.");
    } else {
      return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }).format(amountInUsd);
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, bcvRate, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside CurrencyProvider");
  return ctx;
}
