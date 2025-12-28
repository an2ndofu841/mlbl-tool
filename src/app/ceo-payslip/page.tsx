"use client";

import { useState, useEffect, useRef } from "react";
import { Employee } from "@/types";
import { useSettings } from "@/context/SettingsContext";
import { Download, RefreshCw, ChevronLeft, Calendar, Wallet, FileText, User } from "lucide-react";
import Link from "next/link";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function CeoPayslipPage() {
  const { settings, isLoading: settingsLoading } = useSettings();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 入力データ
  const [formData, setFormData] = useState({
    targetYearMonth: new Date().toISOString().slice(0, 7),
    paymentDate: new Date().toISOString().slice(0, 10),
    employeeId: "",
    name: "",
    address: "",
    bankName: "",
    branchName: "",
    accountType: "普通",
    accountNumber: "",
    accountHolder: "",
    withLiveSales: 0,
    operatingExpenses: 0,
    remarks: "",
  });

  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedData = localStorage.getItem("cf_employees");
    if (storedData) {
      setEmployees(JSON.parse(storedData));
    }
    setLoading(false);
  }, []);

  const handleEmployeeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const emp = employees.find((e) => e.id === id);
    
    if (emp) {
      setFormData((prev) => ({
        ...prev,
        employeeId: id,
        name: emp.name,
        address: emp.address,
        bankName: emp.bankName,
        branchName: emp.branchName,
        accountType: emp.accountType,
        accountNumber: emp.accountNumber,
        accountHolder: emp.accountHolder,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        employeeId: "",
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "remarks" || name.startsWith("target") || name.startsWith("payment") || name === "name" || name === "address" || name.startsWith("bank") || name.startsWith("branch") || name.startsWith("account") 
        ? value 
        : Number(value) || 0,
    }));
  };

  // 自動計算
  const withLiveIncome = Math.floor(formData.withLiveSales * (settings.ceoWithLiveRatio / 100)); 
  const withLivePayment = Math.floor(withLiveIncome * (settings.ceoRewardRatio / 100));
  const totalPayment = formData.operatingExpenses + withLivePayment;
  const tax = Math.floor(totalPayment * (settings.taxRate / 100));
  const grandTotal = totalPayment - tax;

  const handleDownloadPdf = async () => {
    if (!previewRef.current) return;

    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        windowWidth: 1280,
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`支払明細_${formData.targetYearMonth}_${formData.name || "未設定"}.pdf`);
    } catch (error) {
      console.error("PDF generation failed", error);
      alert("PDFの生成に失敗しました。");
    }
  };

  if (loading || settingsLoading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading...</div>;

  return (
    <div className="flex flex-col xl:flex-row gap-8 min-h-screen pb-20">
      {/* 左側：入力フォーム */}
      <div className="w-full xl:w-1/3 space-y-6 print:hidden">
        <div className="flex items-center gap-2 mb-2">
            <Link href="/" className="p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-500">
                <ChevronLeft size={20} />
            </Link>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">代表給与明細作成</h2>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
            
            {/* 従業員選択 */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <User size={14} /> 代表者選択
                </label>
                <div className="flex gap-2">
                    <select 
                        className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:border-blue-500 text-slate-900"
                        onChange={handleEmployeeSelect}
                        value={formData.employeeId}
                    >
                        <option value="">-- 選択してください --</option>
                        {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                    </select>
                    <Link href="/employees" className="p-3 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors text-slate-600" title="従業員管理へ">
                        <RefreshCw size={20} />
                    </Link>
                </div>
            </div>

            {/* 基本情報 */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
                    <Calendar size={14} /> 日付設定
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">対象年月</label>
                        <input type="month" name="targetYearMonth" value={formData.targetYearMonth} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">支給日</label>
                        <input type="date" name="paymentDate" value={formData.paymentDate} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500" />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-2">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">氏名</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">住所</label>
                        <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500" />
                    </div>
                </div>
            </div>

            {/* 計算項目 */}
            <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
                    <Wallet size={14} /> 計算項目 (円)
                </div>
                
                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                    <label className="block text-sm font-bold text-indigo-900 mb-1">WithLIVE売上額</label>
                    <input type="number" name="withLiveSales" value={formData.withLiveSales} onChange={handleChange} className="w-full p-2.5 bg-white border border-indigo-200 rounded-lg text-slate-900 focus:border-indigo-500 text-right font-mono text-lg" />
                    <div className="text-xs text-indigo-600 mt-2 font-medium flex justify-between">
                        <span>入金額: ¥{withLiveIncome.toLocaleString()}</span>
                        <span>報酬: ¥{withLivePayment.toLocaleString()}</span>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">運営費</label>
                    <input type="number" name="operatingExpenses" value={formData.operatingExpenses} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 text-right font-mono" />
                </div>
            </div>

            {/* 備考 */}
            <div className="pt-2">
                <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">
                    <FileText size={14} /> 備考
                </div>
                <textarea name="remarks" value={formData.remarks} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 min-h-[100px]" />
            </div>

            <button 
              onClick={handleDownloadPdf}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2 text-lg"
            >
              <Download size={20} /> PDF出力
            </button>
        </div>
      </div>

      {/* 右側：プレビュー */}
      <div className="w-full xl:w-2/3 flex justify-center items-start pt-8 xl:pt-0 overflow-hidden">
        <div className="transform origin-top transition-transform scale-[0.42] h-[125mm] sm:scale-75 sm:h-[223mm] md:scale-100 md:h-auto xl:scale-100 xl:h-auto">
            <div className="shadow-2xl shadow-slate-400/20 rounded-sm overflow-hidden border border-slate-200">
                <div 
                ref={previewRef}
                className="bg-white p-12 box-border relative min-w-[210mm]"
                style={{ width: '210mm', minHeight: '297mm', color: '#000000' }}
                >
            {/* プレビューヘッダー */}
            <div className="text-center mb-12 relative">
                <h1 className="text-2xl font-serif font-bold tracking-widest border-b-2 border-black pb-2 inline-block px-8 mb-2">支払明細書</h1>
                <p className="text-sm font-serif">対象年月: {formData.targetYearMonth}</p>
            </div>

            {/* 宛名・会社名 */}
            <div className="flex justify-between items-start mb-12">
                <div className="w-1/2">
                <h2 className="text-xl font-bold border-b border-gray-400 pb-1 mb-2 inline-block min-w-[200px]">{formData.name} 様</h2>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{formData.address}</p>
                </div>
                <div className="w-1/2 text-right relative">
                <h3 className="font-bold text-lg mb-1 tracking-wide">{settings.companyName}</h3>
                <p className="text-sm text-gray-800">支給日: {formData.paymentDate}</p>
                
                {/* 印鑑画像プレースホルダー */}
                <div className="absolute right-0 top-8 opacity-80 pointer-events-none mix-blend-multiply">
                    <img 
                    src="/inkanmlbl.png" 
                    alt="社印" 
                    className="w-24 h-24 object-contain"
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                    }}
                    />
                </div>
                </div>
            </div>

            {/* 明細テーブル */}
            <div className="mb-8">
                <table className="w-full border-collapse border border-gray-800 text-sm">
                <thead>
                    <tr className="text-center">
                    <th className="border border-gray-800 p-2 w-1/2" style={{ backgroundColor: '#e0e7ff', color: '#000000', fontWeight: 'bold' }}>支給項目</th>
                    <th className="border border-gray-800 p-2 w-1/2" style={{ backgroundColor: '#e0e7ff', color: '#000000', fontWeight: 'bold' }}>金額 (円)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                    <td className="border border-gray-800 p-2 text-black">運営費</td>
                    <td className="border border-gray-800 p-2 text-right text-black font-mono text-base">{Number(formData.operatingExpenses).toLocaleString()}</td>
                    </tr>
                    <tr>
                    <td className="border border-gray-800 p-2 text-black">WithLIVE支給額</td>
                    <td className="border border-gray-800 p-2 text-right text-black font-mono text-base">{withLivePayment.toLocaleString()}</td>
                    </tr>
                    <tr className="font-bold">
                    <td className="border border-gray-800 p-2 text-black" style={{ backgroundColor: '#f8fafc' }}>支給合計</td>
                    <td className="border border-gray-800 p-2 text-right text-black font-mono text-base" style={{ backgroundColor: '#f8fafc' }}>{totalPayment.toLocaleString()}</td>
                    </tr>
                </tbody>
                </table>
            </div>

            <div className="mb-8">
                <table className="w-full border-collapse border border-gray-800 text-sm">
                <thead>
                    <tr className="text-center">
                    <th className="border border-gray-800 p-2 w-1/2" style={{ backgroundColor: '#fee2e2', color: '#000000', fontWeight: 'bold' }}>控除項目</th>
                    <th className="border border-gray-800 p-2 w-1/2" style={{ backgroundColor: '#fee2e2', color: '#000000', fontWeight: 'bold' }}>金額 (円)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                    <td className="border border-gray-800 p-2 text-black">源泉所得税 <span className="text-xs text-gray-700 font-medium ml-2">(支給合計の{settings.taxRate}%)</span></td>
                    <td className="border border-gray-800 p-2 text-right text-black font-mono text-base">{tax.toLocaleString()}</td>
                    </tr>
                    <tr className="font-bold">
                    <td className="border border-gray-800 p-2 text-black" style={{ backgroundColor: '#f8fafc' }}>控除合計</td>
                    <td className="border border-gray-800 p-2 text-right text-black font-mono text-base" style={{ backgroundColor: '#f8fafc' }}>{tax.toLocaleString()}</td>
                    </tr>
                </tbody>
                </table>
            </div>

            {/* 差引支給額 */}
            <div className="flex justify-end mb-12">
                <div className="w-1/2 border-2 border-black p-4" style={{ backgroundColor: '#f8fafc' }}>
                    <div className="flex justify-between items-end">
                    <span className="font-bold text-lg text-black">差引支給額</span>
                    <span className="font-bold text-2xl border-b-2 border-black px-4 text-black font-mono">{grandTotal.toLocaleString()} 円</span>
                    </div>
                </div>
            </div>

            {/* 振込先情報表示 */}
            <div className="mb-8 border border-gray-800 p-4 rounded-sm text-sm">
                <h4 className="font-bold mb-2 text-black border-b border-gray-300 pb-1 inline-block">振込先情報</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                <div><span className="text-gray-600 font-medium text-xs">銀行名:</span> <span className="text-black ml-2 font-medium">{formData.bankName}</span></div>
                <div><span className="text-gray-600 font-medium text-xs">支店名:</span> <span className="text-black ml-2 font-medium">{formData.branchName}</span></div>
                <div><span className="text-gray-600 font-medium text-xs">口座種別:</span> <span className="text-black ml-2 font-medium">{formData.accountType}</span></div>
                <div><span className="text-gray-600 font-medium text-xs">口座番号:</span> <span className="text-black ml-2 font-medium font-mono">{formData.accountNumber}</span></div>
                <div className="col-span-2 border-t border-dashed border-gray-300 pt-2 mt-1"><span className="text-gray-600 font-medium text-xs">口座名義:</span> <span className="text-black ml-2 font-medium">{formData.accountHolder}</span></div>
                </div>
            </div>

            {/* 備考欄 */}
            <div className="border border-gray-800 p-4 rounded-sm min-h-[100px] text-sm">
                <h4 className="font-bold mb-2 text-black border-b border-gray-300 pb-1 inline-block">備考</h4>
                <p className="whitespace-pre-wrap text-black mt-2 leading-relaxed">{formData.remarks}</p>
            </div>

            </div>
        </div>
        </div>
      </div>
    </div>
  );
}
