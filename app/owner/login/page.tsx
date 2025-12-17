"use client";

import { OwnerAuthProvider } from "@/contexts/owner-auth-context";
import { OwnerLoginContent } from "./owner-login-content";

export default function OwnerLoginPage() {
  return (
    <OwnerAuthProvider>
      <OwnerLoginContent />
    </OwnerAuthProvider>
  );
}

