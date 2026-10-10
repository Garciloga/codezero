"use client";
import LocalizedContent from "./localization/client";
import LanguageSelector from "./localization/language-selector";

import Link from "next/link";
import BrandLogo from "./brand-logo";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const links = [
  { label: "Sobre Garciloga", href: "/about" },
  { label: "Cómo funciona", href: "/#como-funciona" },
  { label: "Programas", href: "/programas" },
  { label: "La ruta", href: "/#ruta" },
  { label: "Para empresas", href: "/companies" },
  { label: "Precios", href: "/pricing" },
  { label: "Próximamente", href: "/roadmap" },
  { label: "Preguntas", href: "/#preguntas" },
];
export default function PublicHeader({ authenticated }: { authenticated: boolean }) {
  const pathname = usePathname();
  const mobileMenu = useRef<HTMLDetailsElement>(null);
  const closeMenu = () => { if (mobileMenu.current) mobileMenu.current.open = false; };
  useEffect(() => { if (mobileMenu.current) mobileMenu.current.open = false; }, [pathname]);
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (mobileMenu.current?.open && !mobileMenu.current.contains(event.target as Node)) closeMenu();
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);
  const navigation = <LocalizedContent><>{links.map(link => <Link prefetch={false} href={link.href} key={link.href}
    aria-current={pathname === link.href ? "page" : undefined}>{link.label}</Link>)}</></LocalizedContent>;
  return <LocalizedContent><header className="public-header">
    <div className="public-header-inner">
      <Link prefetch={false} className="public-brand" href="/" aria-label="Garciloga · Inicio"><BrandLogo/></Link>
      <nav className="public-nav public-desktop-nav" aria-label="Navegación pública">{navigation}</nav>
      <div className="public-auth">{authenticated ? <Link prefetch={false} className="btn" href="/dashboard">Ir a mi panel</Link> : <>
        <Link prefetch={false} href="/login">Entrar</Link><Link prefetch={false} className="btn" href="/login?modo=registro">Empezar gratis</Link>
      </>}</div>
      <details ref={mobileMenu} className="public-mobile-menu" onKeyDown={event => {
        if (event.key === "Escape" && mobileMenu.current?.open) {
          closeMenu();
          mobileMenu.current.querySelector("summary")?.focus();
        }
      }}><summary>Explorar Garciloga <span className="menu-chevron" aria-hidden="true">⌄</span></summary>
        <nav className="public-nav" aria-label="Navegación pública móvil" onClick={event => {
          if ((event.target as HTMLElement).closest("a")) closeMenu();
        }}>{navigation}</nav>
      </details>
      <LanguageSelector />
    </div>
  </header></LocalizedContent>;
}


