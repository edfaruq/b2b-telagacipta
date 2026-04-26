import type { ReactNode } from "react";
import GlobalNavbar from "@/components/GlobalNavbar";

type BuyerLayoutProps = {
  children: ReactNode;
};

export default function BuyerLayout({ children }: BuyerLayoutProps) {
  return (
    <>
      <GlobalNavbar />
      {children}
    </>
  );
}
