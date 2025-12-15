"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

// 表單驗證 Schema
const bookingFormSchema = z.object({
  guestName: z.string().min(2, "姓名至少需要 2 個字元").max(50, "姓名不能超過 50 個字元"),
  guestEmail: z.string().email("請輸入有效的 Email 地址"),
  guestPhone: z.string().min(10, "電話號碼至少需要 10 個字元").max(20, "電話號碼不能超過 20 個字元"),
  adults: z.number().min(1, "至少需要 1 位成人").max(10, "成人數量不能超過 10 位"),
  children: z.number().min(0, "兒童數量不能為負數").max(10, "兒童數量不能超過 10 位"),
  specialRequests: z.string().max(500, "特殊需求不能超過 500 個字元").optional(),
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  roomId: number;
  propertyId: number;
  roomName: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  currency: string;
  priceBreakdown: Record<string, number>;
  onCancel: () => void;
}

export function BookingForm({
  roomId,
  propertyId,
  roomName,
  checkIn,
  checkOut,
  totalAmount,
  currency,
  priceBreakdown,
  onCancel,
}: BookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      guestName: "",
      guestEmail: "",
      guestPhone: "",
      adults: 2,
      children: 0,
      specialRequests: "",
    },
  });

  const onSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // 拆分姓名（假設格式：姓 名）
      const nameParts = data.guestName.trim().split(' ');
      const guestFirstName = nameParts[0];
      const guestLastName = nameParts.slice(1).join(' ');

      // 調用訂單創建 API
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          propertyId,
          roomName,
          checkIn,
          checkOut,
          guestFirstName,
          guestLastName: guestLastName || undefined,
          guestEmail: data.guestEmail,
          guestPhone: data.guestPhone,
          numAdults: data.adults,
          numChildren: data.children,
          specialRequests: data.specialRequests || undefined,
          totalAmount,
          currency,
          priceBreakdown,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '訂單創建失敗');
      }

      // 重定向到 Stripe Checkout
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        throw new Error('未收到付款連結');
      }
    } catch (err) {
      console.error("提交錯誤:", err);
      setError(err instanceof Error ? err.message : '提交失敗，請稍後再試');
      setIsSubmitting(false);
    }
    // 注意：不在 finally 中設置 setIsSubmitting(false)，因為頁面會重定向
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* 姓名 */}
      <div className="space-y-2">
        <Label htmlFor="guestName">
          姓名 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="guestName"
          {...register("guestName")}
          placeholder="請輸入姓名"
          disabled={isSubmitting}
        />
        {errors.guestName && (
          <p className="text-sm text-destructive">{errors.guestName.message}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="guestEmail">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input
          id="guestEmail"
          type="email"
          {...register("guestEmail")}
          placeholder="example@email.com"
          disabled={isSubmitting}
        />
        {errors.guestEmail && (
          <p className="text-sm text-destructive">{errors.guestEmail.message}</p>
        )}
      </div>

      {/* 電話 */}
      <div className="space-y-2">
        <Label htmlFor="guestPhone">
          電話 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="guestPhone"
          type="tel"
          {...register("guestPhone")}
          placeholder="+886 912345678"
          disabled={isSubmitting}
        />
        {errors.guestPhone && (
          <p className="text-sm text-destructive">{errors.guestPhone.message}</p>
        )}
      </div>

      {/* 入住人數 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="adults">
            成人數 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="adults"
            type="number"
            min="1"
            max="10"
            {...register("adults", { valueAsNumber: true })}
            disabled={isSubmitting}
          />
          {errors.adults && (
            <p className="text-sm text-destructive">{errors.adults.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="children">兒童數</Label>
          <Input
            id="children"
            type="number"
            min="0"
            max="10"
            {...register("children", { valueAsNumber: true })}
            disabled={isSubmitting}
          />
          {errors.children && (
            <p className="text-sm text-destructive">{errors.children.message}</p>
          )}
        </div>
      </div>

      {/* 特殊需求 */}
      <div className="space-y-2">
        <Label htmlFor="specialRequests">特殊需求（選填）</Label>
        <Textarea
          id="specialRequests"
          {...register("specialRequests")}
          placeholder="例如：需要嬰兒床、高樓層、靠近電梯等"
          rows={3}
          disabled={isSubmitting}
        />
        {errors.specialRequests && (
          <p className="text-sm text-destructive">{errors.specialRequests.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          最多 500 個字元
        </p>
      </div>

      {/* 錯誤訊息 */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      {/* 按鈕 */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1"
        >
          取消
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          確認預訂
        </Button>
      </div>

      {/* 提示 */}
      <p className="text-xs text-muted-foreground text-center pt-2">
        點擊「確認預訂」後，您將前往付款頁面
      </p>
    </form>
  );
}

