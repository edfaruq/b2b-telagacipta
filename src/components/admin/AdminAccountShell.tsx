"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AccountShellSkeleton } from "@/components/account/AccountShellSkeleton";
import { NavCountBadge } from "@/components/account/NavCountBadge";
import { accountShellStyles } from "@/components/account/accountShellStyles";
import { profileInitials } from "@/lib/profile-initials";

export type AdminMenuKey =
  | "user-dashboard"
  | "manage-orders"
  | "create-product"
  | "manage-product";

type NavItem = {
  key: AdminMenuKey;
  label: string;
  icon: ReactNode;
};

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
  activeMenu: AdminMenuKey;
  onMenuChange: (menu: AdminMenuKey) => void;
  navItems: NavItem[];
  children: ReactNode;
};

export function AdminAccountShell({ activeMenu, onMenuChange, navItems, children }: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [pendingQuotationRequests, setPendingQuotationRequests] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [pendingShipments, setPendingShipments] = useState(0);
  const [pendingUserApprovals, setPendingUserApprovals] = useState(0);

  const loadNavBadges = async () => {
    try {
      const res = await fetch("/api/admin/nav-badges", { cache: "no-store" });
      const data = (await res.json()) as {
        pendingQuotationRequests?: number;
        pendingPayments?: number;
        pendingShipments?: number;
        pendingUserApprovals?: number;
      };
      if (res.ok) {
        setPendingQuotationRequests(Number(data.pendingQuotationRequests) || 0);
        setPendingPayments(Number(data.pendingPayments) || 0);
        setPendingShipments(Number(data.pendingShipments) || 0);
        setPendingUserApprovals(Number(data.pendingUserApprovals) || 0);
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        const data = (await res.json()) as {
          authenticated?: boolean;
          role?: "pelanggan" | "admin";
          email?: string;
        };
        if (cancelled) return;

        if (!data.authenticated || data.role !== "admin") {
          router.replace("/login?returnTo=%2Fadmin");
          return;
        }

        setEmail(data.email ?? "");
        await loadNavBadges();
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!ready) return;

    const onFocus = () => {
      loadNavBadges();
    };
    const onBadgesRefresh = () => {
      loadNavBadges();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("admin-nav-badges-refresh", onBadgesRefresh);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("admin-nav-badges-refresh", onBadgesRefresh);
    };
  }, [ready]);

  const badgeForMenu = (key: AdminMenuKey): number => {
    if (key === "user-dashboard") return pendingUserApprovals;
    if (key === "manage-orders") {
      return pendingQuotationRequests + pendingPayments + pendingShipments;
    }
    return 0;
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const displayName = email ? email.split("@")[0] : "Admin";

  if (!ready) {
    return (
      <AccountShellSkeleton navItemCount={navItems.length} showBrand adminLayout />
    );
  }

  return (
    <div className="account-shell account-shell--admin">
      <aside className="account-shell-sidebar">
        <div className="account-shell-brand">
          <Link href="/admin" className="account-shell-brand-link" aria-label="Telagacipta Admin">
            <img
              src="/images/logo-telagacipta.png"
              alt="Telagacipta"
              className="account-shell-brand-logo"
            />
          </Link>
        </div>

        <div className="account-shell-profile-card">
          <div className="account-shell-avatar" aria-hidden>
            {profileInitials(displayName)}
          </div>
          <p className="account-shell-name">{displayName}</p>
          <p className="account-shell-email">{email}</p>
          <p className="account-shell-meta">Administrator</p>
        </div>

        <nav className="account-shell-nav" aria-label="Admin navigation">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`account-shell-nav-btn${activeMenu === item.key ? " is-active" : ""}`}
              onClick={() => onMenuChange(item.key)}
            >
              {item.icon}
              <span className="account-shell-nav-label">{item.label}</span>
              <NavCountBadge
                count={badgeForMenu(item.key)}
                label={
                  item.key === "user-dashboard"
                    ? `${badgeForMenu(item.key)} users awaiting approval`
                    : item.key === "manage-orders"
                      ? `${badgeForMenu(item.key)} order items need attention`
                      : undefined
                }
              />
            </button>
          ))}
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
