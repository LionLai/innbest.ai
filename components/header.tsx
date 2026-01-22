"use client"

import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Menu } from 'lucide-react'
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"

export function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/90">
      <div className="container mx-auto px-6">
        <div className="flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl font-serif font-bold tracking-tight">
              <span className="text-foreground">innbest</span>
              <span className="text-accent">.ai</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm text-foreground/80 hover:text-accent transition-colors font-medium">
              飯店據點
            </Link>
            <Link href="/availability" className="text-sm text-foreground/80 hover:text-accent transition-colors font-medium">
              查詢空房
            </Link>
            <Link href="/contact" className="text-sm text-foreground/80 hover:text-accent transition-colors font-medium">
              聯絡我們
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <nav className="flex flex-col gap-4 mt-8">
                  <Link href="/" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="justify-start w-full">
                      飯店據點
                    </Button>
                  </Link>
                  <Link href="/availability" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="justify-start w-full">
                      查詢空房
                    </Button>
                  </Link>
                  <Link href="/contact" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="justify-start w-full">
                      聯絡我們
                    </Button>
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
