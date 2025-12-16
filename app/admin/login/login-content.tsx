"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react";

export function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { signIn, user, isLoading } = useAuth();
  const router = useRouter();

  // 如果已經登入，重定向到 dashboard
  useEffect(() => {
    if (user && !isLoading) {
      router.push('/admin/dashboard');
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // 基本驗證
    if (!email || !password) {
      setError("請填寫所有欄位");
      setIsSubmitting(false);
      return;
    }

    if (!email.includes('@')) {
      setError("請輸入有效的電子郵件地址");
      setIsSubmitting(false);
      return;
    }

    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        // 根據錯誤類型顯示友善的錯誤訊息
        if (signInError.message.includes('Invalid login credentials')) {
          setError("電子郵件或密碼錯誤");
        } else if (signInError.message.includes('Email not confirmed')) {
          setError("請先確認您的電子郵件");
        } else {
          setError(signInError.message || "登入失敗，請稍後再試");
        }
      } else {
        // 登入成功，導向 dashboard
        router.push('/admin/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError("發生未預期的錯誤，請稍後再試");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 如果已經登入，顯示載入中
  if (user && !isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">重定向中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-foreground">innbest</span>
            <span className="text-accent">.ai</span>
          </h1>
          <p className="text-muted-foreground">管理後台</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">登入</CardTitle>
            <CardDescription>
              使用您的管理員帳號登入系統
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email">電子郵件</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@innbest.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isSubmitting}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password">密碼</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    disabled={isSubmitting}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    登入中...
                  </>
                ) : (
                  "登入"
                )}
              </Button>
            </form>

            {/* Additional Links */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>忘記密碼？請聯繫系統管理員</p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>© 2025 innbest.ai. 保留所有權利。</p>
        </div>
      </div>
    </div>
  );
}

