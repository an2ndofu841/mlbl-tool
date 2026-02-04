import Link from "next/link";
import { FileText, Users, Briefcase, ArrowRight, Music, Settings, Calendar } from "lucide-react";

export default function Home() {
  const tools = [
    {
      title: "CrazyFantasy給与明細作成",
      description: "タレント/スタッフ向けの給与明細を作成・PDF出力します。",
      href: "/payslip",
      icon: <FileText className="w-8 h-8 text-white" />,
      gradient: "from-blue-500 to-cyan-500",
      shadow: "shadow-blue-500/20"
    },
    {
      title: "代表給与明細作成",
      description: "代表者向けの支払明細書を作成・PDF出力します。",
      href: "/ceo-payslip",
      icon: <Briefcase className="w-8 h-8 text-white" />,
      gradient: "from-indigo-500 to-purple-500",
      shadow: "shadow-indigo-500/20"
    },
    {
      title: "従業員・振込先管理",
      description: "給与明細に使用する従業員情報と振込先を管理します。",
      href: "/employees",
      icon: <Users className="w-8 h-8 text-white" />,
      gradient: "from-emerald-500 to-teal-500",
      shadow: "shadow-emerald-500/20"
    },
    {
      title: "物販レジ・売上管理",
      description: "現場でのチェキ・物販の会計入力、動員管理、日報出力を行います。",
      href: "/sales",
      icon: <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
      gradient: "from-pink-500 to-rose-500",
      shadow: "shadow-pink-500/20"
    },
    {
      title: "住所ラベル作成",
      description: "発送用の住所ラベルを作成・印刷します。（国内・海外対応）",
      href: "/address-label",
      icon: <FileText className="w-8 h-8 text-white" />,
      gradient: "from-orange-500 to-amber-500",
      shadow: "shadow-orange-500/20"
    },
    {
      title: "チェキ会タイマー",
      description: "複数レーンの時間を一括管理するタイマーです。",
      href: "/cheki-timer",
      icon: <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      gradient: "from-rose-500 to-red-500",
      shadow: "shadow-rose-500/20"
    },
    {
      title: "Liveスケジュール管理",
      description: "Live予定の登録と公開カレンダー連携を行います。",
      href: "/live-schedule",
      icon: <Calendar className="w-8 h-8 text-white" />,
      gradient: "from-cyan-500 to-blue-500",
      shadow: "shadow-cyan-500/20"
    },
    {
      title: "セットリスト作成",
      description: "PA向けのセットリスト作成とCD用データ出力を行います。",
      href: "/setlist",
      icon: <Music className="w-8 h-8 text-white" />,
      gradient: "from-violet-500 to-purple-500",
      shadow: "shadow-violet-500/20"
    },
    {
      title: "イベント・会場管理",
      description: "セットリストで使用するイベント名や会場名を管理します。",
      href: "/setlist/manage",
      icon: <Settings className="w-8 h-8 text-white" />,
      gradient: "from-slate-500 to-gray-500",
      shadow: "shadow-slate-500/20"
    }
  ];

  return (
    <div className="max-w-5xl mx-auto py-12">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold mb-4 text-slate-800 tracking-tight">Dashboard</h2>
        <p className="text-slate-500">業務を選択してください</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {tools.map((tool) => (
          <Link 
            key={tool.href} 
            href={tool.href}
            className="group relative bg-white rounded-2xl p-8 hover:-translate-y-2 transition-all duration-300 ease-out shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
          >
            {/* 背景の装飾 */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${tool.gradient} opacity-10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110`} />
            
            <div className="relative">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tool.gradient} ${tool.shadow} shadow-lg flex items-center justify-center mb-6 group-hover:rotate-3 transition-transform duration-300`}>
                {tool.icon}
              </div>
              
              <h3 className="text-xl font-bold mb-3 text-slate-800 group-hover:text-blue-600 transition-colors">
                {tool.title}
              </h3>
              
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                {tool.description}
              </p>
              
              <div className="flex items-center text-sm font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
                Access Tool <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
