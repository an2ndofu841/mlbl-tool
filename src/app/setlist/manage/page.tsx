import Link from "next/link";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";

export default function ManagePage() {
  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <ArrowLeft size={24} />
        </Link>
        <div>
            <h2 className="text-3xl font-bold text-slate-800">マスタデータ管理</h2>
            <p className="text-slate-500">セットリスト作成時に使用する情報を管理します</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link 
            href="/setlist/events"
            className="block p-8 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all group"
        >
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Calendar size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2 group-hover:text-blue-600">イベント名管理</h3>
            <p className="text-sm text-slate-500">よく出演するイベント名を登録・削除します。</p>
        </Link>

        <Link 
            href="/setlist/venues"
            className="block p-8 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-emerald-300 transition-all group"
        >
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MapPin size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2 group-hover:text-emerald-600">会場名管理</h3>
            <p className="text-sm text-slate-500">よく利用する会場（ライブハウス）名を登録・削除します。</p>
        </Link>
      </div>
    </div>
  );
}

