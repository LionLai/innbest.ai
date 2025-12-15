import { Suspense } from "react";
import { ClientLanguageProvider } from "@/components/client-language-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/sections/footer";
import { SessionInitializer } from "@/components/session-initializer";
import { PropertiesProvider } from "@/contexts/properties-context";
import { AvailabilityContent } from "./availability-content";

export const metadata = {
  title: "查詢空房 | innbest.ai - 東京飯店投資",
  description: "查詢我們管理的飯店空房狀態，選擇您理想的入住日期",
};

export default function AvailabilityPage() {
  return (
    <ClientLanguageProvider locale="zh-TW">
      <SessionInitializer />
      <PropertiesProvider>
        <Header />
        <main className="min-h-screen pt-20">
        <div className="container mx-auto py-12 px-4">
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">查詢空房</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              選擇入住日期，查看即時空房狀態與房價
            </p>
          </div>

          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                  <p className="text-muted-foreground">載入中...</p>
                </div>
              </div>
            }
          >
            <AvailabilityContent />
          </Suspense>
        </div>
      </main>
      <Footer />
      </PropertiesProvider>
    </ClientLanguageProvider>
  );
}

