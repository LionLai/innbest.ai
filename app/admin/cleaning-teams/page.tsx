"use client";

import { AuthProvider } from "@/contexts/auth-context";
import { CleaningTeamsContent } from "./cleaning-teams-content";

export default function CleaningTeamsPage() {
  return (
    <AuthProvider>
      <CleaningTeamsContent />
    </AuthProvider>
  );
}

