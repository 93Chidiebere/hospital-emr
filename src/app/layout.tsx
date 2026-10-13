import type { Metadata } from "next";
import "./globals.css";
import { EMRProvider } from "@/context/EMRContext";

export const metadata: Metadata = {
  title: "Trinity Point Hospital — EMR Clinical Workflow Simulator",
  description:
    "An editorial, human-centered Electronic Medical Record (EMR) simulator designed for Nursing and Health Faculty students to master clinical data flow and hospital department workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream text-charcoal flex flex-col font-sans">
        <EMRProvider>{children}</EMRProvider>
      </body>
    </html>
  );
}
