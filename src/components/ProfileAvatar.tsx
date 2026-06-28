import { profileInitials } from "@/lib/profile-initials";

type Props = {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
};

export function ProfileAvatar({ name, src, size = 40, className = "" }: Props) {
  const trimmed = src?.trim();
  const initials = profileInitials(name);

  if (trimmed) {
    return (
      <img
        src={trimmed}
        alt=""
        width={size}
        height={size}
        className={`profile-avatar profile-avatar--photo ${className}`.trim()}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className={`profile-avatar profile-avatar--initials ${className}`.trim()}
      style={{ width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.36)) }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
