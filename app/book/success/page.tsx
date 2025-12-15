"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

interface BookingDetails {
  id: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalAmount: number;
  currency: string;
  guestEmail: string;
  status: string;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const bookingId = searchParams.get("booking_id");
  
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails(bookingId);
    } else {
      setError("缺少訂單編號");
      setLoading(false);
    }
  }, [bookingId]);

  async function fetchBookingDetails(id: string) {
    try {
      const response = await fetch(`/api/bookings/${id}`);
      const result = await response.json();
      
      if (result.success) {
        setBooking(result.data);
      } else {
        setError(result.error || "無法取得訂單資訊");
      }
    } catch (err) {
      console.error("獲取訂單詳情錯誤:", err);
      setError("載入訂單資訊時發生錯誤");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-20 px-4 max-w-lg">
        <Card className="text-center">
          <CardContent className="py-12">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">載入訂單資訊...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-20 px-4 max-w-lg">
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-16 h-16 text-yellow-500" />
            </div>
            <CardTitle className="text-2xl">訂單處理中</CardTitle>
            <CardDescription className="mt-2">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              您的付款已完成，但訂單資訊載入失敗。
              <br />
              請稍後查看您的 Email 確認信。
            </p>
            {bookingId && (
              <div className="bg-muted p-3 rounded-lg mb-4">
                <div className="text-xs text-muted-foreground mb-1">訂單編號</div>
                <div className="text-lg font-mono font-bold">{bookingId}</div>
              </div>
            )}
            <Link href="/hotels">
              <Button className="w-full">返回飯店據點</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-20 px-4 max-w-2xl">
      <Card className="text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="text-3xl font-bold text-green-600">付款成功！</CardTitle>
          <CardDescription className="text-lg mt-2">
            感謝您的預訂，我們期待您的光臨。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-4 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">訂單編號</div>
            <div className="text-2xl font-mono font-bold tracking-wider">
              {booking?.id || bookingId}
            </div>
          </div>

          {booking && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-left">
              <h3 className="font-semibold text-center mb-3">訂單詳情</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">房型</div>
                <div className="font-medium text-right">{booking.roomName}</div>
                
                <div className="text-muted-foreground">入住日期</div>
                <div className="font-medium text-right">{booking.checkIn}</div>
                
                <div className="text-muted-foreground">退房日期</div>
                <div className="font-medium text-right">{booking.checkOut}</div>
                
                <div className="text-muted-foreground">住宿天數</div>
                <div className="font-medium text-right">{booking.nights} 晚</div>
                
                <div className="text-muted-foreground">訂單狀態</div>
                <div className="font-medium text-right">
                  {booking.status === 'PAYMENT_COMPLETED' && '✅ 付款完成'}
                  {booking.status === 'BEDS24_CONFIRMED' && '✅ 訂房確認'}
                  {booking.status === 'PENDING_PAYMENT' && '⏳ 等待付款'}
                </div>
              </div>
              
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">總金額</span>
                  <span className="text-xl font-bold text-primary">
                    ¥{booking.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground space-y-2">
            <p>✉️ 確認信已發送至：<strong>{booking?.guestEmail}</strong></p>
            <p>📱 入住時請出示此訂單編號或確認信</p>
            {booking?.status === 'PAYMENT_COMPLETED' && (
              <p className="text-yellow-600">
                ⏳ 訂房正在確認中，完成後會再次發送通知郵件
              </p>
            )}
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

