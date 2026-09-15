import { AppShell } from "@/components/app-shell";
import "./dashboard/dashboard.css";
import "./hub-pages.css";

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
