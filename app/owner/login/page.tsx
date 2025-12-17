"use client";

import { Suspense } from "react";
import { OwnerAuthProvider } from "@/contexts/owner-auth-context";
import { OwnerLoginContent } from "./owner-login-content";

export default function OwnerLoginPage() {
  return (
    <OwnerAuthProvider>
      <Suspense fallback={<LoginLoadingFallback />}>
        <OwnerLoginContent />
      </Suspense>
    </OwnerAuthProvider>
  );
}

// 載入中的 fallback UI
function LoginLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">載入中...</p>
      </div>
    </div>
  );
}

