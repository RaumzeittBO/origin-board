import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { WorkspaceProvider } from "@/context/workspace-context";
import "./globals.css";
import "./login.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: { default: "ORIGIN Hub", template: "%s · ORIGIN Hub" },
  description: "Espacio de trabajo para convertir ideas en productos.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body className={`${inter.variable} ${manrope.variable}`}><WorkspaceProvider>{children}</WorkspaceProvider></body></html>;
}
