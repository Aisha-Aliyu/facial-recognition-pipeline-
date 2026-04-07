import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import ErudaProvider from "@/components/ErudaProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "FaceVault — Facial Recognition Platform",
  description: "Production-grade facial recognition pipeline powered by deep learning.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" data-scroll-behavior="smooth">
        <body>
          {children}
          <ErudaProvider />
        </body>
      </html>
    </ClerkProvider>
  );
}
