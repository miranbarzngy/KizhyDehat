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

// Dynamic metadata generation
export async function generateMetadata(): Promise<Metadata> {
  try {
    // Check if Supabase environment variables are available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('🔧 Layout metadata generation - Environment variables:', {
      supabaseUrl: supabaseUrl ? '***' + supabaseUrl.slice(-10) : 'undefined',
      supabaseServiceKey: supabaseServiceKey ? '***present***' : 'undefined'
    })

    // If environment variables are missing, return fallback metadata
    if (!supabaseUrl || !supabaseServiceKey || supabaseUrl === 'your_supabase_url_here') {
      console.warn('⚠️ Supabase environment variables not configured, using fallback metadata')
      return {
        title: "سیستمی فرۆشتن",
        description: "Professional Point of Sale system for Kurdish businesses",
        manifest: "/api/manifest",
        icons: {
          icon: "/icon-192x192.png",
          apple: "/icon-512x512.png",
        },
        appleWebApp: {
          capable: true,
          statusBarStyle: "default",
          title: "سیستمی فرۆشتن",
        },
        formatDetection: {
          telephone: false,
        },
        openGraph: {
          type: "website",
          siteName: "سیستمی فرۆشتن",
          title: "سیستمی فرۆشتن",
          description: "Professional Point of Sale system for Kurdish businesses",
        },
        twitter: {
          card: "summary",
          title: "سیستمی فرۆشتن",
          description: "Professional Point of Sale system for Kurdish businesses",
        },
      }
    }

    // Import Supabase client for server-side usage
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch shop settings
    const { data: shopSettings } = await supabase
      .from('shop_settings')
      .select('shopname, icon')
      .single()

    const shopName = shopSettings?.shopname || 'سیستمی فرۆشتن'
    const shopIcon = shopSettings?.icon

    return {
      title: shopName,
      description: `Professional Point of Sale system - ${shopName}`,
      manifest: "/api/manifest",
      icons: shopIcon ? {
        icon: shopIcon,
        apple: shopIcon,
      } : {
        icon: "/icon-192x192.png",
        apple: "/icon-512x512.png",
      },
      appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: shopName,
      },
      formatDetection: {
        telephone: false,
      },
      openGraph: {
        type: "website",
        siteName: shopName,
        title: shopName,
        description: `Professional Point of Sale system - ${shopName}`,
      },
      twitter: {
        card: "summary",
        title: shopName,
        description: `Professional Point of Sale system - ${shopName}`,
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)

    // Fallback metadata
    return {
      title: "سیستمی فرۆشتن",
      description: "Professional Point of Sale system for Kurdish businesses",
      manifest: "/api/manifest",
      icons: {
        icon: "/icon-192x192.png",
        apple: "/icon-512x512.png",
      },
      appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "سیستمی فرۆشتن",
      },
      formatDetection: {
        telephone: false,
      },
      openGraph: {
        type: "website",
        siteName: "سیستمی فرۆشتن",
        title: "سیستمی فرۆشتن",
        description: "Professional Point of Sale system for Kurdish businesses",
      },
      twitter: {
        card: "summary",
        title: "سیستمی فرۆشتن",
        description: "Professional Point of Sale system for Kurdish businesses",
      },
    }
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ku" dir="rtl" translate="no">
      <head>
        <meta name="google" content="notranslate" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="POS Kurdish" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#1e40af" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512x512.png" />
      </head>
      <body className={`${uniSalar.variable} antialiased font-medium font-uni-salar`} suppressHydrationWarning>
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
