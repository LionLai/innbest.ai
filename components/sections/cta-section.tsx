"use client"

import { Button } from "@/components/ui/button"
import { Calendar, FileDown, ArrowRight } from 'lucide-react'
import { useLanguage } from "@/contexts/language-context"

export function CTASection() {
  const { t } = useLanguage()

  return (
    <section className="py-32 bg-secondary/30 border-y border-border">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-background border border-border p-16">
            <div className="text-center space-y-8">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-balance">{t.cta.title}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">{t.cta.subtitle}</p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" className="px-10 py-6 bg-accent hover:bg-accent/90 text-accent-foreground group">
                  <Calendar className="mr-2 w-4 h-4" />
                  {t.cta.bookCall}
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button size="lg" variant="outline" className="px-10 py-6 border-2 border-foreground hover:bg-foreground hover:text-background">
                  <FileDown className="mr-2 w-4 h-4" />
                  {t.cta.downloadDeck}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
