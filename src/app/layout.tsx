import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/stores/app-context";

export const metadata: Metadata = {
  title: "Desh & Rey — Our Private Sanctuary",
  description: "A private digital home for Desh & Rey to preserve conversations, memories, songs, trips, and relationship milestones.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#050505] text-[#E5E5E5]">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
