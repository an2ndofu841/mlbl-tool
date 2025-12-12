"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Minus, Download, Trash2, Save, ShoppingCart, UserCheck, Settings, FileText, Calculator, X, Check, ArrowRightLeft, Repeat, Gift } from "lucide-react";
import Link from "next/link";
import jsPDF from "jspdf";
import "jspdf-autotable";
import html2canvas from "html2canvas";

// jsPDF-autotableの型定義拡張
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// 商品定義
const PRODUCTS = {
  signedCheki: { name: "サイン付きチェキ", price: 2000 },
  normalCheki: { name: "ノーマルチェキ", price: 1000 },
  groupCheki: { name: "囲みチェキ", price: 3000 },
  personalSign: { name: "私物サイン", price: 2000 },
  sugoroku: { name: "すごろく", price: 500 },
} as const;

type ProductKey = keyof typeof PRODUCTS;

interface SaleRecord {
  id: string;
  timestamp: string;
  isMobilization: boolean;
  mobilizationType?: string; 
  customerName: string;
  benefit: string;
  
  // 2回し特典
  isDoubleDispatch: boolean;
  doubleDispatchBenefit: string;

  items: Record<ProductKey, number>;
  totalAmount: number;
}

type MobilizationMode = "single" | "multi";

export default function SalesPage() {
  // 設定
  const [eventName, setEventName] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  
  // 動員設定
  const [mobilizationMode, setMobilizationMode] = useState<MobilizationMode>("single");
  const [singleBenefit, setSingleBenefit] = useState("スゴロク1回無料");
  const [multiAreaSettings, setMultiAreaSettings] = useState({
    area1: { label: "前方", benefit: "スゴロク2回無料" },
    area2: { label: "後方", benefit: "スゴロク1回無料" },
  });

  // 2回し特典設定
  const [useDoubleDispatch, setUseDoubleDispatch] = useState(false);
  const [doubleDispatchBenefitContent, setDoubleDispatchBenefitContent] = useState("集合写メ");

  // 入力フォーム状態
  const [mobilizationSelection, setMobilizationSelection] = useState<string | null>(null); 
  const [isDoubleDispatchSelected, setIsDoubleDispatchSelected] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [items, setItems] = useState<Record<ProductKey, number>>({
    signedCheki: 0,
    normalCheki: 0,
    groupCheki: 0,
    personalSign: 0,
    sugoroku: 0,
  });

  // お釣り計算モーダル
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState<number | "">("");

  // 売上履歴
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([]);

  // 初期ロード
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const stored = localStorage.getItem(`cf_sales_${today}`);
    if (stored) {
      setSalesHistory(JSON.parse(stored));
    }
  }, []);

  // 履歴保存
  const saveHistory = (newHistory: SaleRecord[]) => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(`cf_sales_${today}`, JSON.stringify(newHistory));
    setSalesHistory(newHistory);
  };

  // 数量変更ハンドラ
  const updateItem = (key: ProductKey, delta: number) => {
    setItems(prev => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta)
    }));
  };

  // 合計金額計算
  const currentTotal = Object.entries(items).reduce((sum, [key, count]) => {
    return sum + (PRODUCTS[key as ProductKey].price * count);
  }, 0);

  // 現在選択されている特典内容を取得（表示用配列）
  const getCurrentBenefitList = () => {
    let benefits = [];
    
    // 動員特典
    if (mobilizationSelection) {
        if (mobilizationMode === "single") benefits.push({ label: "動員特典", content: singleBenefit });
        else if (mobilizationSelection === "area1") benefits.push({ label: `${multiAreaSettings.area1.label}特典`, content: multiAreaSettings.area1.benefit });
        else if (mobilizationSelection === "area2") benefits.push({ label: `${multiAreaSettings.area2.label}特典`, content: multiAreaSettings.area2.benefit });
    }
    
    // 2回し特典
    if (isDoubleDispatchSelected) {
        benefits.push({ label: "2回し特典", content: doubleDispatchBenefitContent });
    }

    return benefits;
  };

  // 保存用文字列生成
  const getCurrentBenefitString = () => {
    return getCurrentBenefitList().map(b => b.content).join(" + ");
  };

  const getCurrentAreaLabel = () => {
    if (!mobilizationSelection) return "";
    if (mobilizationMode === "single") return "動員";
    if (mobilizationSelection === "area1") return multiAreaSettings.area1.label;
    if (mobilizationSelection === "area2") return multiAreaSettings.area2.label;
    return "動員";
  };

  // 会計ボタンクリック（バリデーション～モーダル表示）
  const handleCheckoutClick = () => {
    if (currentTotal === 0 && !mobilizationSelection && !isDoubleDispatchSelected) {
      alert("商品を選択するか、動員・特典を選択してください。");
      return;
    }
    // 動員または2回し特典がある場合は名前必須
    if ((mobilizationSelection || isDoubleDispatchSelected) && !customerName.trim()) {
      alert("動員または特典適用の場合は名前を入力してください。");
      return;
    }
    setReceivedAmount(""); 
    setShowCheckoutModal(true);
  };

  // 会計確定保存
  const confirmCheckout = () => {
    const isMob = !!mobilizationSelection;
    
    const newRecord: SaleRecord = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      isMobilization: isMob,
      mobilizationType: isMob ? (mobilizationMode === "single" ? "single" : mobilizationSelection!) : undefined,
      customerName: (isMob || isDoubleDispatchSelected) ? customerName : "",
      benefit: getCurrentBenefitString(),
      
      isDoubleDispatch: isDoubleDispatchSelected,
      doubleDispatchBenefit: isDoubleDispatchSelected ? doubleDispatchBenefitContent : "",

      items: { ...items },
      totalAmount: currentTotal,
    };

    const newHistory = [newRecord, ...salesHistory];
    saveHistory(newHistory);

    // リセット
    setItems({
      signedCheki: 0,
      normalCheki: 0,
      groupCheki: 0,
      personalSign: 0,
      sugoroku: 0,
    });
    setMobilizationSelection(null);
    setIsDoubleDispatchSelected(false);
    setCustomerName("");
    setShowCheckoutModal(false);
  };

  // 履歴削除
  const handleDeleteRecord = (id: string) => {
    if (confirm("この記録を削除しますか？")) {
      const newHistory = salesHistory.filter(r => r.id !== id);
      saveHistory(newHistory);
    }
  };

  // CSV出力
  const downloadCSV = () => {
    const header = ["日時", "イベント名", "動員種別", "名前", "動員特典", "2回し特典", ...Object.values(PRODUCTS).map(p => p.name), "合計金額"];
    const rows = salesHistory.map(r => {
        return [
            new Date(r.timestamp).toLocaleString(),
            eventName,
            r.isMobilization ? (r.mobilizationType === "area1" ? "前方" : r.mobilizationType === "area2" ? "後方" : "一般") : "",
            r.customerName,
            r.benefit,
            r.isDoubleDispatch ? r.doubleDispatchBenefit : "",
            ...Object.keys(PRODUCTS).map(k => r.items[k as ProductKey]),
            r.totalAmount
        ];
    });

    const csvContent = [header, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `物販売上_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  // PDF出力準備
  const [showReport, setShowReport] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleDownloadReportPdf = async () => {
    if (!reportRef.current) return;
    
    try {
            // const html2canvas = (await import("html2canvas")).default;
            const canvas = await html2canvas(reportRef.current, { 
                scale: 2,
                useCORS: true,
                windowWidth: 1280, // PCサイズでのレンダリングを強制
            });
            const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, width, height);
      pdf.save(`売上日報_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error(e);
      alert("PDF生成に失敗しました");
    }
  };

  // 集計データ
  const totalSales = salesHistory.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalMobilization = salesHistory.filter(r => r.isMobilization).length;
  const totalDoubleDispatch = salesHistory.filter(r => r.isDoubleDispatch).length;

  const mobilizationBreakdown = salesHistory.reduce((acc, r) => {
      if (r.isMobilization) {
          const key = r.mobilizationType || "single";
          acc[key] = (acc[key] || 0) + 1;
      }
      return acc;
  }, {} as Record<string, number>);

  const itemCounts = Object.keys(PRODUCTS).reduce((acc, key) => {
    acc[key as ProductKey] = salesHistory.reduce((sum, r) => sum + r.items[key as ProductKey], 0);
    return acc;
  }, {} as Record<ProductKey, number>);

  // お釣り計算
  const changeAmount = typeof receivedAmount === "number" ? receivedAmount - currentTotal : 0;
  const isEnough = typeof receivedAmount === "number" && receivedAmount >= currentTotal;

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <ShoppingCart className="text-pink-500" /> 物販レジ
          </h2>
          <p className="text-slate-500 mt-1">
            {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
          </p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
                <Settings size={18} /> 設定
            </button>
            <button 
                onClick={() => setShowReport(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-bold"
            >
                <FileText size={18} /> 日報・出力
            </button>
        </div>
      </div>

      {showSettings && (
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8 animate-in slide-in-from-top-2">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Settings size={20}/> イベント・動員設定</h3>
            
            <div className="mb-6">
                <label className="block text-sm font-bold text-slate-600 mb-1">イベント名</label>
                <input 
                    type="text" 
                    value={eventName} 
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="例: 定期公演 Vol.5"
                    className="w-full md:w-1/2 p-2 border border-slate-300 rounded focus:border-pink-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 動員設定 */}
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <label className="block text-sm font-bold text-slate-600 mb-3">動員タイプ設定</label>
                    <div className="flex gap-4 mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="radio" 
                                name="mobMode" 
                                checked={mobilizationMode === "single"} 
                                onChange={() => setMobilizationMode("single")}
                                className="text-pink-500 focus:ring-pink-500"
                            />
                            <span className="font-bold text-slate-700">通常 (動員のみ)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="radio" 
                                name="mobMode" 
                                checked={mobilizationMode === "multi"} 
                                onChange={() => setMobilizationMode("multi")}
                                className="text-pink-500 focus:ring-pink-500"
                            />
                            <span className="font-bold text-slate-700">エリア別 (前方/後方など)</span>
                        </label>
                    </div>

                    {mobilizationMode === "single" ? (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">動員特典内容</label>
                            <input 
                                type="text" 
                                value={singleBenefit} 
                                onChange={(e) => setSingleBenefit(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded focus:border-pink-500"
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-50 rounded border border-slate-200">
                                <div className="text-xs font-bold text-pink-500 mb-2">エリア1 (前方など)</div>
                                <div className="mb-2">
                                    <label className="block text-xs text-slate-500">表示ラベル</label>
                                    <input 
                                        type="text" 
                                        value={multiAreaSettings.area1.label} 
                                        onChange={(e) => setMultiAreaSettings({...multiAreaSettings, area1: {...multiAreaSettings.area1, label: e.target.value}})}
                                        className="w-full p-1 border rounded text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500">特典内容</label>
                                    <input 
                                        type="text" 
                                        value={multiAreaSettings.area1.benefit} 
                                        onChange={(e) => setMultiAreaSettings({...multiAreaSettings, area1: {...multiAreaSettings.area1, benefit: e.target.value}})}
                                        className="w-full p-1 border rounded text-sm"
                                    />
                                </div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded border border-slate-200">
                                <div className="text-xs font-bold text-blue-500 mb-2">エリア2 (後方など)</div>
                                <div className="mb-2">
                                    <label className="block text-xs text-slate-500">表示ラベル</label>
                                    <input 
                                        type="text" 
                                        value={multiAreaSettings.area2.label} 
                                        onChange={(e) => setMultiAreaSettings({...multiAreaSettings, area2: {...multiAreaSettings.area2, label: e.target.value}})}
                                        className="w-full p-1 border rounded text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500">特典内容</label>
                                    <input 
                                        type="text" 
                                        value={multiAreaSettings.area2.benefit} 
                                        onChange={(e) => setMultiAreaSettings({...multiAreaSettings, area2: {...multiAreaSettings.area2, benefit: e.target.value}})}
                                        className="w-full p-1 border rounded text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 2回し特典設定 */}
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <label className="block text-sm font-bold text-slate-600 mb-3">オプション特典設定</label>
                    <div className="mb-4">
                        <label className="flex items-center gap-2 cursor-pointer mb-2">
                            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${useDoubleDispatch ? 'bg-indigo-500' : 'bg-slate-300'}`} onClick={() => setUseDoubleDispatch(!useDoubleDispatch)}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${useDoubleDispatch ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                            <span className="font-bold text-slate-700">2回し特典 (1日2現場など) を利用する</span>
                        </label>
                    </div>

                    {useDoubleDispatch && (
                        <div className="animate-in fade-in slide-in-from-top-1">
                             <label className="block text-xs font-bold text-slate-500 mb-1">2回し特典内容</label>
                            <input 
                                type="text" 
                                value={doubleDispatchBenefitContent} 
                                onChange={(e) => setDoubleDispatchBenefitContent(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded focus:border-indigo-500"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左側：レジ入力 */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* 動員・特典入力エリア */}
            <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="flex items-center gap-2 mb-4 font-bold text-slate-700">
                    <UserCheck size={20} className="text-pink-500" /> 動員・特典確認
                </div>
                
                {/* 動員選択 */}
                <div className="flex flex-wrap gap-3 mb-4">
                    <button
                        onClick={() => setMobilizationSelection(null)}
                        className={`px-4 py-3 rounded-xl border-2 font-bold transition-all ${!mobilizationSelection ? 'bg-slate-100 border-slate-400 text-slate-700' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                    >
                        動員なし
                    </button>

                    {mobilizationMode === "single" ? (
                        <button
                            onClick={() => setMobilizationSelection(mobilizationSelection === "single" ? null : "single")}
                            className={`px-4 py-3 rounded-xl border-2 font-bold transition-all flex-1 ${mobilizationSelection === "single" ? 'bg-pink-50 border-pink-500 text-pink-600' : 'bg-white border-slate-200 text-slate-600 hover:border-pink-300'}`}
                        >
                            動員あり
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => setMobilizationSelection(mobilizationSelection === "area1" ? null : "area1")}
                                className={`px-4 py-3 rounded-xl border-2 font-bold transition-all flex-1 ${mobilizationSelection === "area1" ? 'bg-pink-50 border-pink-500 text-pink-600' : 'bg-white border-slate-200 text-slate-600 hover:border-pink-300'}`}
                            >
                                {multiAreaSettings.area1.label}
                            </button>
                            <button
                                onClick={() => setMobilizationSelection(mobilizationSelection === "area2" ? null : "area2")}
                                className={`px-4 py-3 rounded-xl border-2 font-bold transition-all flex-1 ${mobilizationSelection === "area2" ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}
                            >
                                {multiAreaSettings.area2.label}
                            </button>
                        </>
                    )}
                </div>

                {/* 2回し特典ボタン (設定で有効な場合のみ) */}
                {useDoubleDispatch && (
                     <div className="mb-4">
                        <button
                            onClick={() => setIsDoubleDispatchSelected(!isDoubleDispatchSelected)}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-bold transition-all ${isDoubleDispatchSelected ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-dashed border-slate-300 text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Repeat size={18} /> 2回し特典 ({doubleDispatchBenefitContent})
                            {isDoubleDispatchSelected && <Check size={18} />}
                        </button>
                     </div>
                )}

                {(mobilizationSelection || isDoubleDispatchSelected) && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                         <div className="mb-3">
                            <input 
                                type="text" 
                                placeholder="お客様のお名前" 
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-slate-500 text-lg font-bold"
                                autoFocus
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {getCurrentBenefitList().map((b, i) => (
                                <div key={i} className="text-xs font-bold bg-pink-50 text-pink-600 px-3 py-1.5 rounded-lg border border-pink-100 flex items-center gap-1">
                                    <Gift size={12} /> {b.label}: {b.content}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* 商品選択エリア */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(PRODUCTS).map(([key, product]) => (
                    <div key={key} className={`bg-white p-4 rounded-2xl shadow-sm border-2 transition-all ${items[key as ProductKey] > 0 ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-slate-100'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h4 className="font-bold text-slate-800 text-lg">{product.name}</h4>
                                <p className="text-slate-500 font-mono">¥{product.price.toLocaleString()}</p>
                            </div>
                            <div className="text-3xl font-bold text-indigo-600 font-mono w-12 text-center">
                                {items[key as ProductKey]}
                            </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button 
                                onClick={() => updateItem(key as ProductKey, -1)}
                                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 font-bold flex justify-center items-center active:scale-95 transition-transform"
                                disabled={items[key as ProductKey] <= 0}
                            >
                                <Minus size={20} />
                            </button>
                            <button 
                                onClick={() => updateItem(key as ProductKey, 1)}
                                className="flex-1 py-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 font-bold flex justify-center items-center active:scale-95 transition-transform"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* 右側：会計・履歴 */}
        <div className="lg:col-span-1 space-y-6">
            {/* 合計金額パネル */}
            <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-xl sticky top-24 z-10">
                <div className="text-slate-400 text-sm font-bold mb-1">現在の会計</div>
                <div className="text-5xl font-bold font-mono tracking-tight mb-6">
                    ¥{currentTotal.toLocaleString()}
                </div>
                
                <div className="space-y-2 mb-6 text-sm text-slate-300">
                    {Object.entries(items).map(([key, count]) => count > 0 && (
                        <div key={key} className="flex justify-between">
                            <span>{PRODUCTS[key as ProductKey].name} x{count}</span>
                            <span>¥{(PRODUCTS[key as ProductKey].price * count).toLocaleString()}</span>
                        </div>
                    ))}
                    {(mobilizationSelection || isDoubleDispatchSelected) && (
                        <div className="flex justify-between text-pink-400 font-medium border-t border-slate-600 pt-2 mt-2">
                            <span>適用特典</span>
                            <span>¥0</span>
                        </div>
                    )}
                    {getCurrentBenefitList().map((b, i) => (
                        <div key={i} className="flex justify-between text-slate-400 text-xs pl-2">
                            <span>・{b.content} ({b.label})</span>
                        </div>
                    ))}
                </div>

                <button 
                    onClick={handleCheckoutClick}
                    className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl font-bold shadow-lg shadow-pink-500/30 hover:shadow-pink-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all text-xl flex items-center justify-center gap-2"
                >
                    <Calculator size={24} /> 会計へ進む
                </button>
            </div>

            {/* 最新の履歴 */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-600">
                    本日の履歴 ({salesHistory.length}件)
                </div>
                <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100">
                    {salesHistory.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">
                            まだ履歴がありません
                        </div>
                    ) : (
                        salesHistory.map((record) => (
                            <div key={record.id} className="p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="font-mono text-xs text-slate-400">
                                        {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <button onClick={() => handleDeleteRecord(record.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <div className="flex justify-between items-baseline mb-1">
                                    <div className="font-bold text-slate-700">
                                        {record.isMobilization || record.isDoubleDispatch ? (
                                            <span className="flex flex-col">
                                                <span className="flex items-center gap-1 text-slate-800">
                                                    <UserCheck size={14} /> {record.customerName}
                                                </span>
                                                <span className="flex gap-1 mt-0.5">
                                                    {record.isMobilization && (
                                                        <span className="text-[10px] bg-pink-100 text-pink-600 px-1 rounded">
                                                            {record.mobilizationType === "area1" ? "前方" : record.mobilizationType === "area2" ? "後方" : "動員"}
                                                        </span>
                                                    )}
                                                    {record.isDoubleDispatch && (
                                                        <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1 rounded">
                                                            2回し
                                                        </span>
                                                    )}
                                                </span>
                                            </span>
                                        ) : (
                                            "一般購入"
                                        )}
                                    </div>
                                    <div className="font-mono font-bold text-slate-800">
                                        ¥{record.totalAmount.toLocaleString()}
                                    </div>
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                    {Object.entries(record.items).map(([key, count]) => count > 0 && (
                                        <span key={key} className="mr-2 inline-block bg-slate-100 px-1.5 py-0.5 rounded">
                                            {PRODUCTS[key as ProductKey].name} x{count}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* 会計確認・お釣り計算モーダル */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
                    <h3 className="text-xl font-bold text-slate-800">お会計確認</h3>
                    <button onClick={() => setShowCheckoutModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-6 space-y-6 overflow-y-auto">
                    
                    {/* お買い上げ内容の確認（お客様に見せる用） */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">お買い上げ内容</div>
                        <div className="space-y-2 mb-4">
                             {Object.entries(items).map(([key, count]) => count > 0 && (
                                <div key={key} className="flex justify-between items-center text-slate-800 font-medium">
                                    <span>{PRODUCTS[key as ProductKey].name} x {count}</span>
                                    <span className="font-mono">¥{(PRODUCTS[key as ProductKey].price * count).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                        
                        {(mobilizationSelection || isDoubleDispatchSelected) && (
                            <div className="border-t border-slate-200 pt-3 mt-3">
                                <div className="text-xs font-bold text-pink-500 mb-2 uppercase tracking-wider flex items-center gap-1">
                                    <Gift size={12} /> 適用特典
                                </div>
                                <div className="space-y-2">
                                    {getCurrentBenefitList().map((b, i) => (
                                        <div key={i} className="flex justify-between items-center bg-white p-3 rounded-lg border border-pink-100 shadow-sm">
                                            <span className="font-bold text-pink-600">{b.content}</span>
                                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">{b.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div className="flex justify-between items-center mt-4 pt-4 border-t-2 border-slate-200">
                            <span className="font-bold text-lg text-slate-700">合計金額</span>
                            <span className="text-4xl font-mono font-bold text-slate-900 tracking-tight">
                                ¥{currentTotal.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">お預かり金額</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">¥</span>
                            <input 
                                type="number" 
                                value={receivedAmount}
                                onChange={(e) => setReceivedAmount(e.target.value ? Number(e.target.value) : "")}
                                placeholder="0"
                                className="w-full p-4 pl-10 bg-slate-50 border-2 border-slate-200 rounded-xl text-3xl font-mono font-bold text-slate-900 focus:border-indigo-500 focus:bg-white text-right"
                                autoFocus
                            />
                        </div>
                        {/* 簡易入力ボタン */}
                        <div className="grid grid-cols-4 gap-2 mt-2">
                            {[1000, 5000, 10000].map(amount => (
                                <button 
                                    key={amount}
                                    onClick={() => setReceivedAmount(amount)}
                                    className="py-2 bg-indigo-50 text-indigo-600 font-bold rounded-lg hover:bg-indigo-100 text-sm"
                                >
                                    ¥{amount.toLocaleString()}
                                </button>
                            ))}
                            <button 
                                onClick={() => setReceivedAmount(currentTotal)}
                                className="py-2 bg-emerald-50 text-emerald-600 font-bold rounded-lg hover:bg-emerald-100 text-sm"
                            >
                                ぴったり
                            </button>
                        </div>
                    </div>

                    <div className={`p-6 rounded-xl text-center transition-colors ${isEnough ? 'bg-emerald-50 border-2 border-emerald-100' : 'bg-slate-50 border-2 border-slate-100'}`}>
                        <div className="text-sm font-bold mb-1 text-slate-500">お釣り</div>
                        <div className={`text-4xl font-mono font-bold ${isEnough ? 'text-emerald-600' : 'text-slate-400'}`}>
                            ¥{isEnough ? changeAmount.toLocaleString() : "---"}
                        </div>
                        {!isEnough && typeof receivedAmount === "number" && receivedAmount > 0 && (
                            <div className="text-rose-500 font-bold text-sm mt-2">
                                不足: ¥{(currentTotal - receivedAmount).toLocaleString()}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex gap-4 flex-shrink-0 bg-white rounded-b-2xl">
                    <button 
                        onClick={() => setShowCheckoutModal(false)}
                        className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                    >
                        戻る
                    </button>
                    <button 
                        onClick={confirmCheckout}
                        disabled={!isEnough}
                        className="flex-1 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-bold shadow-lg shadow-pink-500/30 hover:shadow-pink-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 flex items-center justify-center gap-2"
                    >
                        <Check size={24} /> 会計確定
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* 日報レポートモーダル */}
      {showReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-100 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-auto flex flex-col">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white sticky top-0 z-10">
                    <h3 className="font-bold text-lg text-slate-800">本日の売上日報</h3>
                    <div className="flex gap-2">
                        <button onClick={() => setShowReport(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">閉じる</button>
                        <button onClick={downloadCSV} className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-bold hover:bg-emerald-200">CSV出力</button>
                        <button onClick={handleDownloadReportPdf} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30">PDF出力</button>
                    </div>
                </div>
                
                <div className="p-4 md:p-8 flex justify-center bg-slate-500/10 overflow-hidden">
                    <div className="transform origin-top transition-transform scale-[0.42] h-[125mm] sm:scale-75 sm:h-[223mm] md:scale-100 md:h-auto">
                        <div ref={reportRef} className="bg-white p-12 shadow-xl min-h-[297mm] w-[210mm] min-w-[210mm] text-black box-border mx-auto" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
                            <h1 className="text-2xl font-bold text-center border-b-2 border-black pb-4 mb-8" style={{ borderColor: '#000000' }}>物販売上日報</h1>
                        
                        <div className="flex justify-between mb-8">
                            <div>
                                <p className="mb-2"><span className="font-bold">日付:</span> {new Date().toLocaleDateString()}</p>
                                <p><span className="font-bold">イベント名:</span> {eventName || "未設定"}</p>
                                <p><span className="font-bold">動員設定:</span> {mobilizationMode === "single" ? "通常" : "エリア別"}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500" style={{ color: '#6b7280' }}>作成日: {new Date().toLocaleString()}</p>
                            </div>
                        </div>

                        {/* サマリー */}
                        <div className="grid grid-cols-2 gap-8 mb-12">
                            <div className="border-2 border-black p-6" style={{ backgroundColor: '#f8fafc', borderColor: '#000000' }}>
                                <h3 className="text-lg font-bold mb-4 border-b border-gray-300 pb-2" style={{ borderColor: '#d1d5db' }}>売上合計</h3>
                                <p className="text-4xl font-mono font-bold text-right">¥{totalSales.toLocaleString()}</p>
                            </div>
                            <div className="border-2 border-black p-6" style={{ backgroundColor: '#f8fafc', borderColor: '#000000' }}>
                                <h3 className="text-lg font-bold mb-4 border-b border-gray-300 pb-2" style={{ borderColor: '#d1d5db' }}>動員数</h3>
                                <div className="text-right">
                                    <p className="text-4xl font-mono font-bold">{totalMobilization} <span className="text-xl font-normal">人</span></p>
                                    <div className="text-sm text-gray-500 mt-2" style={{ color: '#6b7280' }}>
                                        (2回し: {totalDoubleDispatch}人)
                                    </div>
                                    {mobilizationMode === "multi" && (
                                        <div className="text-sm text-gray-500 mt-1" style={{ color: '#6b7280' }}>
                                            {multiAreaSettings.area1.label}: {mobilizationBreakdown["area1"] || 0}人 / {multiAreaSettings.area2.label}: {mobilizationBreakdown["area2"] || 0}人
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 商品別内訳 */}
                        <h3 className="font-bold text-lg mb-4 p-2" style={{ backgroundColor: '#f1f5f9' }}>商品別売上</h3>
                        <table className="w-full border-collapse border border-gray-300 mb-8" style={{ borderColor: '#d1d5db' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f1f5f9' }}>
                                    <th className="border border-gray-300 p-2 text-left" style={{ borderColor: '#d1d5db' }}>商品名</th>
                                    <th className="border border-gray-300 p-2 text-right" style={{ borderColor: '#d1d5db' }}>単価</th>
                                    <th className="border border-gray-300 p-2 text-right" style={{ borderColor: '#d1d5db' }}>販売数</th>
                                    <th className="border border-gray-300 p-2 text-right" style={{ borderColor: '#d1d5db' }}>小計</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(PRODUCTS).map(([key, product]) => (
                                    <tr key={key}>
                                        <td className="border border-gray-300 p-2" style={{ borderColor: '#d1d5db' }}>{product.name}</td>
                                        <td className="border border-gray-300 p-2 text-right" style={{ borderColor: '#d1d5db' }}>¥{product.price.toLocaleString()}</td>
                                        <td className="border border-gray-300 p-2 text-right" style={{ borderColor: '#d1d5db' }}>{itemCounts[key as ProductKey]}</td>
                                        <td className="border border-gray-300 p-2 text-right" style={{ borderColor: '#d1d5db' }}>¥{(product.price * itemCounts[key as ProductKey]).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* 動員リスト */}
                        <h3 className="font-bold text-lg mb-4 p-2" style={{ backgroundColor: '#f1f5f9' }}>動員リスト</h3>
                        <table className="w-full border-collapse border border-gray-300 text-sm" style={{ borderColor: '#d1d5db' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f1f5f9' }}>
                                    <th className="border border-gray-300 p-2 text-left" style={{ borderColor: '#d1d5db' }}>時間</th>
                                    <th className="border border-gray-300 p-2 text-left" style={{ borderColor: '#d1d5db' }}>名前</th>
                                    <th className="border border-gray-300 p-2 text-left" style={{ borderColor: '#d1d5db' }}>区分</th>
                                    <th className="border border-gray-300 p-2 text-left" style={{ borderColor: '#d1d5db' }}>特典</th>
                                    <th className="border border-gray-300 p-2 text-right" style={{ borderColor: '#d1d5db' }}>購入額</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salesHistory.filter(r => r.isMobilization || r.isDoubleDispatch).map(r => (
                                    <tr key={r.id}>
                                        <td className="border border-gray-300 p-2 font-mono" style={{ borderColor: '#d1d5db' }}>{new Date(r.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                        <td className="border border-gray-300 p-2" style={{ borderColor: '#d1d5db' }}>{r.customerName}</td>
                                        <td className="border border-gray-300 p-2" style={{ borderColor: '#d1d5db' }}>
                                            {r.isMobilization ? (r.mobilizationType === "area1" ? multiAreaSettings.area1.label : r.mobilizationType === "area2" ? multiAreaSettings.area2.label : "一般") : "特典のみ"}
                                            {r.isDoubleDispatch && <span style={{ marginLeft: '4px', backgroundColor: '#e0e7ff', padding: '2px 4px', borderRadius: '4px', fontSize: '10px' }}>2回し</span>}
                                        </td>
                                        <td className="border border-gray-300 p-2" style={{ borderColor: '#d1d5db' }}>
                                            {r.benefit}
                                            {r.isDoubleDispatch && r.benefit && " + "}
                                            {r.isDoubleDispatch && r.doubleDispatchBenefit}
                                        </td>
                                        <td className="border border-gray-300 p-2 text-right" style={{ borderColor: '#d1d5db' }}>¥{r.totalAmount.toLocaleString()}</td>
                                    </tr>
                                ))}
                                {salesHistory.filter(r => r.isMobilization || r.isDoubleDispatch).length === 0 && (
                                    <tr><td colSpan={5} className="p-4 text-center text-gray-500" style={{ color: '#6b7280', borderColor: '#d1d5db' }}>動員記録なし</td></tr>
                                )}
                            </tbody>
                        </table>

                        <div className="mt-12 text-center text-sm text-gray-400" style={{ color: '#9ca3af' }}>
                            株式会社めしあがレーベル 社内業務効率化ツール
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </div>
      )}

    </div>
  );
}
