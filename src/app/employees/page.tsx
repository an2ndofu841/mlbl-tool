"use client";

import { useState, useEffect } from "react";
import { Employee } from "@/types";
import { Plus, Edit, Trash2, Save, X, Search, CreditCard, User } from "lucide-react";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    const storedData = localStorage.getItem("cf_employees");
    if (storedData) {
      setEmployees(JSON.parse(storedData));
    }
  }, []);

  const saveToLocalStorage = (data: Employee[]) => {
    localStorage.setItem("cf_employees", JSON.stringify(data));
  };

  const handleAddNew = () => {
    setCurrentEmployee({
      id: crypto.randomUUID(),
      name: "",
      address: "",
      bankName: "",
      branchName: "",
      accountType: "普通",
      accountNumber: "",
      accountHolder: "",
    });
    setIsEditing(true);
  };

  const handleEdit = (employee: Employee) => {
    setCurrentEmployee({ ...employee });
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("本当に削除してもよろしいですか？")) {
      const updated = employees.filter((e) => e.id !== id);
      setEmployees(updated);
      saveToLocalStorage(updated);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmployee) return;

    let updatedEmployees;
    const existingIndex = employees.findIndex((e) => e.id === currentEmployee.id);

    if (existingIndex >= 0) {
      updatedEmployees = [...employees];
      updatedEmployees[existingIndex] = currentEmployee;
    } else {
      updatedEmployees = [...employees, currentEmployee];
    }

    setEmployees(updatedEmployees);
    saveToLocalStorage(updatedEmployees);
    setIsEditing(false);
    setCurrentEmployee(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentEmployee(null);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">従業員管理</h2>
          <p className="text-slate-500 mt-2">給与明細の宛先となる従業員情報を管理します</p>
        </div>
        {!isEditing && (
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all font-bold"
          >
            <Plus size={20} /> 新規登録
          </button>
        )}
      </div>

      {isEditing && currentEmployee ? (
        <div className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              {employees.some((e) => e.id === currentEmployee.id) ? <Edit className="text-blue-500"/> : <Plus className="text-emerald-500"/>}
              {employees.some((e) => e.id === currentEmployee.id) ? "従業員情報を編集" : "新規従業員登録"}
            </h3>
            <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X size={24} />
            </button>
          </div>
          
          <form onSubmit={handleSave}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* 基本情報セクション */}
              <div className="space-y-6">
                 <div className="flex items-center gap-2 text-slate-400 font-bold text-sm uppercase tracking-wider mb-2">
                    <User size={16} /> 基本情報
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">氏名</label>
                    <input
                      type="text"
                      required
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 text-slate-900 transition-all placeholder:text-slate-400"
                      placeholder="例: 山田 太郎"
                      value={currentEmployee.name}
                      onChange={(e) => setCurrentEmployee({ ...currentEmployee, name: e.target.value })}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">住所</label>
                    <input
                      type="text"
                      required
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 text-slate-900 transition-all placeholder:text-slate-400"
                      placeholder="〒000-0000 東京都..."
                      value={currentEmployee.address}
                      onChange={(e) => setCurrentEmployee({ ...currentEmployee, address: e.target.value })}
                    />
                 </div>
              </div>

              {/* 振込先セクション */}
              <div className="space-y-6">
                 <div className="flex items-center gap-2 text-slate-400 font-bold text-sm uppercase tracking-wider mb-2">
                    <CreditCard size={16} /> 振込先情報
                 </div>
                 <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-100 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">銀行名</label>
                          <input
                            type="text"
                            required
                            className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:border-blue-500 text-slate-900"
                            value={currentEmployee.bankName}
                            onChange={(e) => setCurrentEmployee({ ...currentEmployee, bankName: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">支店名</label>
                          <input
                            type="text"
                            required
                            className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:border-blue-500 text-slate-900"
                            value={currentEmployee.branchName}
                            onChange={(e) => setCurrentEmployee({ ...currentEmployee, branchName: e.target.value })}
                          />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1">
                          <label className="block text-sm font-bold text-slate-700 mb-2">種別</label>
                          <select
                            className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:border-blue-500 text-slate-900"
                            value={currentEmployee.accountType}
                            onChange={(e) => setCurrentEmployee({ ...currentEmployee, accountType: e.target.value })}
                          >
                            <option value="普通">普通</option>
                            <option value="当座">当座</option>
                            <option value="貯蓄">貯蓄</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-bold text-slate-700 mb-2">口座番号</label>
                          <input
                            type="text"
                            required
                            className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:border-blue-500 text-slate-900 font-mono"
                            value={currentEmployee.accountNumber}
                            onChange={(e) => setCurrentEmployee({ ...currentEmployee, accountNumber: e.target.value })}
                          />
                        </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">口座名義 (カタカナ)</label>
                      <input
                        type="text"
                        required
                        className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:border-blue-500 text-slate-900"
                        value={currentEmployee.accountHolder}
                        onChange={(e) => setCurrentEmployee({ ...currentEmployee, accountHolder: e.target.value })}
                      />
                    </div>
                 </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-bold transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all font-bold"
              >
                <Save size={18} /> 保存する
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 backdrop-blur border-b border-slate-200">
              <tr>
                <th className="p-6 font-bold text-slate-600 text-sm uppercase tracking-wider">氏名 / 住所</th>
                <th className="p-6 font-bold text-slate-600 text-sm uppercase tracking-wider">銀行情報</th>
                <th className="p-6 font-bold text-slate-600 text-sm uppercase tracking-wider">口座情報</th>
                <th className="p-6 font-bold text-slate-600 text-sm uppercase tracking-wider text-right">アクション</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                        <User size={48} className="mb-4 opacity-20" />
                        <p className="text-lg font-medium text-slate-600">登録されている従業員はいません</p>
                        <p className="text-sm mt-1">右上の「新規登録」ボタンから追加してください</p>
                    </div>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-6">
                      <div className="font-bold text-lg text-slate-800 mb-1">{emp.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        {emp.address}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="font-medium text-slate-800">{emp.bankName}</div>
                      <div className="text-sm text-slate-500">{emp.branchName}</div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded font-bold text-slate-600 uppercase tracking-wide">{emp.accountType}</span>
                        <span className="font-mono text-slate-700 tracking-wider">{emp.accountNumber}</span>
                      </div>
                      <div className="text-xs text-slate-500">{emp.accountHolder}</div>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(emp)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="編集"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="削除"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
