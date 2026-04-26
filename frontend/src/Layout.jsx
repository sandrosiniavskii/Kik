import React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useI18n } from "./i18n";
import { useAuth } from "./auth";

export function Header() {
  const { t, lang, setLang } = useI18n();
  const { user } = useAuth();

  const navCls = ({ isActive }) =>
    `text-xs font-mono uppercase tracking-[0.22em] py-2 transition-colors ${
      isActive ? "text-[var(--kik-accent)]" : "text-[var(--kik-ink)] hover:text-[var(--kik-accent)]"
    }`;

  return (
    <header
      data-testid="kik-header"
      className="sticky top-0 z-40 border-b border-black bg-[#EBEBEB]/85 backdrop-blur-md"
    >
      <div className="grid grid-cols-12 items-center px-4 md:px-8 py-4">
        <Link
          to="/"
          data-testid="brand-logo"
          className="col-span-3 md:col-span-2 font-display text-3xl md:text-4xl tracking-tighter leading-none lowercase"
        >
          kik<span className="text-[var(--kik-accent)]">.</span>
        </Link>

        <nav className="hidden md:flex col-span-7 gap-8 items-center justify-center">
          <NavLink to="/auctions" data-testid="nav-auctions" className={navCls}>
            {t.nav.auctions}
          </NavLink>
          <NavLink to="/artists" data-testid="nav-artists" className={navCls}>
            {t.nav.artists}
          </NavLink>
          <NavLink to="/about" data-testid="nav-about" className={navCls}>
            {t.nav.about}
          </NavLink>
          <NavLink to="/contact" data-testid="nav-contact" className={navCls}>
            {t.nav.contact}
          </NavLink>
        </nav>

        <div className="col-span-9 md:col-span-3 flex justify-end items-center gap-3">
          <div data-testid="lang-toggle" className="flex items-center font-mono text-xs uppercase tracking-[0.2em] border border-black">
            <button
              data-testid="lang-en"
              onClick={() => setLang("en")}
              className={`px-3 py-1.5 transition-colors ${lang === "en" ? "bg-black text-[#f4f4f4]" : "hover:bg-black hover:text-[#f4f4f4]"}`}
            >
              EN
            </button>
            <span className="border-l border-black h-full" />
            <button
              data-testid="lang-ru"
              onClick={() => setLang("ru")}
              className={`px-3 py-1.5 transition-colors ${lang === "ru" ? "bg-black text-[#f4f4f4]" : "hover:bg-black hover:text-[#f4f4f4]"}`}
            >
              RU
            </button>
          </div>
          <Link
            data-testid="nav-admin"
            to={user ? "/admin" : "/admin/login"}
            className="hidden md:inline-block text-[10px] font-mono uppercase tracking-[0.22em] text-[var(--kik-ink-soft)] hover:text-[var(--kik-accent)]"
          >
            {t.nav.admin}
          </Link>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex border-t border-black">
        <MobileLink to="/auctions" label={t.nav.auctions} testid="m-nav-auctions" />
        <MobileLink to="/artists" label={t.nav.artists} testid="m-nav-artists" />
        <MobileLink to="/about" label={t.nav.about} testid="m-nav-about" />
        <MobileLink to="/contact" label={t.nav.contact} testid="m-nav-contact" />
      </div>
    </header>
  );
}

function MobileLink({ to, label, testid }) {
  return (
    <NavLink
      to={to}
      data-testid={testid}
      className={({ isActive }) =>
        `flex-1 text-center py-3 text-[10px] font-mono uppercase tracking-[0.2em] border-r border-black last:border-r-0 ${
          isActive ? "bg-black text-[#f4f4f4]" : ""
        }`
      }
    >
      {label}
    </NavLink>
  );
}

export function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();
  return (
    <footer data-testid="kik-footer" className="border-t border-black mt-24">
      <div className="grid grid-cols-12 px-4 md:px-8 py-12 gap-6">
        <div className="col-span-12 md:col-span-5">
          <div className="font-display text-6xl md:text-7xl lowercase leading-none">
            kik<span className="text-[var(--kik-accent)]">.</span>
          </div>
          <p className="mt-4 text-xs font-mono uppercase tracking-[0.2em] text-[var(--kik-ink-soft)]">
            {t.footer.pop}
          </p>
        </div>
        <div className="col-span-6 md:col-span-3 text-xs font-mono uppercase tracking-[0.18em] space-y-2">
          <div className="kik-label">Index</div>
          <div><Link to="/auctions" className="hover:text-[var(--kik-accent)]">{t.nav.auctions}</Link></div>
          <div><Link to="/artists" className="hover:text-[var(--kik-accent)]">{t.nav.artists}</Link></div>
          <div><Link to="/about" className="hover:text-[var(--kik-accent)]">{t.nav.about}</Link></div>
          <div><Link to="/contact" className="hover:text-[var(--kik-accent)]">{t.nav.contact}</Link></div>
        </div>
        <div className="col-span-6 md:col-span-4 text-xs font-mono uppercase tracking-[0.18em] space-y-2">
          <div className="kik-label">Channels</div>
          <div>info@kik.art</div>
          <div>instagram / @kik.auctions</div>
          <div>+44 0 000 000</div>
        </div>
      </div>
      <div className="border-t border-black px-4 md:px-8 py-4 flex justify-between items-center text-[10px] font-mono uppercase tracking-[0.22em] text-[var(--kik-ink-soft)]">
        <span>© {year} kik</span>
        <span>{t.footer.rights}</span>
      </div>
    </footer>
  );
}
