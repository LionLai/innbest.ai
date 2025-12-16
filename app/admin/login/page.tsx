"use client";

import { ClientLanguageProvider } from "@/components/client-language-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { LoginContent } from "./login-content";

export default function AdminLoginPage() {
  return (
    <ClientLanguageProvider locale="zh-TW">
      <AuthProvider>
        <LoginContent />
      </AuthProvider>
    </ClientLanguageProvider>
  );
}

