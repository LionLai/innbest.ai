"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Brain, Zap, TrendingUp, Target } from 'lucide-react'
import { useLanguage } from "@/contexts/language-context"

export function PowerStackSection() {
  const { t } = useLanguage()

  const powerStack = [
    {
      icon: MapPin,
      title: t.powerStack.offMarket.title,
      description: t.powerStack.offMarket.description,
    },
    {
      icon: Brain,
      title: t.powerStack.aiPricing.title,
      description: t.powerStack.aiPricing.description,
    },
    {
      icon: Zap,
      title: t.powerStack.operations.title,
      description: t.powerStack.operations.description,
    },
    {
      icon: TrendingUp,
      title: t.powerStack.assetManagement.title,
      description: t.powerStack.assetManagement.description,
    },
    {
      icon: Target,
      title: t.powerStack.exitStrategy.title,
      description: t.powerStack.exitStrategy.description,
    },
  ]

  return (
    <section className="py-32 bg-background border-t border-border">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block px-6 py-2 border border-accent/20 text-sm text-accent font-medium mb-6">
              {t.powerStack.badge}
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-balance mb-6">
              {t.powerStack.title}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
              {t.powerStack.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-px bg-border">
            {powerStack.map((item, index) => (
              <div
                key={index}
                className="flex-[1_1_300px] bg-background p-10 hover:bg-secondary/50 transition-colors group"
              >
                <item.icon className="w-10 h-10 text-accent mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-serif font-bold mb-4">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
