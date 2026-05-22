import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, parseSessionValue } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const session = parseSessionValue(cookieStore.get(AUTH_COOKIE_NAME)?.value);
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  return <>{children}</>;
}
