"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AccountShellSkeleton } from "@/components/account/AccountShellSkeleton";
import { NavCountBadge } from "@/components/account/NavCountBadge";
import { accountShellStyles } from "@/components/account/accountShellStyles";
import { profileInitials } from "@/lib/profile-initials";

type BuyerProfile = {
  nama: string;
  email: string;
  instansi: string;
  no_telepon: string;
  alamat: string;
  negara: string;
};

function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconQuotation() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconInvoice() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 2v6h6M8 13h8M8 17h5"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconShop() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 7h18M5 7l1.2 12h11.6L19 7M9 11v4m6-4v4M10 7V5a1 1 0 011-1h2a1 1 0 011 1v2"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 7l5 5-5 5M19 12H9M11 5H6a2 2 0 00-2 2v10a2 2 0 002 2h5"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Props = {
  children: ReactNode;
};

export function BuyerAccountShell({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<BuyerProfile | null>(null);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [unpaidQuotations, setUnpaidQuotations] = useState(0);

  const loadNavBadges = async () => {
    try {
      const res = await fetch("/api/account/nav-badges", { cache: "no-store" });
      const data = (await res.json()) as {
        pendingRequests?: number;
        unpaidQuotations?: number;
      };
      if (res.ok) {
        setPendingRequests(Number(data.pendingRequests) || 0);
        setUnpaidQuotations(Number(data.unpaidQuotations) || 0);
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const sessionRes = await fetch("/api/auth/session", { cache: "no-store" });
        const session = (await sessionRes.json()) as {
          authenticated?: boolean;
          role?: "pelanggan" | "admin";
        };
        if (cancelled) return;

        if (!session.authenticated || session.role !== "pelanggan") {
          const returnTo = encodeURIComponent(pathname || "/account");
          router.replace(`/login?returnTo=${returnTo}`);
          return;
        }

        const [profileRes] = await Promise.all([
          fetch("/api/auth/profile", { cache: "no-store" }),
          loadNavBadges(),
        ]);
        const data = (await profileRes.json()) as { profile?: BuyerProfile };
        if (!cancelled && profileRes.ok && data.profile) {
          setProfile(data.profile);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  useEffect(() => {
    if (!ready) return;

    const onFocus = () => {
      loadNavBadges();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [ready]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const navItems = [
    { href: "/account", label: "Profile", icon: <IconUser />, exact: true, badge: 0 },
    {
      href: "/account/quotations",
      label: "My Requests",
      icon: <IconQuotation />,
      exact: false,
      badge: pendingRequests,
    },
    {
      href: "/account/my-quotation",
      label: "My Quotation",
      icon: <IconInvoice />,
      exact: false,
      badge: unpaidQuotations,
    },
  ];

  if (!ready) {
    return <AccountShellSkeleton navItemCount={4} />;
  }

  return (
    <div className="account-shell">
      <aside className="account-shell-sidebar">
        <div className="account-shell-profile-card">
          <div className="account-shell-avatar" aria-hidden>
            {profile ? profileInitials(profile.nama) : "—"}
          </div>
          <p className="account-shell-name">{profile?.nama ?? "—"}</p>
          <p className="account-shell-email">{profile?.email ?? ""}</p>
          {profile?.instansi ? <p className="account-shell-meta">{profile.instansi}</p> : null}
        </div>

        <nav className="account-shell-nav" aria-label="Account navigation">
          {navItems.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`account-shell-nav-item${active ? " is-active" : ""}`}
              >
                {item.icon}
                <span className="account-shell-nav-label">{item.label}</span>
                <NavCountBadge
                  count={item.badge}
                  label={
                    item.href === "/account/quotations"
                      ? `${item.badge} pending requests`
                      : item.href === "/account/my-quotation"
                        ? `${item.badge} unpaid quotations`
                        : undefined
                  }
                />
              </Link>
            );
          })}
        </nav>

        <button type="button" className="account-shell-logout" onClick={handleLogout}>
          <IconLogout />
          Logout
        </button>
      </aside>

      <div className="account-shell-main">{children}</div>

      <style>{accountShellStyles}</style>
    </div>
  );
}
