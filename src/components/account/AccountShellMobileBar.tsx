"use client";

import { IconCloseMenu, IconMenu } from "@/components/account/AccountShellMenuIcons";

type Props = {
  title: string;
  menuOpen: boolean;
  onToggle: () => void;
};

export function AccountShellMobileBar({ title, menuOpen, onToggle }: Props) {
  return (
    <div className="account-shell-mobile-bar">
      <button
        type="button"
        className="account-shell-menu-btn"
        onClick={onToggle}
        aria-expanded={menuOpen}
        aria-controls="account-shell-sidebar"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
      >
        {menuOpen ? <IconCloseMenu /> : <IconMenu />}
      </button>
      <span className="account-shell-mobile-title">{title}</span>
    </div>
  );
}
