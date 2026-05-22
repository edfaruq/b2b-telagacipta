"use client";
import type { MouseEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function GlobalNavbar() {
  const pathname = usePathname();
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [sessionRole, setSessionRole] = useState<"pelanggan" | "admin" | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        const result = (await response.json()) as {
          authenticated?: boolean;
          email?: string;
          role?: "pelanggan" | "admin";
        };
        if (!isMounted) return;
        if (result.authenticated && result.email) {
          setSessionEmail(result.email);
          setSessionRole(result.role ?? null);
        } else {
          setSessionEmail(null);
          setSessionRole(null);
        }
      } catch {
        if (!isMounted) return;
        setSessionEmail(null);
        setSessionRole(null);
      }
    };
    loadSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogoClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const accountHref = sessionRole === "admin" ? "/admin" : "/account";

  return (
    <div className="market-nav-wrap">
      <nav className="market-nav">
        <div className="market-nav-left">
          <Link href="/" aria-label="Go to homepage" onClick={handleLogoClick}>
            <img src="/images/logo-telagacipta.png" alt="Telagacipta" className="market-nav-logo" />
          </Link>
        </div>

        <div className="market-nav-search">
          <span className="market-nav-search-icon">⌕</span>
          <input className="market-nav-search-input" placeholder="Search products" />
        </div>

        <div className="market-nav-right">
          <div className="market-nav-divider" />
          <button className="market-lang-btn" type="button">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M10 1.5C10 1.5 7 5 7 10C7 15 10 18.5 10 18.5M10 1.5C10 1.5 13 5 13 10C13 15 10 18.5 10 18.5M1.5 10H18.5" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            EN
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
          {sessionEmail ? (
            <Link
              href={accountHref}
              className="market-login-btn"
              title={sessionRole === "admin" ? "Admin dashboard" : "My account"}
            >
              {sessionEmail}
            </Link>
          ) : (
            <a className="market-login-btn" href="/login">
              Login
            </a>
          )}
        </div>
      </nav>
    </div>
  );
}
