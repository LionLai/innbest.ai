"use client";

import { AuthProvider } from "@/contexts/auth-context";
import { PropertiesProvider } from "@/contexts/properties-context";
import { OwnersContent } from "./owners-content";

export default function AdminOwnersPage() {
  return (
    <AuthProvider>
      <PropertiesProvider>
        <OwnersContent />
      </PropertiesProvider>
    </AuthProvider>
  );
}

