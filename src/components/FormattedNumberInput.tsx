"use client";

import type { CSSProperties, InputHTMLAttributes } from "react";
import { formatAmountOnInput, formatThousandsOnInput } from "@/lib/number-input";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  mode?: "integer" | "amount";
  style?: CSSProperties;
};

export function FormattedNumberInput({
  value,
  onChange,
  mode = "integer",
  style,
  inputMode,
  ...rest
}: Props) {
  return (
    <input
      type="text"
      inputMode={inputMode ?? (mode === "amount" ? "decimal" : "numeric")}
      value={value}
      onChange={(e) => {
        const formatted =
          mode === "amount"
            ? formatAmountOnInput(e.target.value)
            : formatThousandsOnInput(e.target.value);
        onChange(formatted);
      }}
      style={style}
      {...rest}
    />
  );
}
