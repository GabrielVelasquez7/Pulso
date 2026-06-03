import { Link } from "@tanstack/react-router";
import { ShoppingBag, DollarSign } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useCurrency } from "@/lib/currency-context";
import pulsoLogo from "@/routes/img/pulsgo.png";

export function Header() {
  const { count, open } = useCart();
  const { currency, setCurrency } = useCurrency();
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 backdrop-blur-xl bg-background/80 shadow-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-[5px] p-1">
          <img src={pulsoLogo} alt="PULSO" className="h-10 sm:h-14 w-auto object-contain" />
        </Link>
        <nav className="hidden md:flex items-center gap-10 text-base tracking-[0.2em] uppercase text-muted-foreground font-medium">
          <Link to="/" className="hover:text-primary transition-colors focus:outline-none focus-visible:text-primary rounded-[5px] py-2 px-3">
            Colección
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <div className="flex items-center rounded-full bg-input/50 p-1 border border-border/40 backdrop-blur-sm">
            <button
              onClick={() => setCurrency("USD")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                currency === "USD" 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              USD
            </button>
            <button
              onClick={() => setCurrency("VES")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                currency === "VES" 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              VES
            </button>
          </div>
          <button
            onClick={open}
            aria-label="Abrir carrito"
            className="relative inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-[8px] bg-card border border-border text-primary hover:border-primary hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
          <ShoppingBag className="h-6 w-6" />
          {count > 0 && (
            <span className="absolute -top-2 -right-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground shadow-sm">
              {count}
            </span>
          )}
        </button>
        </div>
      </div>
    </header>
  );
}
