import { Link } from "@tanstack/react-router";
import logo from "@/assets/bioxar-logo.png";
import { NAV_LINKS } from "./nav-links";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3 md:px-8">
        <div>
          <img src={logo} alt="BioXar Design Studio" className="h-16 w-auto" />
          <p className="mt-3 font-headline text-sm text-primary">Designed to be rearranged.</p>
          <p className="mt-2 text-base text-foreground/90">BioXar Design Studio, Berlin.</p>
        </div>
        <nav className="flex flex-col gap-3">
          {NAV_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="font-label text-sm text-foreground hover:text-primary">{l.label}</Link>
          ))}
        </nav>
        <div className="flex flex-col gap-3 text-base text-foreground">
          <a href="https://www.instagram.com/bioxardesign" target="_blank" rel="noreferrer" className="hover:text-primary">Instagram @bioxardesign</a>
          <a href="https://www.linkedin.com/company/bioxar" target="_blank" rel="noreferrer" className="hover:text-primary">LinkedIn @bioxar</a>
        </div>
      </div>
    </footer>
  );
}
