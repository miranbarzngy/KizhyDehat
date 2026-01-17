import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ThemeToggle from "@/components/ThemeToggle";
import localFont from 'next/font/local'
import "./globals.css";

const uniSalar = localFont({
  src: [
    {
      path: '../fonts/UniSalar_F_007.otf',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-uni-salar',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "POS PWA - Kurdish POS System",
  description: "Professional Point of Sale system for Kurdish businesses",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "POS Kurdish",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "POS Kurdish System",
    title: "POS Kurdish System",
    description: "Professional Point of Sale system for Kurdish businesses",
  },
  twitter: {
    card: "summary",
    title: "POS Kurdish System",
    description: "Professional Point of Sale system for Kurdish businesses",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ku" dir="rtl">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="POS Kurdish" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#1e40af" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512x512.png" />
      </head>
      <body className={`${uniSalar.variable} antialiased font-medium font-uni-salar`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <ThemeToggle />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
