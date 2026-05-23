type DisplayProps = {
  value: number;
  max?: number;
  size?: number;
  className?: string;
};

export function StarRatingDisplay({ value, max = 5, size = 18, className }: DisplayProps) {
  const safe = Math.max(0, Math.min(max, Math.round(value)));
  return (
    <span
      className={className}
      role="img"
      aria-label={`${safe} out of ${max} stars`}
      style={{ display: "inline-flex", gap: 2, lineHeight: 1 }}
    >
      {Array.from({ length: max }, (_, i) => {
        const filled = i < safe;
        return (
          <svg
            key={i}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            aria-hidden
            style={{ flexShrink: 0 }}
          >
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"
              fill={filled ? "#f59e0b" : "none"}
              stroke={filled ? "#d97706" : "#cbd5e1"}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        );
      })}
    </span>
  );
}

type InputProps = {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  size?: number;
};

export function StarRatingInput({ value, onChange, disabled = false, size = 32 }: InputProps) {
  return (
    <div
      className="star-rating-input"
      role="radiogroup"
      aria-label="Rate your order"
      style={{ display: "flex", gap: 6, justifyContent: "center" }}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            disabled={disabled}
            className="star-rating-input__btn"
            onClick={() => onChange(star)}
            style={{
              border: "none",
              background: "transparent",
              padding: 4,
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.5 : 1,
            }}
          >
            <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"
                fill={active ? "#f59e0b" : "none"}
                stroke={active ? "#d97706" : "#94a3b8"}
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
