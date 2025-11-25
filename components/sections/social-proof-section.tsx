"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Quote } from 'lucide-react'
import { useLanguage } from "@/contexts/language-context"

export function SocialProofSection() {
  const { t } = useLanguage()

  const testimonials = [
    {
      quote: t.socialProof.testimonial1.quote,
      author: t.socialProof.testimonial1.author,
      role: t.socialProof.testimonial1.role,
    },
    {
      quote: t.socialProof.testimonial2.quote,
      author: t.socialProof.testimonial2.author,
      role: t.socialProof.testimonial2.role,
    },
    {
      quote: t.socialProof.testimonial3.quote,
      author: t.socialProof.testimonial3.author,
      role: t.socialProof.testimonial3.role,
    },
  ]

  return (
    <section className="py-32 bg-background border-t border-border">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block px-6 py-2 border border-accent/20 text-sm text-accent font-medium mb-6">
              {t.socialProof.badge}
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-balance mb-6">{t.socialProof.title}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">{t.socialProof.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-border">
            {testimonials.map((item, index) => (
              <div key={index} className="bg-background p-10 hover:bg-secondary/50 transition-colors">
                <Quote className="w-8 h-8 text-accent/20 mb-6" />
                <p className="text-muted-foreground mb-8 leading-relaxed text-sm">{item.quote}</p>
                <div className="border-t border-border pt-6">
                  <div className="font-serif font-bold">{item.author}</div>
                  <div className="text-xs text-muted-foreground mt-1">{item.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
