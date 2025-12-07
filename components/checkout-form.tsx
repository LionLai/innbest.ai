"use client";

import { useEffect, useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";

interface CheckoutFormProps {
  amount: number;
  currency: string;
  onSuccess: (paymentIntentId: string) => Promise<void>;
}

export function CheckoutForm({ amount, currency, onSuccess }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case "succeeded":
          setMessage("付款成功！");
          break;
        case "processing":
          setMessage("付款處理中。");
          break;
        case "requires_payment_method":
          setMessage("付款失敗，請重試。");
          break;
        default:
          setMessage("發生未知錯誤。");
          break;
      }
    });
  }, [stripe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // 付款成功後不需要跳轉，我們會在原地處理
        return_url: window.location.href, 
      },
      redirect: "if_required", // 只有需要 3D Secure 驗證時才跳轉
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || "發生錯誤");
      } else {
        setMessage("發生未預期的錯誤");
      }
      setIsLoading(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      // 付款成功，執行回調建立訂單
      await onSuccess(paymentIntent.id);
      setIsLoading(false);
    }
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement id="payment-element" options={{ layout: "tabs" }} />
      
      {message && (
        <div className="p-4 rounded bg-destructive/10 text-destructive text-sm" id="payment-message">
          {message}
        </div>
      )}

      <Button 
        disabled={isLoading || !stripe || !elements} 
        id="submit"
        className="w-full text-lg py-6"
      >
        <span id="button-text">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              處理中...
            </div>
          ) : (
            `確認付款 ${currency.toUpperCase()} ${amount.toLocaleString()}`
          )}
        </span>
      </Button>
    </form>
  );
}

