"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/context/SettingsContext";
import { supabase } from "@/lib/supabaseClient";
import { Save, RotateCcw, Building2, Calculator, ShoppingCart, Upload, Image as ImageIcon } from "lucide-react";
import { Product } from "@/types";

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings, isLoading } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [isDirty, setIsDirty] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading settings...</div>;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setLocalSettings((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) : value,
    }));
    setIsDirty(true);
  };

  const handleProductChange = (key: string, field: keyof Product, value: string | number) => {
    setLocalSettings((prev) => ({
      ...prev,
      products: {
        ...prev.products,
        [key]: {
          ...prev.products[key],
          [field]: field === "price" ? Number(value) : value,
        },
      },
    }));
    setIsDirty(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `stamp_${Date.now()}.${fileExt}`;
      const filePath = `company-assets/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('images') // Using 'images' bucket (or whatever user creates)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      setLocalSettings(prev => ({
        ...prev,
        stampImageUrl: data.publicUrl
      }));
      setIsDirty(true);
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert('画像のアップロードに失敗しました。Supabase Storageの設定（imagesバケットの作成など）を確認してください。');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    await updateSettings(localSettings);
    setIsDirty(false);
    alert("設定を保存しました");
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            設定
          </h2>
          <p className="text-slate-500 mt-1">
            アプリケーション全体の設定を管理します
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={resetSettings}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <RotateCcw size={18} /> 初期化
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 font-bold"
          >
            <Save size={18} /> 保存する
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* 基本情報設定 */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Building2 className="text-blue-500" size={20} /> 基本情報・税率設定
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">会社名</label>
              <input
                type="text"
                name="companyName"
                value={localSettings.companyName}
                onChange={handleChange}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">源泉所得税率 (%)</label>
              <input
                type="number"
                name="taxRate"
                value={localSettings.taxRate}
                onChange={handleChange}
                step="0.01"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500"
              />
            </div>
            
            {/* 印鑑画像アップロード */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">社印画像</label>
                <div className="flex items-start gap-4">
                    <div className="w-24 h-24 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden relative">
                        {localSettings.stampImageUrl ? (
                            <img src={localSettings.stampImageUrl} alt="社印" className="w-full h-full object-contain" />
                        ) : (
                            <ImageIcon className="text-slate-300" size={32} />
                        )}
                        {isUploading && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors text-sm font-bold">
                            <Upload size={16} />
                            画像を選択...
                            <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={isUploading}
                            />
                        </label>
                        <p className="text-xs text-slate-400 mt-2">
                            PNG, JPG形式 (背景透過推奨)<br/>
                            Supabase Storageへの保存となります
                        </p>
                    </div>
                </div>
            </div>
          </div>
        </section>

        {/* 給与計算設定 */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Calculator className="text-emerald-500" size={20} /> 給与計算設定 (WithLIVE)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-700 mb-3">代表給与</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">売上掛率 (%) <span className="text-slate-400 font-normal"> - 売上から入金額を算出</span></label>
                  <input
                    type="number"
                    name="ceoWithLiveRatio"
                    value={localSettings.ceoWithLiveRatio}
                    onChange={handleChange}
                    className="w-full p-2 border border-slate-300 rounded focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">報酬掛率 (%) <span className="text-slate-400 font-normal"> - 入金額から報酬を算出</span></label>
                  <input
                    type="number"
                    name="ceoRewardRatio"
                    value={localSettings.ceoRewardRatio}
                    onChange={handleChange}
                    className="w-full p-2 border border-slate-300 rounded focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-700 mb-3">従業員給与</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">売上掛率 (%)</label>
                  <input
                    type="number"
                    name="employeeWithLiveRatio"
                    value={localSettings.employeeWithLiveRatio}
                    onChange={handleChange}
                    className="w-full p-2 border border-slate-300 rounded focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">報酬掛率 (%)</label>
                  <input
                    type="number"
                    name="employeeRewardRatio"
                    value={localSettings.employeeRewardRatio}
                    onChange={handleChange}
                    className="w-full p-2 border border-slate-300 rounded focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 物販商品設定 */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
            <ShoppingCart className="text-pink-500" size={20} /> 物販商品設定
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                <tr>
                  <th className="p-3 rounded-l-lg">商品ID (システム用)</th>
                  <th className="p-3">商品名</th>
                  <th className="p-3 rounded-r-lg">価格 (円)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(localSettings.products)
                  .sort(([, a], [, b]) => a.order - b.order)
                  .map(([key, product]) => (
                  <tr key={key} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono text-slate-400">{key}</td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={product.name}
                        onChange={(e) => handleProductChange(key, "name", e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded focus:border-pink-500"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        value={product.price}
                        onChange={(e) => handleProductChange(key, "price", e.target.value)}
                        className="w-32 p-2 border border-slate-200 rounded focus:border-pink-500 text-right"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 mt-4 text-right">※ 現時点では商品の追加・削除はできません。価格と名称のみ変更可能です。</p>
        </section>
      </div>
    </div>
  );
}

