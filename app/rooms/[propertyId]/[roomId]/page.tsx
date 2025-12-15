import { Suspense } from "react";
import { ClientLanguageProvider } from "@/components/client-language-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/sections/footer";
import { SessionInitializer } from "@/components/session-initializer";
import { PropertiesProvider } from "@/contexts/properties-context";
import { RoomDetailContent } from "./room-detail-content";

export const metadata = {
  title: "房間詳情 | innbest.ai - 東京飯店投資",
  description: "查看房間詳細資訊、照片及設施，立即預訂您理想的住宿",
};

interface PageProps {
  params: Promise<{
    propertyId: string;
    roomId: string;
  }>;
}

export default async function RoomDetailPage({ params }: PageProps) {
  // Next.js 15: params 現在是 Promise，需要 await
  const { propertyId, roomId } = await params;
  
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
            <RoomDetailContent 
              propertyId={parseInt(propertyId)} 
              roomId={parseInt(roomId)} 
            />
          </Suspense>
        </main>
        <Footer />
      </PropertiesProvider>
    </ClientLanguageProvider>
  );
}

