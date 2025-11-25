"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, Cpu, Zap, BarChart } from 'lucide-react'
import { useLanguage } from "@/contexts/language-context"

export function AIPMSVisionSection() {
  const { t } = useLanguage()

  const architecture = [
    {
      icon: Database,
      title: t.aiPms.dataLayer.title,
      description: t.aiPms.dataLayer.description,
      color: "primary",
    },
    {
      icon: Cpu,
      title: t.aiPms.aiEngine.title,
      description: t.aiPms.aiEngine.description,
      color: "chart-2",
    },
    {
      icon: Zap,
      title: t.aiPms.automation.title,
      description: t.aiPms.automation.description,
      color: "chart-3",
    },
    {
      icon: BarChart,
      title: t.aiPms.insights.title,
      description: t.aiPms.insights.description,
      color: "chart-4",
    },
  ]

  return (
    <section className="py-32 bg-background border-t border-border">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block px-6 py-2 border border-accent/20 text-sm text-accent font-medium mb-6">
              {t.aiPms.badge}
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-balance mb-6">{t.aiPms.title}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">{t.aiPms.subtitle}</p>
          </div>

          {/* Architecture Diagram */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
            {architecture.map((module, index) => (
              <div
                key={index}
                className="bg-background p-10 hover:bg-secondary/50 transition-colors group"
              >
                <module.icon className="w-10 h-10 text-accent mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-serif font-bold mb-4">{module.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{module.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
