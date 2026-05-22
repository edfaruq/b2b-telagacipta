import type { ReactNode } from "react";
import { BuyerAccountShell } from "@/components/buyer/BuyerAccountShell";

export default function BuyerAccountLayout({ children }: { children: ReactNode }) {
  return <BuyerAccountShell>{children}</BuyerAccountShell>;
}
