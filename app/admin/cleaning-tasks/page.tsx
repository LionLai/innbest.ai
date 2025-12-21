"use client";

import { AuthProvider } from "@/contexts/auth-context";
import { CleaningTasksContent } from "./cleaning-tasks-content";

export default function CleaningTasksPage() {
  return (
    <AuthProvider>
      <CleaningTasksContent />
    </AuthProvider>
  );
}

