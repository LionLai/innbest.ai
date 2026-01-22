import { ClientLanguageProvider } from "@/components/client-language-provider"
import { Header } from "@/components/header"
import { ContactLegalSection } from "@/components/sections/contact-legal-section"
import { Footer } from "@/components/sections/footer"

export const metadata = {
  title: "聯絡我們 | innbest.ai - 東京飯店投資",
  description: "與 innbest.ai 聯絡，了解更多關於東京飯店投資的資訊",
};

export default function ContactPage() {
  return (
    <ClientLanguageProvider locale="zh-TW">
      <Header />
      <main className="min-h-screen pt-20">
        <ContactLegalSection />
      </main>
      <Footer />
    </ClientLanguageProvider>
  )
}
