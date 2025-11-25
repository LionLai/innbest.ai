import { Suspense } from "react";
import { ClientLanguageProvider } from "@/components/client-language-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/sections/footer";
import { HotelsContent } from "./hotels-content";

export const metadata = {
  title: "飯店據點 | innbest.ai - 東京飯店投資",
  description: "瀏覽我們管理的飯店據點，查詢空房狀態，體驗 AI 智能管理的服務品質",
};

export default function HotelsPage() {
  return (
    <ClientLanguageProvider locale="zh-TW">
      <Header />
      <main className="min-h-screen pt-20">
        <div className="container mx-auto py-12 px-4">
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">我們的飯店據點</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              探索我們管理的優質飯店，查詢空房狀態，享受 AI 智能管理帶來的卓越體驗
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
            <HotelsContent />
          </Suspense>
        </div>
      </main>
      <Footer />
    </ClientLanguageProvider>
  );
}

