'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Song, SetlistItem } from '@/types';
import { Trash2, Plus, Save, Download, Music, AlertCircle, Clock, FileAudio } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// --- Utility Functions ---
const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// --- Components ---

const SongManager = () => {
  const songs = useLiveQuery(() => db.songs.toArray());
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Get duration
        const duration = await new Promise<number>((resolve) => {
          const audio = new Audio(URL.createObjectURL(file));
          audio.onloadedmetadata = () => {
            resolve(audio.duration);
            URL.revokeObjectURL(audio.src);
          };
          audio.onerror = () => resolve(0); // Fallback
        });

        await db.songs.add({
          title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          duration,
          fileData: file,
          fileName: file.name,
          createdAt: new Date(),
        });
      }
    } catch (error) {
      console.error("Upload failed", error);
      alert("アップロードに失敗しました");
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('この曲を削除しますか？')) {
      await db.songs.delete(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Music className="text-blue-500" />
          楽曲の登録
        </h3>
        <div className="flex items-center gap-4">
          <label className="flex-1 cursor-pointer bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-100 transition-colors">
            <input 
              type="file" 
              accept="audio/*" 
              multiple 
              onChange={handleFileUpload} 
              className="hidden" 
              disabled={isUploading}
            />
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <FileAudio size={32} />
              <span className="font-medium">
                {isUploading ? 'アップロード中...' : '音声ファイルをドラッグ＆ドロップまたはクリックして選択'}
              </span>
              <span className="text-xs text-slate-400">MP3, WAV, M4A etc.</span>
            </div>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">タイトル</th>
              <th className="px-4 py-3">ファイル名</th>
              <th className="px-4 py-3 w-24">時間</th>
              <th className="px-4 py-3 w-20 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {songs?.map((song) => (
              <tr key={song.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-700">{song.title}</td>
                <td className="px-4 py-3 text-slate-500 truncate max-w-[200px]">{song.fileName}</td>
                <td className="px-4 py-3 text-slate-500 font-mono">{formatTime(song.duration)}</td>
                <td className="px-4 py-3 text-center">
                  <button 
                    onClick={() => song.id && handleDelete(song.id)}
                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {songs?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  楽曲が登録されていません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function SetlistPage() {
  const songs = useLiveQuery(() => db.songs.toArray());
  const [activeTab, setActiveTab] = useState<'builder' | 'songs'>('builder');

  // Setlist State
  const [eventName, setEventName] = useState('');
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [artistName, setArtistName] = useState('');
  const [memberCount, setMemberCount] = useState<number>(0);
  const [micCount, setMicCount] = useState<number>(0);
  const [durationLimit, setDurationLimit] = useState<number>(30); // minutes

  const [items, setItems] = useState<SetlistItem[]>([]);

  // Add Item
  const addItem = (songId?: number) => {
    const song = songs?.find(s => s.id === Number(songId));
    const newItem: SetlistItem = {
      id: crypto.randomUUID(),
      trackOrder: items.length + 1,
      songId: songId ? Number(songId) : undefined,
      title: song ? song.title : '',
      duration: song ? song.duration : 0,
      triggerType: 'カウント',
      soundRequest: '',
      lightRequest: '',
      notes: ''
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof SetlistItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        // If song is changed, update title and duration
        if (field === 'songId') {
          const song = songs?.find(s => s.id === Number(value));
          if (song) {
            return { 
              ...item, 
              songId: Number(value), 
              title: song.title, 
              duration: song.duration 
            };
          }
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id).map((item, idx) => ({ ...item, trackOrder: idx + 1 })));
  };

  const totalDuration = useMemo(() => {
    return items.reduce((sum, item) => sum + item.duration, 0);
  }, [items]);

  const isOverTime = totalDuration > durationLimit * 60;

  // CD Data Download
  const handleDownloadCDData = async () => {
    if (items.length === 0) return;

    const zip = new JSZip();
    const folder = zip.folder("setlist_cd_data");
    
    // Create track list text file
    let trackList = `Event: ${eventName}\nDate: ${date}\nVenue: ${venue}\nArtist: ${artistName}\n\n`;
    items.forEach((item, index) => {
        trackList += `${index + 1}. ${item.title} (${formatTime(item.duration)})\n`;
    });
    folder?.file("tracklist.txt", trackList);

    // Add audio files
    let hasAudio = false;
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.songId) {
            const song = await db.songs.get(item.songId);
            if (song && song.fileData) {
                const ext = song.fileName?.split('.').pop() || 'mp3';
                const fileName = `${String(i + 1).padStart(2, '0')}_${item.title.replace(/[\/\\:*?"<>|]/g, '_')}.${ext}`;
                folder?.file(fileName, song.fileData);
                hasAudio = true;
            }
        }
    }

    if (!hasAudio) {
        alert("音源が登録されている曲がありません。リストのみダウンロードします。");
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${eventName || 'setlist'}_${date}.zip`);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">セットリスト作成</h2>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('builder')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'builder' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            セットリスト作成
          </button>
          <button
            onClick={() => setActiveTab('songs')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'songs' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            楽曲管理
          </button>
        </div>
      </div>

      {activeTab === 'songs' ? (
        <SongManager />
      ) : (
        <div className="space-y-8 animate-fade-in">
          {/* Header Info */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-0">
            <h3 className="text-lg font-bold mb-4 text-slate-700 border-b pb-2 print:hidden">イベント情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1 print:text-black">イベント名</label>
                <input 
                  type="text" 
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm print:border-none print:p-0"
                  placeholder="イベント名を入力"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 print:text-black">会場</label>
                <input 
                  type="text" 
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm print:border-none print:p-0"
                  placeholder="会場名"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 print:text-black">出演日</label>
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm print:border-none print:p-0"
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1 print:text-black">アーティスト名</label>
                <input 
                  type="text" 
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm print:border-none print:p-0"
                  placeholder="アーティスト名"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 print:text-black">メンバー数</label>
                <input 
                  type="number" 
                  value={memberCount}
                  onChange={(e) => setMemberCount(Number(e.target.value))}
                  className="w-full p-2 border rounded-lg text-sm print:border-none print:p-0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 print:text-black">マイク本数</label>
                <input 
                  type="number" 
                  value={micCount}
                  onChange={(e) => setMicCount(Number(e.target.value))}
                  className="w-full p-2 border rounded-lg text-sm print:border-none print:p-0"
                />
              </div>
              <div className="print:hidden">
                <label className="block text-xs font-medium text-slate-500 mb-1">持ち時間 (分)</label>
                <input 
                  type="number" 
                  value={durationLimit}
                  onChange={(e) => setDurationLimit(Number(e.target.value))}
                  className="w-full p-2 border rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Setlist Items */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-none">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center sticky top-0 z-10 print:hidden">
              <h3 className="text-lg font-bold text-slate-700">セットリスト</h3>
              <div className={`flex items-center gap-2 text-sm font-bold px-3 py-1 rounded-full ${isOverTime ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                <Clock size={16} />
                <span>合計: {formatTime(totalDuration)} / {durationLimit}:00</span>
                {isOverTime && <AlertCircle size={16} />}
              </div>
            </div>
            
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-sm min-w-[800px] print:min-w-0">
                <thead className="bg-slate-50 text-slate-500 font-medium print:bg-white print:text-black print:border-b-2 print:border-black">
                  <tr>
                    <th className="px-4 py-2 w-12 text-center">#</th>
                    <th className="px-4 py-2 w-64">タイトル (曲)</th>
                    <th className="px-4 py-2 w-24">TIME</th>
                    <th className="px-4 py-2 w-32">キッカケ</th>
                    <th className="px-4 py-2 w-48">音響への要望</th>
                    <th className="px-4 py-2 w-48">照明への要望</th>
                    <th className="px-4 py-2 w-48">その他自由記載</th>
                    <th className="px-4 py-2 w-12 print:hidden"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50 print:hover:bg-white">
                      <td className="px-4 py-2 text-center text-slate-400 print:text-black">{idx + 1}</td>
                      <td className="px-4 py-2">
                        <div className="space-y-1">
                          <select 
                            value={item.songId || ''} 
                            onChange={(e) => updateItem(item.id, 'songId', e.target.value)}
                            className="w-full p-1 border rounded text-xs print:hidden"
                          >
                            <option value="">(楽曲選択)</option>
                            {songs?.map(s => (
                              <option key={s.id} value={s.id}>{s.title} ({formatTime(s.duration)})</option>
                            ))}
                          </select>
                          <input 
                            type="text" 
                            value={item.title} 
                            onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                            className="w-full p-1 border rounded print:border-none print:p-0 print:font-bold"
                            placeholder="曲名"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-2 font-mono text-center print:text-black">
                        {formatTime(item.duration)}
                      </td>
                      <td className="px-4 py-2">
                        <select 
                          value={item.triggerType} 
                          onChange={(e) => updateItem(item.id, 'triggerType', e.target.value)}
                          className="w-full p-1 border rounded print:appearance-none print:border-none print:p-0"
                        >
                          <option value="音先">音先</option>
                          <option value="板付">板付</option>
                          <option value="曲ふり">曲ふり</option>
                          <option value="タイトルコール">タイトルコール</option>
                          <option value="カウント">カウント</option>
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <textarea 
                          value={item.soundRequest} 
                          onChange={(e) => updateItem(item.id, 'soundRequest', e.target.value)}
                          className="w-full p-1 border rounded h-16 resize-none print:border-none print:p-0 print:h-auto"
                          placeholder="Reverb多め、など"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <textarea 
                          value={item.lightRequest} 
                          onChange={(e) => updateItem(item.id, 'lightRequest', e.target.value)}
                          className="w-full p-1 border rounded h-16 resize-none print:border-none print:p-0 print:h-auto"
                          placeholder="赤系、激しく、など"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <textarea 
                          value={item.notes} 
                          onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                          className="w-full p-1 border rounded h-16 resize-none print:border-none print:p-0 print:h-auto"
                        />
                      </td>
                      <td className="px-4 py-2 text-center print:hidden">
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="print:hidden">
                    <td colSpan={8} className="p-2">
                      <button 
                        onClick={() => addItem()}
                        className="w-full py-2 flex items-center justify-center gap-2 text-blue-600 border border-dashed border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <Plus size={16} />
                        行を追加
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col md:flex-row items-center gap-4 justify-end pt-4">
            <button
                onClick={handleDownloadCDData}
                disabled={items.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Download size={20} />
                CD用データ出力 (ZIP)
            </button>
            <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 shadow-lg shadow-slate-200 transition-all"
            >
                <Save size={20} />
                PDF出力 / 印刷
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

