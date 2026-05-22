import { redirect } from "next/navigation";

/** Legacy route merged into /admin with menu state — redirect keeps bookmarks working. */
export default function AdminAddProductRedirectPage() {
  redirect("/admin");
}
