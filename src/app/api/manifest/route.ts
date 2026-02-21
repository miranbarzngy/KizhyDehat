import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Create Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: NextRequest) {
  try {
    // Fetch shop settings
    const { data: shopSettings, error } = await supabaseAdmin
      .from('shop_settings')
      .select('*')
      .single()

    const shopName = shopSettings?.shopname || 'کیژی دێهات'
    const shopIcon = shopSettings?.icon

    // Base manifest structure
    const manifest = {
      name: `${shopName} - کیژی دێهات`,
      short_name: shopName,
      description: `Professional Point of Sale system - ${shopName}`,
      start_url: "/",
      display: "standalone",
      background_color: "#0f172a",
      theme_color: "#1e40af",
      orientation: "any",
      categories: ["business", "productivity", "shopping"],
      lang: "ku",
      dir: "rtl",
      prefer_related_applications: false,
      icons: [
        {
          src: shopIcon || "/icon-192x192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: shopIcon || "/icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: shopIcon || "/icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
          form_factor: "wide"
        }
      ],
      shortcuts: [
        {
          name: "تۆمارکردنی فرۆشتن",
          short_name: "فرۆشتن",
          description: "Create new sales order",
          url: "/dashboard/sales",
          icons: [{ src: shopIcon || "/icon-192x192.png", sizes: "192x192" }]
        },
        {
          name: "زیادکردنی کاڵا",
          short_name: "کاڵا",
          description: "Add new product",
          url: "/dashboard/inventory",
          icons: [{ src: shopIcon || "/icon-192x192.png", sizes: "192x192" }]
        },
        {
          name: "خەرجی نوێ",
          short_name: "خەرجی",
          description: "Add new expense",
          url: "/dashboard/expenses",
          icons: [{ src: shopIcon || "/icon-192x192.png", sizes: "192x192" }]
        }
      ]
    }

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600'
      }
    })

  } catch (error) {
    console.error('Manifest generation error:', error)

    // Fallback manifest
    const fallbackManifest = {
      name: "سیستیمی فرۆشتن",
      short_name: "کیژی دێهات",
      description: "Professional Point of Sale system for Kurdish businesses Powered by Click Group",
      start_url: "/",
      display: "standalone",
      background_color: "#0f172a",
      theme_color: "#1e40af",
      orientation: "any",
      categories: ["business", "productivity", "shopping"],
      lang: "ku",
      dir: "rtl",
      prefer_related_applications: false,
      icons: [
        {
          src: "/icon-192x192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: "/icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ],
      shortcuts: [
        {
          name: "تۆمارکردنی فرۆشتن",
          short_name: "فرۆشتن",
          description: "Create new sales order",
          url: "/dashboard/sales",
          icons: [{ src: "/icon-192x192.png", sizes: "192x192" }]
        }
      ]
    }

    return NextResponse.json(fallbackManifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600'
      }
    })
  }
}
