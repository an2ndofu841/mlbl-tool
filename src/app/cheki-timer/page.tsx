"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Plus, Trash2, Volume2, ArrowLeft, Timer as TimerIcon } from "lucide-react";
import Link from "next/link";

interface TimerState {
  id: string;
  name: string;
  timeLeft: number; // milliseconds
  duration: number; // initial duration for progress bar
  isRunning: boolean;
}

const DEFAULT_MEMBERS = ["レーン 1", "レーン 2", "レーン 3"];

export default function ChekiTimerPage() {
  // タイマーの状態管理
  const [timers, setTimers] = useState<TimerState[]>(() => 
    DEFAULT_MEMBERS.map((name) => ({
      id: Math.random().toString(36).substr(2, 9),
      name,
      timeLeft: 0,
      duration: 0,
      isRunning: false,
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
  }, []); // volumeを含めると再生成されるが、playAlarmはref経由でvolumeを見るようにするか、ここでの参照は避ける

  // 音を鳴らす機能 (Beep音)
  const playAlarm = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.setValueAtTime(1760, ctx.currentTime + 0.1); // A6
    
    // 音量調整
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
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
            duration: Math.max(t.duration, newTime), // プログレスバー用に最大値を保持しておくなどのロジック
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
            // 時間が0ならスタートしない
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
                        // テスト音再生はうるさいかもしれないのでやめるか、控えめにする
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
}: {
  timer: TimerState;
  onAdd30s: () => void;
  onAdd60s: () => void;
  onToggle: () => void;
  onReset: () => void;
  onRemove: () => void;
  onNameChange: (name: string) => void;
}) {
  // 時間表示のフォーマット
  const totalSeconds = Math.ceil(timer.timeLeft / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  const isDanger = timer.timeLeft > 0 && timer.timeLeft <= 10000; // 残り10秒以下
  const isActive = timer.timeLeft > 0;

  return (
    <div className={`relative bg-white rounded-2xl shadow-sm border-2 transition-all overflow-hidden flex flex-col ${
        timer.isRunning 
            ? "border-rose-500 shadow-rose-200 shadow-xl scale-[1.02]" 
            : isActive 
                ? "border-blue-300" 
                : "border-slate-100"
    }`}>
      {/* ヘッダー */}
      <div className="p-4 flex justify-between items-center border-b border-slate-100 bg-slate-50">
        <input
            type="text"
            value={timer.name}
            onChange={(e) => onNameChange(e.target.value)}
            className="font-bold text-slate-700 bg-transparent border-b border-transparent focus:border-slate-300 px-1 w-full mr-2"
        />
        <button 
            onClick={onRemove}
            className="text-slate-300 hover:text-red-500 transition-colors p-1"
            title="削除"
        >
            <Trash2 size={16} />
        </button>
      </div>

      {/* タイマー表示 */}
      <div className={`flex-1 flex flex-col items-center justify-center py-8 ${
          isDanger && timer.isRunning ? "animate-pulse bg-red-50" : ""
      }`}>
        <div className={`text-6xl font-mono font-bold tracking-tighter tabular-nums ${
            isDanger ? "text-red-600" : timer.isRunning ? "text-slate-800" : "text-slate-300"
        }`}>
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
                className="bg-white border border-slate-200 text-slate-700 py-2 rounded-lg font-bold shadow-sm hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 active:scale-95 transition-all flex flex-col items-center justify-center h-16"
            >
                <span className="text-lg">+30</span>
                <span className="text-[10px] font-normal opacity-70">1枚 / Half</span>
            </button>
            <button
                onClick={onAdd60s}
                className="bg-white border border-slate-200 text-slate-700 py-2 rounded-lg font-bold shadow-sm hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 active:scale-95 transition-all flex flex-col items-center justify-center h-16"
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
                    timer.isRunning
                        ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/30"
                        : timer.timeLeft > 0
                            ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/30"
                            : "bg-slate-300 cursor-not-allowed"
                }`}
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

