"use client";

import React, { useState } from "react";
import { Printer, MapPin, Package, ArrowLeft } from "lucide-react";
import Link from "next/link";

type Country = "Japan" | "Australia" | "USA" | "UK";
type LabelSize = "standard" | "half";

interface AddressData {
  name: string;
  postalCode: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: Country;
}

const COMPANY_ADDRESS = {
  zip: "150-0044",
  address: "東京都渋谷区円山町5番3号 MIEUX渋谷ビル8階",
  name: "株式会社めしあがレーベル",
};

export default function AddressLabelPage() {
  const [size, setSize] = useState<LabelSize>("standard");
  const [data, setData] = useState<AddressData>({
    name: "",
    postalCode: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "Japan",
  });

  const handlePrint = () => {
    window.print();
  };

  const isJapan = data.country === "Japan";

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* 印刷時には非表示にするナビゲーション */}
      <div className="print:hidden">
        <div className="bg-white border-b border-slate-200 px-4 py-4 mb-8">
          <div className="container mx-auto max-w-5xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Package className="text-blue-600" />
                住所ラベル作成
              </h1>
            </div>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
            >
              <Printer size={18} />
              <span>印刷する</span>
            </button>
          </div>
        </div>

        <div className="container mx-auto max-w-5xl px-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 入力フォーム */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <MapPin size={18} className="text-slate-400" />
                発送先情報
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    国 / Country
                  </label>
                  <select
                    value={data.country}
                    onChange={(e) =>
                      setData({ ...data, country: e.target.value as Country })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="Japan">日本 (Japan)</option>
                    <option value="Australia">オーストラリア (Australia)</option>
                    <option value="USA">アメリカ (USA)</option>
                    <option value="UK">イギリス (UK)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {isJapan ? "氏名 / 会社名" : "Recipient Name"}
                  </label>
                  <input
                    type="text"
                    value={data.name}
                    onChange={(e) => setData({ ...data, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder={isJapan ? "山田 太郎" : "John Doe"}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {isJapan ? "郵便番号" : "Zip / Postal Code"}
                    </label>
                    <input
                      type="text"
                      value={data.postalCode}
                      onChange={(e) =>
                        setData({ ...data, postalCode: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder={isJapan ? "123-4567" : "10001"}
                    />
                  </div>
                  {!isJapan && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        State / Province
                      </label>
                      <input
                        type="text"
                        value={data.state}
                        onChange={(e) =>
                          setData({ ...data, state: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="NY"
                      />
                    </div>
                  )}
                </div>

                {!isJapan && (
                   <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={data.city}
                      onChange={(e) =>
                        setData({ ...data, city: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="New York"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {isJapan ? "住所 1 (都道府県・市区町村・番地)" : "Address Line 1 (Street address)"}
                  </label>
                  <input
                    type="text"
                    value={data.addressLine1}
                    onChange={(e) =>
                      setData({ ...data, addressLine1: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder={
                      isJapan
                        ? "東京都渋谷区円山町..."
                        : "1234 Main St"
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {isJapan ? "住所 2 (建物名・部屋番号)" : "Address Line 2 (Apt, Suite, etc.)"}
                  </label>
                  <input
                    type="text"
                    value={data.addressLine2}
                    onChange={(e) =>
                      setData({ ...data, addressLine2: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder={isJapan ? "MIEUX渋谷ビル8階" : "Apt 101"}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-800 mb-4">設定</h2>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  ラベルサイズ
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSize("standard")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      size === "standard"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="font-bold mb-1">封筒サイズ</div>
                    <div className="text-xs opacity-70">一般的な封筒向け</div>
                  </button>
                  <button
                    onClick={() => setSize("half")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      size === "half"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="font-bold mb-1">ハーフサイズ</div>
                    <div className="text-xs opacity-70">小さめの梱包向け</div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* プレビュー */}
          <div className="lg:sticky lg:top-8 h-fit">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Printer size={18} className="text-slate-400" />
              プレビュー
            </h2>
            <div className="bg-slate-200 p-8 rounded-xl overflow-auto flex justify-center">
              <LabelPreview data={data} size={size} />
            </div>
            <p className="text-center text-sm text-slate-500 mt-4">
              ※ 実際の印刷結果はプリンター設定に依存します。<br />
              倍率を調整して印刷してください。
            </p>
          </div>
        </div>
      </div>

      {/* 印刷用レイアウト (画面上は非表示) */}
      <div className="hidden print:block print:fixed print:top-0 print:left-0 print:z-50">
        <LabelPreview data={data} size={size} isPrint />
      </div>
    </div>
  );
}

function LabelPreview({
  data,
  size,
  isPrint = false,
}: {
  data: AddressData;
  size: LabelSize;
  isPrint?: boolean;
}) {
  const isJapan = data.country === "Japan";
  
  // サイズ定義 (mm換算ではなく、画面表示用の相対サイズまたは印刷時のCSSサイズ)
  // 封筒サイズ想定: 幅広
  // ハーフ: 少し小さめ
  
  const containerClass = `bg-white border-2 border-slate-800 p-8 flex flex-col justify-between ${
    size === "standard" 
      ? "w-[120mm] h-[65mm]" // 長形3号等の幅に近いイメージ、あるいは宛名シールサイズ
      : "w-[85mm] h-[50mm]"  // その半分くらい
  } ${isPrint ? "" : "shadow-lg scale-125 origin-top"}`; 
  // プレビュー時は見やすく少し拡大

  return (
    <div className={containerClass} style={{ boxSizing: 'border-box' }}>
      {/* 宛先 */}
      <div className="flex-1">
        <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold border border-slate-800 px-1 py-0.5">
                TO
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {data.country === "Japan" ? "JAPAN" : data.country.toUpperCase()}
            </span>
        </div>
        
        <div className={`font-serif leading-tight ${size === "standard" ? "text-lg" : "text-sm"}`}>
            <div className="font-bold mb-1">{data.name || "（受取人名）"}</div>
            
            {isJapan ? (
                <>
                    <div>〒 {data.postalCode || "000-0000"}</div>
                    <div>{data.addressLine1 || "（住所1）"}</div>
                    {data.addressLine2 && <div>{data.addressLine2}</div>}
                </>
            ) : (
                <>
                    <div>{data.addressLine1 || "(Address Line 1)"}</div>
                    {data.addressLine2 && <div>{data.addressLine2}</div>}
                    <div>
                        {data.city ? `${data.city}, ` : ""}
                        {data.state} {data.postalCode}
                    </div>
                    <div className="font-bold mt-1 uppercase">{data.country}</div>
                </>
            )}
        </div>
      </div>

      {/* 差出人 (下部に小さく) */}
      <div className="mt-4 pt-2 border-t border-slate-300 text-[8px] text-slate-500 flex flex-col">
        <div className="flex justify-between items-end">
            <div>
                <div className="font-bold text-[9px] mb-0.5">FROM: {COMPANY_ADDRESS.name}</div>
                <div className="leading-tight">
                    〒{COMPANY_ADDRESS.zip} {COMPANY_ADDRESS.address}
                </div>
            </div>
            <div className="text-[8px] font-mono opacity-50">
                CF-TOOL
            </div>
        </div>
      </div>
    </div>
  );
}

