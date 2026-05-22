import { accountShellStyles } from "@/components/account/accountShellStyles";

type Props = {
  navItemCount?: number;
  showBrand?: boolean;
  adminLayout?: boolean;
};

export function AccountShellSkeleton({
  navItemCount = 3,
  showBrand = false,
  adminLayout = false,
}: Props) {
  return (
    <div
      className={`account-shell${adminLayout ? " account-shell--admin" : ""}`}
      aria-busy="true"
      aria-label="Loading account"
    >
      <aside className="account-shell-sidebar">
        {showBrand ? (
          <div className="account-shell-brand">
            <div
              className="account-shell-skel"
              style={{ width: 132, height: 40, margin: "0 auto", borderRadius: 8 }}
            />
          </div>
        ) : null}
        <div className="account-shell-profile-card">
          <div className="account-shell-skel account-shell-skel-avatar" />
          <div className="account-shell-skel account-shell-skel-line account-shell-skel-line--name" />
          <div className="account-shell-skel account-shell-skel-line account-shell-skel-line--email" />
          <div className="account-shell-skel account-shell-skel-line account-shell-skel-line--meta" />
        </div>

        <div className="account-shell-nav">
          {Array.from({ length: navItemCount }).map((_, i) => (
            <div key={i} className="account-shell-skel account-shell-skel-nav" />
          ))}
        </div>

        <div className="account-shell-skel account-shell-skel-logout" />
      </aside>

      <div className="account-shell-main">
        <div className="account-shell-skel account-shell-skel-line account-shell-skel-line--title" />
        <div className="account-shell-skel account-shell-skel-line account-shell-skel-line--subtitle" />
        <div className="account-shell-skel account-shell-skel-card">
          <div className="account-shell-skel account-shell-skel-line account-shell-skel-line--hero" />
          <div className="account-shell-skel-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="account-shell-skel account-shell-skel-field" />
            ))}
          </div>
          <div className="account-shell-skel account-shell-skel-line account-shell-skel-line--wide" />
        </div>
      </div>

      <style>{accountShellStyles}</style>
    </div>
  );
}
