"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { AppSettings, Product } from "@/types";

const DEFAULT_PRODUCTS: Record<string, Product> = {
  signedCheki: { id: "signedCheki", name: "サイン付きチェキ", price: 2000, order: 1 },
  normalCheki: { id: "normalCheki", name: "ノーマルチェキ", price: 1000, order: 2 },
  groupCheki: { id: "groupCheki", name: "囲みチェキ", price: 3000, order: 3 },
  personalSign: { id: "personalSign", name: "私物サイン", price: 2000, order: 4 },
  sugoroku: { id: "sugoroku", name: "すごろく", price: 500, order: 5 },
};

const DEFAULT_SETTINGS: AppSettings = {
  companyName: "株式会社めしあがレーベル",
  taxRate: 10.21, // %単位で保持
  ceoWithLiveRatio: 70, // %単位
  ceoRewardRatio: 25, // %単位
  employeeWithLiveRatio: 70, // %単位
  employeeRewardRatio: 50, // %単位
  products: DEFAULT_PRODUCTS,
};

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: AppSettings) => void;
  resetSettings: () => void;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("cf_app_settings");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // 新しい設定項目が増えた場合のマージ処理
        setSettings((prev) => ({
            ...prev,
            ...parsed,
            products: {
                ...prev.products,
                ...(parsed.products || {})
            }
        }));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    setIsLoading(false);
  }, []);

  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem("cf_app_settings", JSON.stringify(newSettings));
  };

  const resetSettings = () => {
    if (confirm("設定を初期値に戻しますか？")) {
      setSettings(DEFAULT_SETTINGS);
      localStorage.setItem("cf_app_settings", JSON.stringify(DEFAULT_SETTINGS));
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

