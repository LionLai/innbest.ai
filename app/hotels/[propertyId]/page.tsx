import { Suspense } from "react";
import { ClientLanguageProvider } from "@/components/client-language-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/sections/footer";
import { SessionInitializer } from "@/components/session-initializer";
import { PropertiesProvider } from "@/contexts/properties-context";
import { PropertyDetailContent } from "./property-detail-content";

export const metadata = {
  title: "飯店詳情 | innbest.ai - 東京飯店投資",
  description: "查看飯店詳細資訊、所有房型及設施，立即預訂您理想的住宿",
};

interface PageProps {
  params: Promise<{
    propertyId: string;
  }>;
}

export default async function PropertyDetailPage({ params }: PageProps) {
  // Next.js 15: params 現在是 Promise，需要 await
  const { propertyId } = await params;
  
  return (
    <ClientLanguageProvider locale="zh-TW">
      <SessionInitializer />
      <PropertiesProvider>
        <Header />
        <main className="min-h-screen pt-20">
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
            <PropertyDetailContent propertyId={parseInt(propertyId)} />
          </Suspense>
        </main>
        <Footer />
      </PropertiesProvider>
    </ClientLanguageProvider>
  );
}
