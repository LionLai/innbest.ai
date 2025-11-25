import { ClientLanguageProvider } from "@/components/client-language-provider"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/sections/hero-section"
import { PowerStackSection } from "@/components/sections/power-stack-section"
import { PerformanceTimelineSection } from "@/components/sections/performance-timeline-section"
import { AIPMSVisionSection } from "@/components/sections/ai-pms-vision-section"
import { InvestmentThesisSection } from "@/components/sections/investment-thesis-section"
import { SocialProofSection } from "@/components/sections/social-proof-section"
import { LogoWallSection } from "@/components/sections/logo-wall-section"
import { CTASection } from "@/components/sections/cta-section"
import { ContactLegalSection } from "@/components/sections/contact-legal-section"
import { Footer } from "@/components/sections/footer"

export default function EnglishPage() {
  return (
    <ClientLanguageProvider locale="en">
      <Header />
      <HeroSection />
      <PowerStackSection />
      <PerformanceTimelineSection />
      <AIPMSVisionSection />
      <InvestmentThesisSection />
      <SocialProofSection />
      <LogoWallSection />
      <CTASection />
      <ContactLegalSection />
      <Footer />
    </ClientLanguageProvider>
  )
}
