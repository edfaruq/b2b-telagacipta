export const accountShellStyles = `
  .account-shell {
    display: grid;
    grid-template-columns: 280px minmax(0, 1fr);
    grid-template-areas: "sidebar main";
    min-height: calc(100vh - var(--market-nav-height));
    background: #f4f6fb;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  @keyframes accountShellShimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  .account-shell-skel {
    background: linear-gradient(90deg, #e6edf9 0%, #f5f8ff 45%, #e6edf9 90%);
    background-size: 200% 100%;
    animation: accountShellShimmer 1.35s ease-in-out infinite;
    border-radius: 10px;
  }
  .account-shell-skel-avatar {
    width: 72px;
    height: 72px;
    margin: 0 auto 12px;
    border-radius: 50%;
  }
  .account-shell-skel-line--name {
    height: 18px;
    width: 72%;
    margin: 0 auto 8px;
  }
  .account-shell-skel-line--email {
    height: 13px;
    width: 88%;
    margin: 0 auto;
  }
  .account-shell-skel-line--meta {
    height: 12px;
    width: 55%;
    margin: 10px auto 0;
  }
  .account-shell-skel-nav {
    height: 42px;
    width: 100%;
    border-radius: 10px;
  }
  .account-shell-skel-logout {
    margin-top: auto;
    height: 42px;
    width: 100%;
    border-radius: 10px;
  }
  .account-shell-skel-line--title {
    height: 32px;
    width: 140px;
    margin-bottom: 10px;
    border-radius: 8px;
  }
  .account-shell-skel-line--subtitle {
    height: 16px;
    width: min(420px, 70%);
    margin-bottom: 28px;
    border-radius: 8px;
  }
  .account-shell-skel-card {
    background: #fff;
    border: 1px solid #d0deff;
    border-radius: 16px;
    padding: 28px;
    box-shadow: 0 4px 18px rgba(10, 40, 120, 0.06);
  }
  .account-shell-skel-line--hero {
    height: 88px;
    width: 100%;
    max-width: 320px;
    margin-bottom: 24px;
    border-radius: 12px;
  }
  .account-shell-skel-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 16px;
  }
  .account-shell-skel-field {
    height: 64px;
    border-radius: 10px;
  }
  .account-shell-skel-line--wide {
    height: 64px;
    width: 100%;
    border-radius: 10px;
  }
  @media (max-width: 700px) {
    .account-shell-skel-grid {
      grid-template-columns: 1fr;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .account-shell-skel {
      animation: none;
      background: #e6edf9;
    }
  }
  .account-shell-sidebar {
    grid-area: sidebar;
    background: #fff;
    border-right: 1px solid #d0deff;
    padding: 24px 18px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    position: sticky;
    top: var(--market-nav-height);
    height: calc(100vh - var(--market-nav-height));
    overflow-y: auto;
  }
  .account-shell-profile-card {
    text-align: center;
    padding-bottom: 18px;
    border-bottom: 1px solid #edf2ff;
  }
  .account-shell--admin .account-shell-profile-card {
    border-bottom: none;
    padding-bottom: 0;
  }
  .account-shell-avatar {
    width: 72px;
    height: 72px;
    margin: 0 auto 12px;
    border-radius: 50%;
    background: linear-gradient(145deg, #0b47b8, #1a5fd4);
    color: #fff;
    font-size: 22px;
    font-weight: 700;
    line-height: 1;
    display: grid;
    place-items: center;
    text-align: center;
    box-shadow: 0 8px 20px rgba(11, 71, 184, 0.25);
  }
  .account-shell-avatar-img {
    margin: 0 auto 12px;
    display: block;
    box-shadow: 0 8px 20px rgba(11, 71, 184, 0.25);
  }
  .account-shell-avatar-img.profile-avatar--initials {
    font-size: 22px;
    display: grid;
    place-items: center;
    text-align: center;
    line-height: 1;
  }
  .account-shell-name {
    margin: 0 0 4px;
    font-size: 17px;
    font-weight: 700;
    color: #051c4a;
    word-break: break-word;
  }
  .account-shell-email {
    margin: 0;
    font-size: 13px;
    color: #6a84b0;
    word-break: break-all;
  }
  .account-shell-meta {
    margin: 8px 0 0;
    font-size: 12px;
    color: #4a6490;
    line-height: 1.4;
  }
  .account-shell-nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }
  .account-shell-nav-item,
  .account-shell-nav-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 12px;
    position: relative;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    color: #1a3566;
    text-decoration: none;
    transition: background 0.15s ease, color 0.15s ease;
    width: 100%;
    border: none;
    background: transparent;
    font-family: inherit;
    cursor: pointer;
    text-align: left;
  }
  .account-shell-nav-item:hover,
  .account-shell-nav-btn:hover {
    background: #eef4ff;
    color: #0b47b8;
  }
  .account-shell-nav-item.is-active,
  .account-shell-nav-btn.is-active {
    background: #eef4ff;
    color: #0b47b8;
    box-shadow: inset 3px 0 0 #0b47b8;
  }
  .account-shell-nav-label {
    flex: 1;
    min-width: 0;
  }
  .account-shell-nav-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-left: auto;
    flex-shrink: 0;
    background: #fffbeb;
    color: #92400e;
    border: 1px solid #fde68a;
    border-radius: 999px;
    padding: 2px 9px;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.2;
  }
  .account-shell-nav-badge-dot {
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: #f59e0b;
    animation: accountNavBadgePulse 1.4s ease-in-out infinite;
  }
  @keyframes accountNavBadgePulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(0.85);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .account-shell-nav-badge-dot {
      animation: none;
    }
  }
  .account-shell-logout {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 11px 14px;
    border: 1px solid #fecaca;
    border-radius: 10px;
    background: #fff;
    color: #dc2626;
    font-size: 14px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
  }
  .account-shell-logout:hover {
    background: #ef4444;
    color: #fff;
  }
  .account-shell-main {
    grid-area: main;
    min-width: 0;
    width: 100%;
    max-width: 100%;
    padding: 32px 40px 48px;
    overflow-x: clip;
  }
  .account-shell-backdrop {
    display: none;
  }
  .account-shell-mobile-bar {
    display: none;
  }
  @media (max-width: 900px) {
    .account-shell {
      display: block;
      min-height: calc(100dvh - var(--market-nav-height));
    }
    .account-shell--admin {
      min-height: 100dvh;
    }
    .account-shell-mobile-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 -20px 16px;
      padding: 12px 20px;
      background: #ffffff;
      border-bottom: 1px solid #d0deff;
      position: sticky;
      top: 0;
      z-index: 2;
    }
    .account-shell:not(.account-shell--admin) .account-shell-mobile-bar {
      top: 0;
    }
    .account-shell--admin .account-shell-mobile-bar {
      margin: 0 -12px 16px;
      padding: 12px 12px;
    }
    .account-shell--admin .account-shell-main {
      padding: 0 12px 32px;
    }
    .account-shell-menu-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      border: 1px solid #c9dcff;
      border-radius: 10px;
      background: #fff;
      color: #0b47b8;
      cursor: pointer;
      flex-shrink: 0;
      transition: background 0.15s ease, border-color 0.15s ease;
    }
    .account-shell-menu-btn:hover {
      background: #f7faff;
      border-color: #0b47b8;
    }
    .account-shell-mobile-title {
      font-size: 16px;
      font-weight: 700;
      color: #051c4a;
    }
    .account-shell-backdrop {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 54;
      border: none;
      padding: 0;
      background: rgba(5, 28, 74, 0.45);
      backdrop-filter: blur(2px);
      cursor: pointer;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: opacity 0.28s ease, visibility 0.28s ease;
    }
    .account-shell.is-menu-open .account-shell-backdrop {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }
    .account-shell-sidebar {
      display: flex;
      position: fixed;
      top: 0;
      left: 0;
      z-index: 55;
      width: min(300px, 88vw);
      height: 100dvh;
      padding-top: max(24px, env(safe-area-inset-top, 0px));
      border-right: 1px solid #d0deff;
      border-bottom: none;
      transform: translateX(-105%);
      visibility: hidden;
      pointer-events: none;
      transition:
        transform 0.32s cubic-bezier(0.32, 0.72, 0, 1),
        visibility 0.32s ease,
        box-shadow 0.32s ease;
      box-shadow: none;
      overflow-y: auto;
    }
    .account-shell.is-menu-open .account-shell-sidebar {
      transform: translateX(0);
      visibility: visible;
      pointer-events: auto;
      box-shadow: 8px 0 32px rgba(5, 28, 74, 0.18);
    }
    @media (prefers-reduced-motion: reduce) {
      .account-shell-backdrop,
      .account-shell-sidebar {
        transition: none;
      }
    }
    .account-shell-nav {
      flex-direction: column;
      flex-wrap: nowrap;
    }
    .account-shell-nav-btn,
    .account-shell-nav-item {
      flex: none;
      min-width: 0;
      width: 100%;
    }
    .account-shell-logout {
      margin-top: auto;
      width: 100%;
    }
    .account-shell-main {
      padding: 0 20px 40px;
      overflow-x: visible;
    }
    .account-shell-profile-card {
      text-align: center;
      display: block;
      padding-bottom: 18px;
    }
    .account-shell--admin .account-shell-profile-card {
      border-bottom: none;
      padding-bottom: 0;
    }
    .account-shell-avatar,
    .account-shell-avatar-img {
      width: 72px;
      height: 72px;
      margin: 0 auto 12px;
      grid-row: auto;
    }
    .account-shell-avatar-img.profile-avatar--initials {
      font-size: 22px;
      display: grid;
      place-items: center;
      text-align: center;
      line-height: 1;
    }
    .account-shell-name,
    .account-shell-email,
    .account-shell-meta {
      grid-column: auto;
      align-self: auto;
    }
    .account-shell-brand-logo {
      width: 112px;
    }
  }
  @media (max-width: 540px) {
    .account-shell-sidebar {
      padding: max(20px, env(safe-area-inset-top, 0px)) 16px 20px;
    }
    .account-shell-main {
      padding: 0 16px 36px;
    }
    .account-shell-mobile-bar {
      margin: 0 -16px 16px;
      padding: 10px 16px;
    }
    .account-shell--admin .account-shell-mobile-bar {
      margin: 0 -8px 16px;
      padding: 10px 8px;
    }
    .account-shell--admin .account-shell-main {
      padding: 0 8px 28px;
    }
    .account-shell-nav-btn,
    .account-shell-nav-item {
      font-size: 13px;
      padding: 10px 12px;
    }
  }
  .account-shell--admin {
    min-height: 100vh;
  }
  @media (min-width: 901px) {
    .account-shell--admin .account-shell-sidebar {
      top: 0;
      height: 100vh;
    }
  }
  .account-shell-brand {
    display: flex;
    justify-content: center;
    align-items: center;
    padding-bottom: 18px;
    margin-bottom: 4px;
    border-bottom: 1px solid #edf2ff;
  }
  .account-shell-brand-link {
    display: inline-flex;
    line-height: 0;
  }
  .account-shell-brand-logo {
    width: 132px;
    height: auto;
    object-fit: contain;
  }
`;
