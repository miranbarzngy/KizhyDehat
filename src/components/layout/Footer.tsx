'use client'

import { Phone } from 'lucide-react'

export default function Footer() {
  return (
    <footer 
      className="relative overflow-hidden sticky bottom-0 z-50"
      style={{ 
        background: 'var(--theme-background)',
        fontFamily: 'var(--font-uni-salar)'
      }}
    >
      {/* Footer Glow Effect - Reduced */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-16 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center bottom, rgba(56, 189, 248, 0.06) 0%, transparent 70%)'
        }}
      />

      {/* Main Footer Content - Centered */}
      <div className="relative bg-black/20 backdrop-blur-md border-t border-white/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Centered Content - Very compact */}
          <div className="flex flex-col items-center justify-center py-1 gap-0.5">
           
            {/* Copyright - Larger */}
            <div className="text-slate-300 text-xs sm:text-sm">
                هەموو مافەکان پارێزراون | میران بەرزنجی <span lang="en" dir="ltr">© 2026</span> 
            </div>

            {/* Subtext */}
            <div className="text-slate-500 text-[9px] sm:text-[10px]">
              Powered by Click Group | Innovation & Excellence
            </div>

            {/* Phone Number */}
            <div className="flex items-center gap-1 text-slate-300 text-[10px] sm:text-xs">
              <Phone className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-pulse text-cyan-400" />
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
        </div>
      </div>
    </footer>
  )
}
