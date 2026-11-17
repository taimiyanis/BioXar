import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/bioxar-wordmark.png";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NAV_LINKS } from "./nav-links";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 px-3 pt-3 md:px-6">
      <div className="panel mx-auto flex h-16 max-w-7xl items-center gap-2 rounded-full bg-card/85 pl-4 pr-2 md:gap-4 md:pl-5 shadow-lg backdrop-blur md:h-[4.5rem]">
        <Link to="/" className="shrink-0" aria-label="BioXar home">
          <img src={logo} alt="BioXar Design Studio" className="h-7 w-auto sm:h-9 md:h-10" />
        </Link>
        <nav className="mx-auto hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="font-label rounded-full px-4 py-2.5 text-[0.8rem] text-foreground transition-colors hover:bg-secondary" activeProps={{ className: "!bg-primary !text-primary-foreground" }}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-1.5 lg:ml-0">
          <Button asChild className="font-label h-10 rounded-full px-3.5 text-[0.7rem] sm:h-11 sm:px-5 sm:text-[0.8rem]">
            <Link to="/rent">Shop blocks</Link>
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="size-10 shrink-0 rounded-full sm:size-11 lg:hidden" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 bg-card">
              <SheetTitle className="font-headline text-2xl text-primary">Menu</SheetTitle>
              <nav className="mt-6 flex flex-col gap-2">
                {NAV_LINKS.map((l) => (
                  <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="font-headline rounded-2xl px-4 py-4 text-xl text-foreground hover:bg-secondary" activeProps={{ className: "!bg-primary !text-primary-foreground" }}>
                    {l.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
