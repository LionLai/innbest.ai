"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { CheckoutForm } from "@/components/checkout-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { format, parseISO, differenceInDays } from "date-fns";

// 載入 Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function BookingProcess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const roomId = searchParams.get("roomId");
  const propertyId = searchParams.get("propertyId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const roomName = searchParams.get("roomName") || "指定房型";

  // 表單狀態
  const [guestName, setGuestName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");

  // 付款狀態
  const [clientSecret, setClientSecret] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);
  const [currency, setCurrency] = useState("jpy");
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. 初始化付款意圖
  const initializePayment = async () => {
    if (!guestName || !email || !phone) {
      setError("請填寫所有聯絡資訊");
      return;
    }

    setIsInitializing(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: Number(roomId),
          propertyId: Number(propertyId),
          startDate,
          endDate,
          guests: {
            name: guestName,
            email,
            phone,
            adults: Number(adults),
            children: Number(children)
          }
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "初始化付款失敗");
      }

      setClientSecret(data.clientSecret);
      setTotalPrice(data.totalPrice);
      setCurrency(data.currency);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsInitializing(false);
    }
  };

  // 2. 付款成功後的回調
  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId,
          roomId,
          startDate,
          endDate,
          guestName,
          email,
          phone,
          adults,
          children
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // 這裡是很嚴重的情況：付款成功但訂單失敗
        // 實際專案應引導至客服或觸發退款流程
        throw new Error(data.error || "訂單建立失敗");
      }

      // 成功！跳轉至感謝頁面
      router.push(`/book/success?bookingId=${data.bookingId}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!roomId || !startDate || !endDate) {
    return <div className="p-8 text-center">無效的訂房參數</div>;
  }

  const nights = differenceInDays(parseISO(endDate), parseISO(startDate));

  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8 text-center">預訂您的住宿</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 左側：訂單資訊與聯絡資料 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>訂房資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">房型</div>
                <div className="font-medium text-lg">{roomName}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">入住日期</div>
                  <div className="font-medium">{startDate}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">退房日期</div>
                  <div className="font-medium">{endDate}</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">住宿天數</div>
                <div className="font-medium">{nights} 晚</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>聯絡資訊</CardTitle>
              <CardDescription>請填寫入住旅客資料</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">姓名</Label>
                <Input 
                  id="name" 
                  value={guestName} 
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="請輸入真實姓名"
                  disabled={!!clientSecret} // 進入付款後鎖定
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="接收訂單確認信"
                  disabled={!!clientSecret}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">電話</Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="聯絡電話"
                  disabled={!!clientSecret}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adults">成人</Label>
                  <Input 
                    id="adults" 
                    type="number" 
                    min="1"
                    value={adults} 
                    onChange={(e) => setAdults(e.target.value)}
                    disabled={!!clientSecret}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="children">兒童</Label>
                  <Input 
                    id="children" 
                    type="number" 
                    min="0"
                    value={children} 
                    onChange={(e) => setChildren(e.target.value)}
                    disabled={!!clientSecret}
                  />
                </div>
              </div>

              {!clientSecret && (
                <Button 
                  className="w-full mt-4" 
                  size="lg" 
                  onClick={initializePayment}
                  disabled={isInitializing}
                >
                  {isInitializing ? "處理中..." : "前往付款"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右側：付款區域 */}
        <div className="space-y-6">
          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
              {error}
            </div>
          )}

          {clientSecret ? (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle>付款詳情</CardTitle>
                <CardDescription>
                  總金額: {currency.toUpperCase()} {totalPrice.toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Elements 
                  stripe={stripePromise} 
                  options={{ 
                    clientSecret,
                    appearance: { theme: 'stripe' },
                  }}
                >
                  <CheckoutForm 
                    amount={totalPrice} 
                    currency={currency} 
                    onSuccess={handlePaymentSuccess}
                  />
                </Elements>
                
                <Button 
                  variant="ghost" 
                  className="w-full mt-4"
                  onClick={() => setClientSecret("")} // 允許返回修改資料
                >
                  返回修改資料
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center p-8 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/50">
              請先填寫左側資料以進行付款
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">載入中...</div>}>
      <BookingProcess />
    </Suspense>
  );
}

