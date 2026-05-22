import type { CSSProperties } from "react";

/**
 * Banner gagal — selaras dengan `.top-alert.error` di halaman login/register.
 */
export const alertFailBanner: CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  background: "linear-gradient(180deg, #ef4444 0%, #dc2626 100%)",
  border: "1px solid #b91c1c",
  color: "#ffffff",
  fontSize: 14,
  fontWeight: 600,
  display: "flex",
  alignItems: "center",
  gap: 8,
  boxShadow: "0 4px 16px rgba(185, 28, 28, 0.45)",
};
