import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export function Header() {
  const { count, open } = useCart();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 backdrop-blur-xl bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-baseline gap-2 group">
          <span className="font-serif text-2xl tracking-wide text-primary">Noir</span>
          <span className="font-serif text-2xl italic text-foreground/90">&amp; Or</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm tracking-[0.2em] uppercase text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">Colección</Link>
        </nav>
        <button
          onClick={open}
          aria-label="Abrir carrito"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-[5px] border border-border/70 text-foreground/90 hover:border-primary hover:text-primary transition-colors"
        >
          <ShoppingBag className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {count}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
