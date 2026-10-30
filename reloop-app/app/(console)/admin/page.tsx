import type { Metadata } from "next";
import { AdminView } from "@/components/admin/admin-view";

export const metadata: Metadata = { title: "Admin desk" };

export default function Page() {
  return <AdminView />;
}
