"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Plus, Trash2, Volume2, ArrowLeft, Timer as TimerIcon, Palette } from "lucide-react";
import Link from "next/link";

interface TimerState {
  id: string;
  name: string;
  timeLeft: number; // milliseconds
  duration: number; // initial duration for progress bar
  isRunning: boolean;
  color: string;
}

const DEFAULT_MEMBERS = ["レーン 1", "レーン 2", "レーン 3"];
const MEMBER_COLORS = [
  { name: "Red", value: "#ef4444", bg: "bg-red-50", border: "border-red-500", text: "text-red-600" },
  { name: "Blue", value: "#3b82f6", bg: "bg-blue-50", border: "border-blue-500", text: "text-blue-600" },
  { name: "Green", value: "#22c55e", bg: "bg-green-50", border: "border-green-500", text: "text-green-600" },
  { name: "Yellow", value: "#eab308", bg: "bg-yellow-50", border: "border-yellow-500", text: "text-yellow-600" },
  { name: "Purple", value: "#a855f7", bg: "bg-purple-50", border: "border-purple-500", text: "text-purple-600" },
  { name: "Pink", value: "#ec4899", bg: "bg-pink-50", border: "border-pink-500", text: "text-pink-600" },
  { name: "Orange", value: "#f97316", bg: "bg-orange-50", border: "border-orange-500", text: "text-orange-600" },
  { name: "Cyan", value: "#06b6d4", bg: "bg-cyan-50", border: "border-cyan-500", text: "text-cyan-600" },
];

export default function ChekiTimerPage() {
  // タイマーの状態管理
  const [timers, setTimers] = useState<TimerState[]>(() => 
    DEFAULT_MEMBERS.map((name, index) => ({
      id: Math.random().toString(36).substr(2, 9),
      name,
      timeLeft: 0,
      duration: 0,
      isRunning: false,
      color: MEMBER_COLORS[index % MEMBER_COLORS.length].value,
    }))
  );
  
  const [volume, setVolume] = useState(0.5);
  const audioContextRef = useRef<AudioContext | null>(null);

  // タイマーの更新処理
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prevTimers) => {
        let hasChanges = false;
        const newTimers = prevTimers.map((timer) => {
          if (timer.isRunning && timer.timeLeft > 0) {
            hasChanges = true;
            const newTime = Math.max(0, timer.timeLeft - 100);
            
            // 0になった瞬間に音を鳴らす
            if (newTime === 0 && timer.timeLeft > 0) {
              playAlarm();
            }
            
            return {
              ...timer,
              timeLeft: newTime,
              isRunning: newTime > 0, // 0になったら停止
            };
          }
          return timer;
        });
        
        return hasChanges ? newTimers : prevTimers;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // 音を鳴らす機能 (Beep音) - ピピッピピッピピッ と長めに鳴らす
  const playAlarm = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const playTone = (startTime: number, duration: number, freq: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        
        gain.gain.setValueAtTime(volume, startTime);
        gain.gain.setValueAtTime(volume, startTime + duration - 0.05);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);

        osc.start(startTime);
        osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    
    // パターン: ピッ・ピッ・ピッ (3回)
    playTone(now, 0.2, 1760);       // 1回目
    playTone(now + 0.3, 0.2, 1760); // 2回目
    playTone(now + 0.6, 0.4, 1760); // 3回目(少し長め)

  }, [volume]);

  // 操作関数
  const addTime = (id: string, seconds: number) => {
    setTimers((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const newTime = t.timeLeft + seconds * 1000;
          return {
            ...t,
            timeLeft: newTime,
            duration: Math.max(t.duration, newTime), 
          };
        }
        return t;
      })
    );
  };

  const toggleTimer = (id: string) => {
    setTimers((prev) =>
      prev.map((t) => {
        if (t.id === id) {
            if (t.timeLeft <= 0) return t;
            return { ...t, isRunning: !t.isRunning };
        }
        return t;
      })
    );
  };

  const resetTimer = (id: string) => {
    setTimers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, timeLeft: 0, duration: 0, isRunning: false } : t))
    );
  };

  const addMember = () => {
    setTimers((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        name: `レーン ${prev.length + 1}`,
        timeLeft: 0,
        duration: 0,
        isRunning: false,
        color: MEMBER_COLORS[prev.length % MEMBER_COLORS.length].value,
      },
    ]);
  };

  const removeTimer = (id: string) => {
    if (confirm("このタイマーを削除しますか？")) {
      setTimers((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const updateName = (id: string, newName: string) => {
    setTimers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, name: newName } : t))
    );
  };

  const updateColor = (id: string, newColor: string) => {
    setTimers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, color: newColor } : t))
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b border-slate-200 px-4 py-4 mb-8 sticky top-16 z-40 shadow-sm">
        <div className="container mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Link
              href="/"
              className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <TimerIcon className="text-rose-500" />
              チェキ会タイマー
            </h1>
          </div>
          
          <div className="flex items-center gap-6 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2 bg-slate-100 rounded-full px-4 py-2">
                <Volume2 size={18} className="text-slate-500" />
                <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1" 
                    value={volume}
                    onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setVolume(v);
                    }}
                    className="w-24 accent-rose-500"
                />
            </div>
            
            <button
              onClick={addMember}
              className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors shadow-lg"
            >
              <Plus size={18} />
              <span>レーン追加</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {timers.map((timer) => (
            <TimerCard
              key={timer.id}
              timer={timer}
              onAdd30s={() => addTime(timer.id, 30)}
              onAdd60s={() => addTime(timer.id, 60)}
              onToggle={() => toggleTimer(timer.id)}
              onReset={() => resetTimer(timer.id)}
              onRemove={() => removeTimer(timer.id)}
              onNameChange={(name) => updateName(timer.id, name)}
              onColorChange={(color) => updateColor(timer.id, color)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TimerCard({
  timer,
  onAdd30s,
  onAdd60s,
  onToggle,
  onReset,
  onRemove,
  onNameChange,
  onColorChange,
}: {
  timer: TimerState;
  onAdd30s: () => void;
  onAdd60s: () => void;
  onToggle: () => void;
  onReset: () => void;
  onRemove: () => void;
  onNameChange: (name: string) => void;
  onColorChange: (color: string) => void;
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 時間表示のフォーマット
  const totalSeconds = Math.ceil(timer.timeLeft / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  const isDanger = timer.timeLeft > 0 && timer.timeLeft <= 10000;
  const isActive = timer.timeLeft > 0;

  // 色スタイルの取得
  const colorStyle = MEMBER_COLORS.find(c => c.value === timer.color) || MEMBER_COLORS[1];
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div 
        className={`relative bg-white rounded-2xl shadow-sm border-2 transition-all overflow-visible flex flex-col ${
            timer.isRunning 
                ? `shadow-xl scale-[1.02] ${colorStyle.border} shadow-${colorStyle.name.toLowerCase()}-200`
                : isActive 
                    ? colorStyle.border
                    : "border-slate-100"
        }`}
        style={{
            borderColor: isActive || timer.isRunning ? timer.color : undefined
        }}
    >
      {/* ヘッダー */}
      <div className="p-4 flex justify-between items-center border-b border-slate-100 bg-slate-50 relative">
        <div className="flex items-center gap-2 w-full">
            <div className="relative" ref={wrapperRef}>
                <button
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="w-6 h-6 rounded-full border border-slate-200 shadow-sm flex-shrink-0"
                    style={{ backgroundColor: timer.color }}
                    title="メンバーカラー変更"
                />
                
                {showColorPicker && (
                    <div className="absolute top-full left-0 mt-2 p-2 bg-white rounded-xl shadow-xl border border-slate-100 grid grid-cols-4 gap-2 z-50 w-48">
                        {MEMBER_COLORS.map((c) => (
                            <button
                                key={c.name}
                                onClick={() => {
                                    onColorChange(c.value);
                                    setShowColorPicker(false);
                                }}
                                className="w-8 h-8 rounded-full border border-slate-200 hover:scale-110 transition-transform"
                                style={{ backgroundColor: c.value }}
                                title={c.name}
                            />
                        ))}
                    </div>
                )}
            </div>
            
            <input
                type="text"
                value={timer.name}
                onChange={(e) => onNameChange(e.target.value)}
                className="font-bold text-slate-700 bg-transparent border-b border-transparent focus:border-slate-300 px-1 w-full"
            />
        </div>
        <button 
            onClick={onRemove}
            className="text-slate-300 hover:text-red-500 transition-colors p-1 flex-shrink-0"
            title="削除"
        >
            <Trash2 size={16} />
        </button>
      </div>

      {/* タイマー表示 */}
      <div className={`flex-1 flex flex-col items-center justify-center py-8 ${
          isDanger && timer.isRunning ? "animate-pulse bg-red-50" : ""
      }`}>
        <div 
            className="text-6xl font-mono font-bold tracking-tighter tabular-nums transition-colors"
            style={{ 
                color: isDanger ? '#dc2626' : timer.isRunning ? timer.color : '#cbd5e1'
            }}
        >
            {minutes > 0 && <span>{minutes}:</span>}
            <span>{seconds.toString().padStart(minutes > 0 ? 2 : 1, '0')}</span>
            <span className="text-xl ml-1 font-sans font-normal text-slate-400">s</span>
        </div>
      </div>

      {/* コントロール */}
      <div className="p-4 bg-slate-50 space-y-4">
        {/* 時間追加ボタン */}
        <div className="grid grid-cols-2 gap-3">
            <button
                onClick={onAdd30s}
                className="bg-white border border-slate-200 text-slate-700 py-2 rounded-lg font-bold shadow-sm hover:bg-slate-50 hover:border-current hover:text-current active:scale-95 transition-all flex flex-col items-center justify-center h-16"
                style={{ 
                    '--tw-text-opacity': 1,
                    color: isActive ? timer.color : undefined
                } as React.CSSProperties}
            >
                <span className="text-lg">+30</span>
                <span className="text-[10px] font-normal opacity-70">1枚 / Half</span>
            </button>
            <button
                onClick={onAdd60s}
                className="bg-white border border-slate-200 text-slate-700 py-2 rounded-lg font-bold shadow-sm hover:bg-slate-50 hover:border-current hover:text-current active:scale-95 transition-all flex flex-col items-center justify-center h-16"
                style={{ 
                    '--tw-text-opacity': 1,
                    color: isActive ? timer.color : undefined
                } as React.CSSProperties}
            >
                <span className="text-lg">+60</span>
                <span className="text-[10px] font-normal opacity-70">2枚 / Normal</span>
            </button>
        </div>

        {/* 再生制御 */}
        <div className="grid grid-cols-3 gap-3">
            <button
                onClick={onReset}
                className="col-span-1 bg-slate-200 text-slate-600 rounded-lg flex items-center justify-center hover:bg-slate-300 hover:text-slate-800 transition-colors h-14"
                title="リセット (Clean)"
            >
                <RotateCcw size={20} />
            </button>
            
            <button
                onClick={onToggle}
                disabled={timer.timeLeft <= 0}
                className={`col-span-2 rounded-lg flex items-center justify-center gap-2 font-bold text-white shadow-lg transition-all h-14 ${
                    timer.timeLeft <= 0 ? "bg-slate-300 cursor-not-allowed" : ""
                }`}
                style={{
                    backgroundColor: timer.timeLeft > 0 ? timer.color : undefined,
                    boxShadow: timer.timeLeft > 0 && timer.isRunning ? `0 10px 15px -3px ${timer.color}40` : undefined
                }}
            >
                {timer.isRunning ? (
                    <>
                        <Pause fill="currentColor" /> STOP
                    </>
                ) : (
                    <>
                        <Play fill="currentColor" /> START
                    </>
                )}
            </button>
        </div>
      </div>
    </div>
  );
}
