import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk", display: "swap" });

export const metadata: Metadata = {
  title: "errand — chat to buy anything in Calabar",
  description: "Tell us what you need. We find trusted Calabar vendors.",
};

// Colours the phone's top bar to match the dark page.
export const viewport: Viewport = { themeColor: "#0E0F12" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={grotesk.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}