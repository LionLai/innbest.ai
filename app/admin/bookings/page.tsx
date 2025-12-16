"use client";

import { ClientLanguageProvider } from "@/components/client-language-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { PropertiesProvider } from "@/contexts/properties-context";
import { BookingsContent } from "./bookings-content";

export default function AdminBookingsPage() {
  return (
    <ClientLanguageProvider locale="zh-TW">
      <AuthProvider>
        <PropertiesProvider>
          <BookingsContent />
        </PropertiesProvider>
      </AuthProvider>
    </ClientLanguageProvider>
  );
}

