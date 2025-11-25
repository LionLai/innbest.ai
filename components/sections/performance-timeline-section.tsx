"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useLanguage } from "@/contexts/language-context"

const performanceData = [
  { quarter: "2023 Q3", revpar: 8500, adr: 12000, occupancy: 91, irr: 12 },
  { quarter: "2023 Q4", revpar: 9200, adr: 12800, occupancy: 92, irr: 14 },
  { quarter: "2024 Q1", revpar: 9800, adr: 13200, occupancy: 93, irr: 15 },
  { quarter: "2024 Q2", revpar: 10500, adr: 13800, occupancy: 94, irr: 16 },
  { quarter: "2024 Q3", revpar: 11200, adr: 14500, occupancy: 95, irr: 17 },
  { quarter: "2024 Q4", revpar: 12000, adr: 15200, occupancy: 95, irr: 18 },
]

export function PerformanceTimelineSection() {
  const { t } = useLanguage()

  return (
    <section className="py-32 bg-secondary/30 border-y border-border">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block px-6 py-2 border border-accent/20 text-sm text-accent font-medium mb-6">
              {t.performance.badge}
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-balance mb-6">
              {t.performance.title}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
              {t.performance.subtitle}
            </p>
          </div>

          {/* Performance Chart */}
          <div className="bg-background border border-border p-8 md:p-12 mb-12">
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                <XAxis 
                  dataKey="quarter" 
                  stroke="#737373"
                  tick={{ fill: '#737373', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e5e5' }}
                />
                <YAxis 
                  stroke="#737373"
                  tick={{ fill: '#737373', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e5e5' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e5e5',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revpar"
                  stroke="#BC002D"
                  strokeWidth={3}
                  dot={{ fill: '#BC002D', r: 5 }}
                  activeDot={{ r: 6 }}
                  name={`${t.performance.revpar} (¥)`}
                />
                <Line
                  type="monotone"
                  dataKey="adr"
                  stroke="#262626"
                  strokeWidth={3}
                  dot={{ fill: '#262626', r: 5 }}
                  activeDot={{ r: 6 }}
                  name={`${t.performance.adr} (¥)`}
                />
                <Bar
                  dataKey="occupancy"
                  fill="#BC002D"
                  fillOpacity={0.3}
                  name={`${t.performance.occupancy} (%)`}
                  radius={[4, 4, 0, 0]}
                />
              </ComposedChart>
            </ResponsiveContainer>

            <div className="flex flex-wrap justify-center gap-8 mt-8 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-accent" />
                <span className="text-muted-foreground">RevPAR</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-foreground" />
                <span className="text-muted-foreground">ADR</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-3 bg-accent/30" />
                <span className="text-muted-foreground">{t.performance.occupancy}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
            <div className="bg-background p-8 text-center hover:bg-secondary/50 transition-colors">
              <div className="text-3xl font-serif font-bold text-foreground mb-2">200+</div>
              <div className="text-xs text-muted-foreground tracking-wide uppercase">{t.performance.rooms}</div>
            </div>
            <div className="bg-background p-8 text-center hover:bg-secondary/50 transition-colors">
              <div className="text-3xl font-serif font-bold text-accent mb-2">+12%</div>
              <div className="text-xs text-muted-foreground tracking-wide uppercase">{t.performance.adr}</div>
            </div>
            <div className="bg-background p-8 text-center hover:bg-secondary/50 transition-colors">
              <div className="text-3xl font-serif font-bold text-foreground mb-2">95%</div>
              <div className="text-xs text-muted-foreground tracking-wide uppercase">{t.performance.occupancy}</div>
            </div>
            <div className="bg-background p-8 text-center hover:bg-secondary/50 transition-colors">
              <div className="text-3xl font-serif font-bold text-accent mb-2">18%</div>
              <div className="text-xs text-muted-foreground tracking-wide uppercase">{t.performance.irr}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
