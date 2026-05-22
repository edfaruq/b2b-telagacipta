type Props = {
  count: number;
  label?: string;
};

export function NavCountBadge({ count, label }: Props) {
  if (count <= 0) return null;

  const display = count > 99 ? "99+" : String(count);

  return (
    <span
      className="account-shell-nav-badge"
      aria-label={label ?? `${display} items need attention`}
    >
      <span className="account-shell-nav-badge-dot" aria-hidden />
      {display}
    </span>
  );
}
