"use client"

import { Building2 } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-6 h-6 text-primary" />
                <span className="text-xl font-bold">innbest.ai</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{t.footer.tagline}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">{t.footer.product}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    {t.footer.aiPms}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    {t.footer.investment}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">{t.footer.company}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    {t.footer.about}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    {t.footer.careers}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    {t.footer.contact}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">{t.footer.rights}</p>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <a href="#" className="hover:text-foreground transition-colors">
                  {t.footer.privacy}
                </a>
                <a href="#" className="hover:text-foreground transition-colors">
                  {t.footer.terms}
                </a>
                <a href="#" className="hover:text-foreground transition-colors">
                  {t.footer.disclaimer}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
