"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DollarSign } from "lucide-react";

interface RoomFee {
  id: string;
  feeName: string;
  feeNameEn?: string | null;
  amount: number;
  currency: string;
}

interface PriceBreakdownProps {
  basePrice: number;
  breakdown: Record<string, number>;
  fees?: RoomFee[];
  feesTotal?: number;
  totalAmount: number;
  currency: string;
  nights: number;
}

export function PriceBreakdown({
  basePrice,
  breakdown,
  fees = [],
  feesTotal = 0,
  totalAmount,
  currency,
  nights,
}: PriceBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          價格明細
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 基本房價 */}
        <div>
          <h3 className="font-semibold mb-2">基本房價</h3>
          <div className="space-y-1">
            {Object.entries(breakdown).map(([date, price]) => (
              <div key={date} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{date}</span>
                <span>¥{price.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <Separator className="my-2" />
          <div className="flex items-center justify-between font-medium">
            <span>小計（{nights} 晚）</span>
            <span>¥{basePrice.toLocaleString()}</span>
          </div>
        </div>
        
        {/* 額外費用 */}
        {fees.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">額外費用</h3>
            <div className="space-y-1">
              {fees.map((fee) => (
                <div key={fee.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-muted-foreground">{fee.feeName}</span>
                    {fee.feeNameEn && (
                      <span className="text-xs text-muted-foreground ml-1">({fee.feeNameEn})</span>
                    )}
                  </div>
                  <span>¥{fee.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <Separator className="my-2" />
            <div className="flex items-center justify-between font-medium">
              <span>小計</span>
              <span>¥{feesTotal.toLocaleString()}</span>
            </div>
          </div>
        )}
        
        {/* 總計 */}
        <div className="pt-2">
          <Separator className="mb-3" />
          <div className="flex items-center justify-between text-lg font-bold">
            <span>總計</span>
            <span className="text-primary">¥{totalAmount.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

