"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function useAccountShellMenu() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return {
    menuOpen,
    closeMenu: () => setMenuOpen(false),
    toggleMenu: () => setMenuOpen((open) => !open),
  };
}
