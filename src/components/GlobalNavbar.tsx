"use client";
import type { MouseEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProfileAvatar } from "@/components/ProfileAvatar";

type SessionState = {
  authenticated: boolean;
  email?: string;
  role?: "pelanggan" | "admin";
  name?: string;
  foto_profil?: string;
};

export default function GlobalNavbar() {
  const pathname = usePathname();
  const [session, setSession] = useState<SessionState>({ authenticated: false });

  const loadSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      const result = (await response.json()) as SessionState;
      if (result.authenticated && result.email) {
        setSession(result);
      } else {
        setSession({ authenticated: false });
      }
    } catch {
      setSession({ authenticated: false });
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    const onAvatarUpdated = () => {
      void loadSession();
    };
    window.addEventListener("profile-avatar-updated", onAvatarUpdated);
    return () => window.removeEventListener("profile-avatar-updated", onAvatarUpdated);
  }, [loadSession]);

  const handleLogoClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const accountHref = session.role === "admin" ? "/admin" : "/account";
  const displayName = session.name ?? session.email?.split("@")[0] ?? "Account";

  return (
    <div className="market-nav-wrap">
      <nav className="market-nav">
        <div className="market-nav-left">
          <Link href="/" aria-label="Go to homepage" onClick={handleLogoClick}>
            <img src="/images/logo-telagacipta.png" alt="Telagacipta" className="market-nav-logo" />
          </Link>
        </div>

        <div className="market-nav-right">
          {session.authenticated && session.email ? (
            <Link
              href={accountHref}
              className="market-profile-btn"
              title={session.email}
              aria-label={`${displayName} account`}
            >
              <ProfileAvatar
                name={displayName}
                src={session.foto_profil}
                size={36}
                className="market-profile-btn__avatar"
              />
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
