import { Suspense } from "react";
import { AuthProvider } from "@/contexts/auth-context";
import { PropertiesProvider } from "@/contexts/properties-context";
import { RoomFeesContent } from "./room-fees-content";

export const metadata = {
  title: "雜項費用管理 | innbest.ai Admin",
  description: "管理房間雜項費用",
};

export default function RoomFeesPage() {
  return (
    <AuthProvider>
      <PropertiesProvider>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">載入中...</p>
            </div>
          </div>
        }>
          <RoomFeesContent />
        </Suspense>
      </PropertiesProvider>
    </AuthProvider>
  );
}

