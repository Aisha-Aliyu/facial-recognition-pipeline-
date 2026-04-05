import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script";
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
      <html lang="en">
        <body>
          {children}
          {process.env.NODE_ENV === "development" && (
            <>
              <Script
                src="https://cdn.jsdelivr.net/npm/eruda@3.4.1/eruda.min.js"
                strategy="afterInteractive"
              />
              <Script id="eruda-init" strategy="afterInteractive">
                {`if (typeof eruda !== 'undefined') eruda.init();`}
              </Script>
            </>
          )}
        </body>
      </html>
    </ClerkProvider>
  );
}
