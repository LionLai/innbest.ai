"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { HotelProperty } from "@/lib/types/hotel";

interface PropertiesContextValue {
  properties: HotelProperty[];
  isLoading: boolean;
  error: string | null;
  fetchProperties: () => Promise<void>;
  refetch: () => Promise<void>;
}

const PropertiesContext = createContext<PropertiesContextValue | undefined>(undefined);

interface PropertiesProviderProps {
  children: ReactNode;
}

export function PropertiesProvider({ children }: PropertiesProviderProps) {
  const [properties, setProperties] = useState<HotelProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchProperties = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/properties");
      const result = await response.json();

      if (result.success) {
        setProperties(result.data || []);
        setHasFetched(true);
      } else {
        setError(result.error || "載入失敗");
      }
    } catch (err) {
      setError("網路錯誤，請稍後再試");
      console.error("Failed to fetch properties:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 首次載入時自動獲取數據
  useEffect(() => {
    if (!hasFetched) {
      fetchProperties();
    }
  }, [hasFetched]);

  // refetch 函數，用於手動刷新數據
  const refetch = async () => {
    await fetchProperties();
  };

  const value: PropertiesContextValue = {
    properties,
    isLoading,
    error,
    fetchProperties,
    refetch,
  };

  return (
    <PropertiesContext.Provider value={value}>
      {children}
    </PropertiesContext.Provider>
  );
}

// 自定義 Hook 用於使用 PropertiesContext
export function useProperties() {
  const context = useContext(PropertiesContext);
  
  if (context === undefined) {
    throw new Error("useProperties must be used within a PropertiesProvider");
  }
  
  return context;
}

