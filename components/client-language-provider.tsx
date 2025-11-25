"use client"

import { type ReactNode } from "react"
import { LanguageProvider } from "@/contexts/language-context"
import { type Locale } from "@/lib/i18n"

export function ClientLanguageProvider({
  children,
  locale,
}: {
  children: ReactNode
  locale: Locale
}) {
  return <LanguageProvider initialLocale={locale}>{children}</LanguageProvider>
}
