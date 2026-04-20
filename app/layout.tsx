import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/shell/AppShell";

export const metadata: Metadata = {
  title: "INSTINCT — Hughes Technologies",
  description:
    "INSTINCT by Hughes Technologies. Premium desktop DAW. Architexure plugin ecosystem. Mixing with Michael.",
  icons: {
    icon: "/favicon.svg"
  },
  manifest: "/manifest.webmanifest",
  themeColor: "#FFFFFF"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
