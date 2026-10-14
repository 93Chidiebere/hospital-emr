import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { EMRProvider } from "@/context/EMRContext";
import { FormA11yEnhancer } from "@/components/shared/FormA11yEnhancer";

export const metadata: Metadata = {
  title: "Trinity Point Hospital — Clinical Data Flow Simulator",
  description:
    "Clinical/Hospital Data Flow simulator for university undergraduates and healthcare simulation training.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
          <FormA11yEnhancer />
        </AuthProvider>
      </body>
    </html>
  );
}

