"use client";

import { ClientLanguageProvider } from "@/components/client-language-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { DashboardContent } from "./dashboard-content";

export default function AdminDashboardPage() {
  return (
    <ClientLanguageProvider locale="zh-TW">
      <AuthProvider>
        <DashboardContent />
      </AuthProvider>
    </ClientLanguageProvider>
  );
}

