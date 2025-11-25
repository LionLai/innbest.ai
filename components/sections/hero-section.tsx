"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from 'lucide-react'
import { useLanguage } from "@/contexts/language-context"

export function HeroSection() {
  const { t } = useLanguage()

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full max-w-7xl mx-auto">
          
          {/* 東京鐵塔線稿 - 左邊 */}
          <div className="absolute left-[8%] top-1/2 -translate-y-1/2 w-[200px] h-[350px]">
            <svg viewBox="0 0 200 300" className="w-full h-full stroke-foreground opacity-25" fill="none" strokeWidth="1.5">
              {/* 塔頂 */}
              <path d="M 100 30 L 100 60" strokeWidth="2" />
              <circle cx="100" cy="28" r="4" fill="currentColor" />
              <path d="M 95 60 L 105 60" />
              
              {/* 上層觀景台 */}
              <path d="M 88 60 L 112 60 L 108 80 L 92 80 Z" />
              <path d="M 92 80 L 108 80" strokeWidth="2" />
              <path d="M 93 70 L 107 70" />
              
              {/* 主塔身 */}
              <path d="M 80 80 L 60 180 L 80 180 Z" strokeWidth="2" />
              <path d="M 120 80 L 140 180 L 120 180 Z" strokeWidth="2" />
              
              {/* 中層結構線 */}
              <path d="M 70 130 L 130 130" strokeWidth="2" />
              <path d="M 72 140 L 128 140" />
              <path d="M 74 150 L 126 150" />
              <path d="M 76 160 L 124 160" />
              <path d="M 78 170 L 122 170" />
              
              {/* 下層觀景台 */}
              <path d="M 60 180 L 140 180 L 132 205 L 68 205 Z" strokeWidth="2" />
              <path d="M 68 205 L 132 205" />
              <path d="M 70 192 L 130 192" />
              
              {/* 塔基 */}
              <path d="M 55 205 L 50 240 L 150 240 L 145 205 Z" strokeWidth="2" />
              <path d="M 52 225 L 148 225" />
              
              {/* 交叉支撐結構 */}
              <path d="M 80 90 L 95 130" strokeDasharray="3,3" />
              <path d="M 120 90 L 105 130" strokeDasharray="3,3" />
              <path d="M 85 110 L 115 110" strokeDasharray="2,2" />
              <path d="M 75 145 L 125 145" strokeDasharray="2,2" />
              
              {/* 3D 深度線 */}
              <path d="M 108 80 L 115 85 L 138 180" opacity="0.6" strokeWidth="1" />
              <path d="M 132 205 L 143 210 L 148 235" opacity="0.6" strokeWidth="1" />
            </svg>
          </div>

          {/* 富士山線稿 - 中間偏右 */}
          <div className="absolute left-[55%] top-1/2 -translate-y-1/2 -translate-x-1/2 w-[420px] h-[320px]">
            <svg viewBox="0 0 300 220" className="w-full h-full stroke-accent opacity-30" fill="none" strokeWidth="1.8">
              {/* 富士山主體 */}
              <path d="M 150 40 L 230 160 L 70 160 Z" strokeWidth="2.5" />
              <path d="M 150 40 L 230 160 L 220 160 L 150 55 Z" strokeWidth="2" />
              <path d="M 150 40 L 70 160 L 80 160 L 150 55 Z" strokeWidth="2" />
              
              {/* 雪頂 */}
              <path d="M 150 40 L 165 65 L 150 75 L 135 65 Z" fill="currentColor" fillOpacity="0.25" strokeWidth="2" />
              <path d="M 150 40 L 160 58 L 150 65 L 140 58 Z" />
              
              {/* 山腰層次線 */}
              <path d="M 100 110 L 200 110" strokeDasharray="4,4" opacity="0.7" />
              <path d="M 85 135 L 215 135" strokeDasharray="4,4" opacity="0.7" />
              <path d="M 75 155 L 225 155" strokeDasharray="4,4" opacity="0.7" />
              
              {/* 山坡細節 */}
              <path d="M 120 90 L 115 110" opacity="0.6" />
              <path d="M 180 90 L 185 110" opacity="0.6" />
              <path d="M 105 125 L 100 145" opacity="0.6" />
              <path d="M 195 125 L 200 145" opacity="0.6" />
              
              {/* 基座 */}
              <path d="M 60 160 L 240 160 L 250 180 L 50 180 Z" strokeWidth="2.5" />
              <path d="M 50 180 L 250 180" strokeWidth="2" />
              
              {/* 3D 深度線 */}
              <path d="M 80 160 L 80 180" strokeWidth="1.5" opacity="0.7" />
              <path d="M 110 160 L 110 180" strokeWidth="1.5" opacity="0.7" />
              <path d="M 150 160 L 150 180" strokeWidth="1.5" opacity="0.7" />
              <path d="M 190 160 L 190 180" strokeWidth="1.5" opacity="0.7" />
              <path d="M 220 160 L 220 180" strokeWidth="1.5" opacity="0.7" />
              
              {/* 遠景層次 */}
              <path d="M 70 160 L 85 140 L 100 160" opacity="0.4" strokeWidth="1.2" />
              <path d="M 200 160 L 215 140 L 230 160" opacity="0.4" strokeWidth="1.2" />
            </svg>
          </div>

          {/* 淺草雷門線稿 - 右邊 */}
          <div className="absolute right-[8%] top-1/2 -translate-y-1/2 w-[240px] h-[320px]">
            <svg viewBox="0 0 200 260" className="w-full h-full stroke-accent opacity-25" fill="none" strokeWidth="1.5">
              {/* 屋頂 */}
              <path d="M 35 60 L 50 45 L 150 45 L 165 60 Z" strokeWidth="2" />
              <path d="M 50 45 L 45 38 L 155 38 L 150 45" />
              <path d="M 40 55 L 160 55" />
              <path d="M 38 62 L 162 62" strokeWidth="2" />
              
              {/* 燈籠上框 */}
              <path d="M 60 75 Q 100 80 140 75" strokeWidth="2.5" />
              <ellipse cx="100" cy="75" rx="42" ry="8" opacity="0.5" />
              
              {/* 燈籠主體 */}
              <ellipse cx="100" cy="130" rx="40" ry="50" strokeWidth="2.5" />
              <ellipse cx="100" cy="130" rx="44" ry="54" />
              
              {/* 燈籠下框 */}
              <path d="M 60 185 Q 100 180 140 185" strokeWidth="2.5" />
              <ellipse cx="100" cy="185" rx="42" ry="8" opacity="0.5" />
              
              {/* 雷門字樣區域 */}
              <rect x="78" y="115" width="44" height="30" fill="currentColor" fillOpacity="0.2" strokeWidth="1.5" />
              <path d="M 82 120 L 118 120" strokeWidth="2" />
              <path d="M 82 140 L 118 140" strokeWidth="2" />
              
              {/* 垂直裝飾線 */}
              <path d="M 70 85 L 70 175" strokeWidth="1.2" />
              <path d="M 80 85 L 80 175" strokeWidth="1.2" />
              <path d="M 90 85 L 90 175" strokeWidth="1.2" />
              <path d="M 100 85 L 100 175" strokeWidth="2" />
              <path d="M 110 85 L 110 175" strokeWidth="1.2" />
              <path d="M 120 85 L 120 175" strokeWidth="1.2" />
              <path d="M 130 85 L 130 175" strokeWidth="1.2" />
              
              {/* 柱子 */}
              <path d="M 55 60 L 55 200 L 62 208 L 62 65 Z" strokeWidth="2" />
              <path d="M 145 60 L 145 200 L 138 208 L 138 65 Z" strokeWidth="2" />
              
              {/* 柱子裝飾 */}
              <path d="M 55 100 L 62 100" />
              <path d="M 55 140 L 62 140" />
              <path d="M 55 180 L 62 180" />
              <path d="M 145 100 L 138 100" />
              <path d="M 145 140 L 138 140" />
              <path d="M 145 180 L 138 180" />
              
              {/* 基座 */}
              <path d="M 45 200 L 155 200 L 165 220 L 35 220 Z" strokeWidth="2" />
              <path d="M 35 220 L 165 220" strokeWidth="2.5" />
              <path d="M 50 208 L 150 208" />
              
              {/* 裝飾流蘇 */}
              <path d="M 100 185 L 100 205" strokeWidth="2.5" />
              <circle cx="100" cy="208" r="4" fill="currentColor" fillOpacity="0.6" />
              <path d="M 80 190 L 80 202" strokeWidth="1.5" />
              <circle cx="80" cy="204" r="2.5" fill="currentColor" fillOpacity="0.5" />
              <path d="M 120 190 L 120 202" strokeWidth="1.5" />
              <circle cx="120" cy="204" r="2.5" fill="currentColor" fillOpacity="0.5" />
              
              {/* 3D 效果 */}
              <path d="M 138 65 L 145 68 L 145 200" opacity="0.6" strokeWidth="1" />
              <path d="M 138 185 L 153 190 L 163 218" opacity="0.6" strokeWidth="1" />
            </svg>
          </div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-32">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl">
            
            {/* 主標語 - 左側對齊 */}
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <h1 className="text-7xl md:text-9xl font-serif font-light tracking-wide text-foreground leading-[1.1]">
                人心之所嚮
              </h1>
              <div className="flex items-center gap-6">
                <div className="h-px w-20 bg-accent"></div>
                <div className="w-2 h-2 rotate-45 border border-accent"></div>
                <div className="h-px w-20 bg-accent"></div>
              </div>
              <h2 className="text-6xl md:text-8xl font-serif font-light tracking-wide text-accent leading-[1.1]">
                價值之所在
              </h2>
            </div>

            {/* 副標題 */}
            <p className="text-lg md:text-xl text-muted-foreground mt-12 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
              {t.hero.subtitle}
            </p>

            {/* CTA 按鈕 */}
            <div className="flex flex-col sm:flex-row gap-6 mt-16 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
              <Button 
                size="lg" 
                className="px-12 py-7 bg-accent hover:bg-accent/90 text-white group border-none text-base tracking-wide"
              >
                {t.hero.bookCall}
                <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="px-12 py-7 border border-foreground hover:bg-foreground hover:text-background transition-all text-base tracking-wide"
              >
                {t.hero.downloadDeck}
              </Button>
            </div>
          </div>

          {/* 關鍵數據網格 - 移至底部 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border max-w-4xl mt-24 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
            <div className="bg-background p-10 hover:bg-secondary/30 transition-all duration-300 group">
              <div className="text-5xl font-serif font-light text-foreground mb-3 group-hover:text-accent transition-colors">200<span className="text-2xl">+</span></div>
              <div className="text-xs text-muted-foreground tracking-[0.2em] uppercase">{t.hero.roomsManaged}</div>
            </div>
            <div className="bg-background p-10 hover:bg-secondary/30 transition-all duration-300 group">
              <div className="text-5xl font-serif font-light text-accent mb-3 group-hover:scale-105 transition-transform">12<span className="text-2xl">%</span></div>
              <div className="text-xs text-muted-foreground tracking-[0.2em] uppercase">{t.hero.adrUplift}</div>
            </div>
            <div className="bg-background p-10 hover:bg-secondary/30 transition-all duration-300 group">
              <div className="text-5xl font-serif font-light text-foreground mb-3 group-hover:text-accent transition-colors">87<span className="text-2xl">%</span></div>
              <div className="text-xs text-muted-foreground tracking-[0.2em] uppercase">{t.hero.avgOccupancy}</div>
            </div>
            <div className="bg-background p-10 hover:bg-secondary/30 transition-all duration-300 group">
              <div className="text-5xl font-serif font-light text-accent mb-3 group-hover:scale-105 transition-transform">+18<span className="text-2xl">%</span></div>
              <div className="text-xs text-muted-foreground tracking-[0.2em] uppercase">{t.hero.yoyRevpar}</div>
            </div>
          </div>

          {/* 裝飾元素 */}
          <div className="flex gap-3 mt-12 animate-in fade-in duration-1000 delay-700">
            <div className="w-1 h-1 bg-accent/40 rotate-45"></div>
            <div className="w-1 h-1 bg-accent/40 rotate-45"></div>
            <div className="w-1 h-1 bg-accent/40 rotate-45"></div>
          </div>
        </div>
      </div>

      {/* 底部裝飾線 */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
    </section>
  )
}
