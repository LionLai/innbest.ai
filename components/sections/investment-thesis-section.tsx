"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Building2, DollarSign, Cpu } from 'lucide-react'
import { useLanguage } from "@/contexts/language-context"

export function InvestmentThesisSection() {
  const { t } = useLanguage()

  const thesisPoints = [
    {
      icon: TrendingUp,
      title: t.thesis.inbound.title,
      stat: t.thesis.inbound.stat,
      description: t.thesis.inbound.description,
    },
    {
      icon: Building2,
      title: t.thesis.supply.title,
      stat: t.thesis.supply.stat,
      description: t.thesis.supply.description,
    },
    {
      icon: DollarSign,
      title: t.thesis.yield.title,
      stat: t.thesis.yield.stat,
      description: t.thesis.yield.description,
    },
    {
      icon: Cpu,
      title: t.thesis.tech.title,
      stat: t.thesis.tech.stat,
      description: t.thesis.tech.description,
    },
  ]

  return (
    <section className="py-32 bg-secondary/30 border-y border-border">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block px-6 py-2 border border-accent/20 text-sm text-accent font-medium mb-6">
              {t.thesis.badge}
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-balance mb-6">{t.thesis.title}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">{t.thesis.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
            {thesisPoints.map((point, index) => (
              <div
                key={index}
                className="bg-background p-10 hover:bg-secondary/50 transition-colors text-center"
              >
                <point.icon className="w-10 h-10 text-accent mx-auto mb-4" />
                <div className="text-3xl font-serif font-bold text-accent mb-2">{point.stat}</div>
                <h3 className="text-lg font-serif font-bold mb-3">{point.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{point.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
