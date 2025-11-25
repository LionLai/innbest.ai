"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Mail, MapPin, Phone } from "lucide-react"
import { useState } from "react"
import { useLanguage } from "@/contexts/language-context"

export function ContactLegalSection() {
  const { t } = useLanguage()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSubmitting(false)
  }

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.contact.title}</h2>
            <p className="text-xl text-muted-foreground">{t.contact.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Form */}
            <Card className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">{t.contact.form.name} *</Label>
                  <Input id="name" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t.contact.form.email} *</Label>
                  <Input id="email" type="email" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">{t.contact.form.company}</Label>
                  <Input id="company" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">{t.contact.form.message}</Label>
                  <Textarea id="message" rows={4} />
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? t.contact.form.sending : t.contact.form.send}
                </Button>
              </form>
            </Card>

            {/* Contact Info & Legal */}
            <div className="space-y-6">
              <Card className="p-8">
                <h3 className="text-xl font-semibold mb-6">{t.contact.info.title}</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">Email</div>
                      <div className="text-sm text-muted-foreground">{t.contact.info.email}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">Phone</div>
                      <div className="text-sm text-muted-foreground">{t.contact.info.phone}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">Address</div>
                      <div className="text-sm text-muted-foreground">{t.contact.info.address}</div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-8 bg-muted/50">
                <h3 className="font-semibold mb-3">{t.contact.legal.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{t.contact.legal.disclaimer}</p>
                <div className="flex gap-4 text-sm">
                  <a href="#" className="text-primary hover:underline">
                    {t.contact.legal.privacy}
                  </a>
                  <a href="#" className="text-primary hover:underline">
                    {t.contact.legal.terms}
                  </a>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
