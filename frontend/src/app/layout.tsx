import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import ImpersonationBanner from "@/components/layout/ImpersonationBanner";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const viewport: Viewport = {
  themeColor: "#ea580c",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Cafe POS & QR Ordering System",
  description: "Sistem Manajemen Kasir, Dapur, Waiter dan QR Table Ordering",
  manifest: "/manifest.webmanifest",
  metadataBase: new URL("https://cafe.abstech.web.id"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cafe POS",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="ard" href="/.well-known/ai-catalog.json" type="application/json" />
        <link rel="help" href="/llms.txt" type="text/markdown" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900 min-h-screen`}>
        <AuthProvider>
          <CartProvider>
            <ImpersonationBanner />
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
