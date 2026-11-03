import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinPilot — AI Financial Intelligence",
  description: "Your money. Your intelligence. Your control. AI-powered personal finance management and intelligence platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#070a12] text-slate-100 antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
        {children}
      </body>
    </html>
  );
}
