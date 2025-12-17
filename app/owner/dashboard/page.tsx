"use client";

import { OwnerAuthProvider } from "@/contexts/owner-auth-context";
import { OwnerDashboardContent } from "./owner-dashboard-content";

export default function OwnerDashboardPage() {
  return (
    <OwnerAuthProvider>
      <OwnerDashboardContent />
    </OwnerAuthProvider>
  );
}

