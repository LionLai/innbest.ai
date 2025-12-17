"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { BookingForm } from "@/components/booking-form";
import type { RoomAvailability } from "@/lib/types/hotel";
import type { CalculatePriceResponse } from "@/lib/types/booking";

interface BookingDialogProps {
  open: boolean;
  onClose: () => void;
  room: RoomAvailability;
  checkIn: string;
  checkOut: string;
  propertyId: number;
}

export function BookingDialog({
  open,
  onClose,
  room,
  checkIn,
  checkOut,
  propertyId,
}: BookingDialogProps) {
  const [priceData, setPriceData] = useState<CalculatePriceResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 當對話框打開時，重新計算價格
  useEffect(() => {
    if (open) {
      calculatePrice();
    }
  }, [open, room.roomId, checkIn, checkOut]);

  const calculatePrice = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/bookings/calculate-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: room.roomId,
          propertyId,
          checkIn,
          checkOut,
          adults: 1,       // 預設 1 位成人
          children: 0,     // 預設 0 位兒童
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPriceData(result.data);
      } else {
        setError(result.error || '價格計算失敗');
      }
    } catch (err) {
      console.error('價格計算錯誤:', err);
      setError('網路錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">{room.name}</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">正在計算價格...</p>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4">
            <p className="font-medium mb-2">價格計算失敗</p>
            <p className="text-sm">{error}</p>
            <Button
              onClick={calculatePrice}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              重試
            </Button>
          </div>
        )}

        {!loading && !error && priceData && (
          <div className="space-y-6">
            {/* 價格摘要 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">價格明細</h3>
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">入住日期</span>
                  <span className="font-medium">{priceData.checkIn || checkIn}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">退房日期</span>
                  <span className="font-medium">{priceData.checkOut || checkOut}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">住宿天數</span>
                  <span className="font-medium">{priceData.nights || 0} 晚</span>
                </div>
              </div>

              {/* 基本房價明細 */}
              <div className="border rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                <p className="text-sm font-medium mb-2">基本房價</p>
                {Object.entries(priceData.breakdown || priceData.priceBreakdown || {}).map(([date, price]) => (
                  <div key={date} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{date}</span>
                    <span className="font-medium">¥{(price || 0).toLocaleString()}</span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex justify-between text-sm font-medium">
                  <span>小計</span>
                  <span>¥{((priceData.basePrice || priceData.totalAmount || 0)).toLocaleString()}</span>
                </div>
              </div>

              {/* 雜項費用明細 */}
              {priceData.fees && priceData.fees.length > 0 && (
                <div className="border rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium mb-2">額外費用</p>
                  {priceData.fees.map((fee: any) => (
                    <div key={fee.id} className="flex justify-between text-sm">
                      <div>
                        <span className="text-muted-foreground">{fee.feeName}</span>
                        {fee.feeNameEn && (
                          <span className="text-xs text-muted-foreground ml-1">({fee.feeNameEn})</span>
                        )}
                      </div>
                      <span className="font-medium">¥{(fee.amount || 0).toLocaleString()}</span>
                    </div>
                  ))}
                  <Separator className="my-2" />
                  <div className="flex justify-between text-sm font-medium">
                    <span>小計</span>
                    <span>¥{((priceData.feesTotal || 0)).toLocaleString()}</span>
                  </div>
                </div>
              )}

              <Separator />

              {/* 總計 */}
              <div className="bg-primary/5 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">總計</span>
                  <span className="text-2xl font-bold text-primary">
                    ¥{(priceData.totalAmount || 0).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  貨幣：{priceData.currency || 'JPY'}
                </p>
              </div>
            </div>

            <Separator />

            {/* 訂房表單 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">訂房資訊</h3>
              <BookingForm
                roomId={room.roomId}
                propertyId={propertyId}
                roomName={room.name}
                checkIn={checkIn}
                checkOut={checkOut}
                totalAmount={priceData.totalAmount}
                currency={priceData.currency}
                priceBreakdown={priceData.breakdown || priceData.priceBreakdown || {}}
                onCancel={onClose}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

