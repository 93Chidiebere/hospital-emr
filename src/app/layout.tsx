import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { EMRProvider } from "@/context/EMRContext";

export const metadata: Metadata = {
  title: "Trinity Point Hospital — Clinical Data Flow Simulator",
  description:
    "Clinical/Hospital Data Flow simulator for university undergraduates and healthcare simulation training.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream text-charcoal flex flex-col font-sans">
        <AuthProvider>
          <EMRProvider>{children}</EMRProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

