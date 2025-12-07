"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  return (
    <div className="container mx-auto py-20 px-4 max-w-lg">
      <Card className="text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="text-3xl font-bold text-green-600">訂房成功！</CardTitle>
          <CardDescription className="text-lg mt-2">
            感謝您的預訂，我們期待您的光臨。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-4 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">訂單編號</div>
            <div className="text-2xl font-mono font-bold tracking-wider">
              {bookingId || "處理中"}
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            確認信已發送至您的電子信箱。<br />
            入住時請出示此訂單編號或確認信。
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/hotels">
              <Button className="w-full" size="lg">
                返回飯店據點
              </Button>
            </Link>
            {/* 這裡未來可以連結到「我的訂單」查詢頁面 */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">載入中...</div>}>
      <SuccessContent />
    </Suspense>
  );
}

