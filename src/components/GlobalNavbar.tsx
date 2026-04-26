"use client";
import type { MouseEvent } from "react";
import { usePathname } from "next/navigation";

export default function GlobalNavbar() {
  const pathname = usePathname();

  const handleLogoClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="market-nav-wrap">
      <nav className="market-nav">
        <div className="market-nav-left">
          <a href="/" aria-label="Go to homepage" onClick={handleLogoClick}>
            <img src="/images/logo-telagacipta.png" alt="Telagacipta" className="market-nav-logo" />
          </a>
        </div>

        <div className="market-nav-search">
          <span className="market-nav-search-icon">⌕</span>
          <input className="market-nav-search-input" placeholder="Search products" />
        </div>

        <div className="market-nav-right">
          <div className="market-nav-divider" />
          <button className="market-lang-btn" type="button">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M10 1.5C10 1.5 7 5 7 10C7 15 10 18.5 10 18.5M10 1.5C10 1.5 13 5 13 10C13 15 10 18.5 10 18.5M1.5 10H18.5" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            EN
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
          <a className="market-login-btn" href="/login">
            Login
          </a>
        </div>
      </nav>
    </div>
  );
}
