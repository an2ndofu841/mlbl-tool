"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { AppSettings, Product } from "@/types";
import { supabase } from "@/lib/supabaseClient";

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
  stampImageUrl: undefined,
};

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: AppSettings) => Promise<void>;
  resetSettings: () => Promise<void>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [settingsId, setSettingsId] = useState<number | null>(null);

  // DBカラム名とアプリ設定のマッピング
  const mapFromDb = (data: any): AppSettings => ({
    companyName: data.company_name ?? DEFAULT_SETTINGS.companyName,
    taxRate: Number(data.tax_rate) ?? DEFAULT_SETTINGS.taxRate,
    ceoWithLiveRatio: Number(data.ceo_with_live_ratio) ?? DEFAULT_SETTINGS.ceoWithLiveRatio,
    ceoRewardRatio: Number(data.ceo_reward_ratio) ?? DEFAULT_SETTINGS.ceoRewardRatio,
    employeeWithLiveRatio: Number(data.employee_with_live_ratio) ?? DEFAULT_SETTINGS.employeeWithLiveRatio,
    employeeRewardRatio: Number(data.employee_reward_ratio) ?? DEFAULT_SETTINGS.employeeRewardRatio,
    products: data.products ?? DEFAULT_PRODUCTS,
    stampImageUrl: data.stamp_image_url || undefined,
  });

  const mapToDb = (settings: AppSettings) => ({
    company_name: settings.companyName,
    tax_rate: settings.taxRate,
    ceo_with_live_ratio: settings.ceoWithLiveRatio,
    ceo_reward_ratio: settings.ceoRewardRatio,
    employee_with_live_ratio: settings.employeeWithLiveRatio,
    employee_reward_ratio: settings.employeeRewardRatio,
    products: settings.products,
    stamp_image_url: settings.stampImageUrl || null,
  });

  useEffect(() => {
    const initSettings = async () => {
      try {
        // 1. まずDBから取得を試みる
        const { data, error } = await supabase
          .from('app_settings')
          .select('*')
          .limit(1)
          .single();

        if (data) {
          setSettingsId(data.id);
          setSettings(mapFromDb(data));
        } else if (error && error.code === 'PGRST116') {
          // 2. データがない場合（初期状態）、デフォルト値をDBに保存
          console.log("No settings found in DB, creating default...");
          const initialDbData = mapToDb(DEFAULT_SETTINGS);
          const { data: newData, error: insertError } = await supabase
            .from('app_settings')
            .insert(initialDbData)
            .select()
            .single();
          
          if (newData && !insertError) {
            setSettingsId(newData.id);
            setSettings(mapFromDb(newData));
          }
        } else {
            console.warn("Could not fetch settings from DB, falling back to local storage or defaults.", error);
            // DBがない、接続できないなどの場合はLocalStorageを見る
            const stored = localStorage.getItem("cf_app_settings");
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    setSettings((prev) => ({
                        ...prev,
                        ...parsed,
                        products: { ...prev.products, ...(parsed.products || {}) }
                    }));
                } catch(e) {}
            }
        }
      } catch (e) {
        console.error("Error initializing settings:", e);
      } finally {
        setIsLoading(false);
      }
    };

    initSettings();
  }, []);

  const updateSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings); // Optimistic update
    
    // LocalStorageにもバックアップとして保存
    localStorage.setItem("cf_app_settings", JSON.stringify(newSettings));

    try {
        const dbData = mapToDb(newSettings);

        if (settingsId) {
            await supabase
                .from('app_settings')
                .update(dbData)
                .eq('id', settingsId);
        } else {
             // IDがない場合（何らかの理由でfetch失敗後など）、新規挿入または既存検索して更新
             const { data } = await supabase.from('app_settings').select('id').limit(1).single();
             if (data) {
                 setSettingsId(data.id);
                 await supabase.from('app_settings').update(dbData).eq('id', data.id);
             } else {
                 const { data: newData } = await supabase.from('app_settings').insert(dbData).select().single();
                 if (newData) setSettingsId(newData.id);
             }
        }
    } catch (e) {
        console.error("Failed to sync settings with DB", e);
    }
  };

  const resetSettings = async () => {
    if (confirm("設定を初期値に戻しますか？")) {
      await updateSettings(DEFAULT_SETTINGS);
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
