import { createContext, useContext, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

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
  const { data: fetchedRate } = useQuery({
    queryKey: ["bcv-usd-rate"],
    queryFn: async () => {
      const res = await fetch("https://ve.dolarapi.com/v1/dolares/oficial");
      if (!res.ok) throw new Error("Failed to fetch BCV rate");
      const data = await res.json();
      if (!data.promedio) throw new Error("Invalid rate payload");
      return Number(data.promedio);
    },
    refetchInterval: 1000 * 60 * 60 * 2, // Refetch every 2 hours automatically in background
    staleTime: 1000 * 60 * 60, // Consider data fresh for 1 hour
    retry: 3,
  });

  const bcvRate = fetchedRate && fetchedRate > 0 ? fetchedRate : 1;

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
