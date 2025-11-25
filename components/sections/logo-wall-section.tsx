"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/contexts/language-context"

const partners = [
  { name: "Partner A", logo: "/generic-hotel-logo.png" },
  { name: "Partner B", logo: "/investment-fund-logo.png" },
  { name: "Partner C", logo: "/property-management-logo.jpg" },
  { name: "Partner D", logo: "/technology-partner-logo.png" },
  { name: "Partner E", logo: "/generic-financial-logo.png" },
  { name: "Partner F", logo: "/real-estate-logo.png" },
]

export function LogoWallSection() {
  const { t } = useLanguage()

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 px-4 py-2 border-primary/20 bg-primary/5">
              {t.logoWall.badge}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.logoWall.title}</h2>
            <p className="text-muted-foreground">{t.logoWall.subtitle}</p>
          </div>

          <Card className="p-12">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
              {partners.map((partner, index) => (
                <div
                  key={index}
                  className="flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
                >
                  <img src={partner.logo || "/placeholder.svg"} alt={partner.name} className="max-h-12 w-auto" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
