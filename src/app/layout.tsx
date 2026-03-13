import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SDLC Platform - AI-Driven Product Documentation",
  description: "AI-powered enterprise SDLC documentation platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
