"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useOwnerAuth } from "@/contexts/owner-auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Building2, Mail, Lock, AlertCircle } from "lucide-react";

export function OwnerLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, user, owner } = useOwnerAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 如果已經登入，重定向到 dashboard
  useEffect(() => {
    if (user && owner) {
      router.push('/owner/dashboard');
    }
  }, [user, owner, router]);

  // 檢查 URL 參數中的錯誤
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'no_owner_data') {
      setError('找不到業主資料，請聯繫管理員');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
      router.push('/owner/dashboard');
    } catch (err: any) {
      console.error('登入錯誤:', err);
      
      if (err.message === '您沒有業主權限') {
        setError('您沒有業主權限，請使用正確的帳號登入');
      } else if (err.message?.includes('Invalid login credentials')) {
        setError('Email 或密碼錯誤');
      } else {
        setError('登入失敗，請稍後再試');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <Building2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold">
              <span className="text-foreground">innbest</span>
              <span className="text-accent">.ai</span>
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              業主管理平台
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <span className="ml-2">{error}</span>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="inline h-4 w-4 mr-2" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="owner@innbest.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                <Lock className="inline h-4 w-4 mr-2" />
                密碼
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  登入中...
                </>
              ) : (
                '登入'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t text-center text-sm text-muted-foreground">
            <p>需要幫助？請聯繫管理員</p>
            <p className="mt-2">
              <a href="/" className="text-primary hover:underline">
                返回首頁
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

