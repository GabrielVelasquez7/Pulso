import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export function Header() {
  const { count, open } = useCart();
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 backdrop-blur-xl bg-background/80 shadow-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-baseline gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-[5px] p-1">
          <span className="font-serif text-3xl tracking-wide text-primary">Noir</span>
          <span className="font-serif text-3xl italic text-foreground/90">&amp; Or</span>
        </Link>
        <nav className="hidden md:flex items-center gap-10 text-base tracking-[0.2em] uppercase text-muted-foreground font-medium">
          <Link to="/" className="hover:text-primary transition-colors focus:outline-none focus-visible:text-primary rounded-[5px] py-2 px-3">
            Colección
          </Link>
        </nav>
        <button
          onClick={open}
          aria-label="Abrir carrito"
          className="relative inline-flex h-14 w-14 items-center justify-center rounded-[8px] bg-card border border-border text-primary hover:border-primary hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <ShoppingBag className="h-6 w-6" />
          {count > 0 && (
            <span className="absolute -top-2 -right-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground shadow-sm">
              {count}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
