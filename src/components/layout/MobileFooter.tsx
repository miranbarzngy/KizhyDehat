'use client'

import { Phone } from 'lucide-react'

export default function MobileFooter() {
  return (
    <footer 
      className="md:hidden relative overflow-hidden z-0 py-2 px-2"
      style={{ 
        background: 'var(--theme-background)',
        fontFamily: 'var(--font-uni-salar)'
      }}
    >
      {/* Main Footer Content - Very compact for mobile */}
      <div className="flex flex-col items-center justify-center gap-0.5">
        {/* Copyright - Very small */}
        <div className="text-slate-400 text-[9px]">
            هەموو مافەکان پارێزراون © 2026
        </div>

        {/* Phone Number */}
        <div className="flex items-center gap-1 text-slate-400 text-[9px]">
          <Phone className="w-2 h-2 text-cyan-400" />
          <a 
            href="tel:07701466787" 
            className="hover:text-cyan-400 transition-all duration-300"
            lang="en"
            dir="ltr"
          >
            07701466787
          </a>
        </div>
      </div>
    </footer>
  )
}
