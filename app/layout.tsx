import type React from "react"
import type { Metadata } from "next"
import { Noto_Sans_JP, Noto_Serif_JP } from 'next/font/google'
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const notoSans = Noto_Sans_JP({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-sans"
})

const notoSerif = Noto_Serif_JP({ 
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-serif"
})

export const metadata: Metadata = {
  title: "innbest.ai - 東京飯店投資與 AI 管理系統",
  description:
    "東京飯店投資平台，結合 AI 智能管理系統。200+ 客房管理實績，proven RevPAR 成長，次世代物業管理系統。",
  generator: "v0.app",
  keywords: ["東京飯店投資", "AI 物業管理", "飯店投資", "收益管理", "不動產投資"],
  openGraph: {
    title: "innbest.ai - 東京飯店投資，AI 賦能",
    description:
      "200+ 客房實績，獨家場外物業，AI 定價引擎，驅動 RevPAR 直接成長。",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-TW" className="light" suppressHydrationWarning>
      <body className={`${notoSans.variable} ${notoSerif.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
