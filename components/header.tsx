"use client"

import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/contexts/language-context"
import { Menu } from 'lucide-react'
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function Header() {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
      <div className="container mx-auto px-6">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-serif font-bold tracking-tight">
              <span className="text-foreground">innbest</span>
              <span className="text-accent">.ai</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <button className="text-sm text-foreground/80 hover:text-accent transition-colors font-medium">
              {t.powerStack.badge}
            </button>
            <button className="text-sm text-foreground/80 hover:text-accent transition-colors font-medium">
              {t.performance.badge}
            </button>
            <button className="text-sm text-foreground/80 hover:text-accent transition-colors font-medium">
              {t.aiPms.badge}
            </button>
            <button className="text-sm text-foreground/80 hover:text-accent transition-colors font-medium">
              {t.contact.title}
            </button>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Button className="hidden md:inline-flex bg-accent hover:bg-accent/90 text-accent-foreground">
              {t.hero.bookCall}
            </Button>

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <nav className="flex flex-col gap-4 mt-8">
                  <Button variant="ghost" className="justify-start" onClick={() => setIsOpen(false)}>
                    {t.powerStack.badge}
                  </Button>
                  <Button variant="ghost" className="justify-start" onClick={() => setIsOpen(false)}>
                    {t.performance.badge}
                  </Button>
                  <Button variant="ghost" className="justify-start" onClick={() => setIsOpen(false)}>
                    {t.aiPms.badge}
                  </Button>
                  <Button variant="ghost" className="justify-start" onClick={() => setIsOpen(false)}>
                    {t.contact.title}
                  </Button>
                  <Button className="mt-4 bg-accent hover:bg-accent/90" onClick={() => setIsOpen(false)}>
                    {t.hero.bookCall}
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
