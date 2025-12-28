'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Song, SetlistItem, EventPreset, MasterItem } from '@/types';
import { Trash2, Plus, Save, Download, Music, AlertCircle, Clock, FileAudio, BookOpen, BookmarkPlus, Settings } from 'lucide-react';
import JSZip from 'jszip';
import Link from 'next/link';
import { saveAs } from 'file-saver';

// --- Utility Functions ---
const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// --- Components ---

const SongManager = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDuration, setEditDuration] = useState('');

  const fetchSongs = async () => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSongs(data || []);
    } catch (error) {
      console.error('Error fetching songs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 1. Get duration
        const duration = await new Promise<number>((resolve) => {
          const audio = new Audio(URL.createObjectURL(file));
          audio.onloadedmetadata = () => {
            resolve(audio.duration);
            URL.revokeObjectURL(audio.src);
          };
          audio.onerror = () => resolve(0);
        });

        // 2. Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('songs')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // 3. Insert metadata to DB
        const { error: insertError } = await supabase
          .from('songs')
          .insert({
            title: file.name.replace(/\.[^/.]+$/, ""),
            duration,
            file_path: filePath,
            file_name: file.name,
            created_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;
      }
      // Refresh list
      fetchSongs();
    } catch (error) {
      console.error("Upload failed", error);
      alert("アップロードに失敗しました。Supabaseの設定を確認してください。");
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleEditStart = (song: Song) => {
    setEditingId(song.id!);
    setEditTitle(song.title);
    setEditDuration(song.duration.toString());
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
        const { error } = await supabase
            .from('songs')
            .update({
                title: editTitle,
                duration: parseFloat(editDuration)
            })
            .eq('id', editingId);

        if (error) throw error;
        
        setEditingId(null);
        fetchSongs();
    } catch (error) {
        console.error('Update failed:', error);
        alert('更新に失敗しました');
    }
  };

  const handleDelete = async (id: number, filePath: string) => {
    if (!confirm('この曲を削除しますか？')) return;

    try {
      // 1. Delete from Storage
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('songs')
          .remove([filePath]);
        if (storageError) console.error('Storage delete error:', storageError);
      }

      // 2. Delete from DB
      const { error: dbError } = await supabase
        .from('songs')
        .delete()
        .eq('id', id);
      
      if (dbError) throw dbError;

      fetchSongs();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('削除に失敗しました');
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
            {songs.map((song) => (
              <tr key={song.id} className="hover:bg-slate-50">
                {editingId === song.id ? (
                    // Editing Mode
                    <>
                        <td className="px-4 py-3">
                            <input 
                                type="text" 
                                value={editTitle} 
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full p-1 border rounded"
                            />
                        </td>
                        <td className="px-4 py-3 text-slate-500 truncate max-w-[200px]">{song.fileName || (song as any).file_name}</td>
                        <td className="px-4 py-3 font-mono">
                            <input 
                                type="number" 
                                value={editDuration} 
                                onChange={(e) => setEditDuration(e.target.value)}
                                className="w-20 p-1 border rounded"
                                step="0.1"
                            />
                        </td>
                        <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
                            <button onClick={handleUpdate} className="text-green-600 hover:text-green-800">
                                <Save size={16} />
                            </button>
                            <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600">
                                ×
                            </button>
                        </td>
                    </>
                ) : (
                    // View Mode
                    <>
                        <td className="px-4 py-3 font-medium text-slate-700 cursor-pointer hover:underline" onClick={() => handleEditStart(song)}>
                            {song.title}
                        </td>
                        <td className="px-4 py-3 text-slate-500 truncate max-w-[200px]">{song.fileName || (song as any).file_name}</td>
                        <td className="px-4 py-3 text-slate-500 font-mono cursor-pointer hover:underline" onClick={() => handleEditStart(song)}>
                            {formatTime(song.duration)}
                        </td>
                        <td className="px-4 py-3 text-center">
                        <button 
                            onClick={() => song.id && handleDelete(song.id, (song as any).file_path)}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                        </td>
                    </>
                )}
              </tr>
            ))}
            {!isLoading && songs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  楽曲が登録されていません
                </td>
              </tr>
            )}
            {isLoading && (
               <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  読み込み中...
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
  const [songs, setSongs] = useState<Song[]>([]);
  const [presets, setPresets] = useState<EventPreset[]>([]);
  const [masterEvents, setMasterEvents] = useState<MasterItem[]>([]);
  const [masterVenues, setMasterVenues] = useState<MasterItem[]>([]);
  const [activeTab, setActiveTab] = useState<'builder' | 'songs'>('builder');

  // Load songs for selection
  useEffect(() => {
    const loadData = async () => {
        // Songs
        const { data: songsData } = await supabase.from('songs').select('*').order('title');
        if (songsData) setSongs(songsData);

        // Presets
        const { data: presetsData } = await supabase.from('event_presets').select('*').order('created_at', { ascending: false });
        if (presetsData) setPresets(presetsData);

        // Master Data
        const { data: eventsData } = await supabase.from('events').select('*').order('name');
        if (eventsData) setMasterEvents(eventsData);

        const { data: venuesData } = await supabase.from('venues').select('*').order('name');
        if (venuesData) setMasterVenues(venuesData);
    };
    loadData();
  }, [activeTab]); // Refresh when tab changes

  // Setlist State
  const [eventName, setEventName] = useState('');
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [artistName, setArtistName] = useState('CrazyFantasy');
  const [memberCount, setMemberCount] = useState<number>(0);
  const [micCount, setMicCount] = useState<number>(0);
  const [durationLimit, setDurationLimit] = useState<number>(30); // minutes

  const [items, setItems] = useState<SetlistItem[]>([]);
  const [otherNotes, setOtherNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Preset Functions
  const applyPreset = (presetId: string) => {
    const preset = presets.find(p => p.id.toString() === presetId);
    if (preset) {
        setEventName(preset.event_name || '');
        setVenue(preset.venue || '');
        setArtistName(preset.artist_name || 'CrazyFantasy');
    }
  };

  const savePreset = async () => {
    if (!eventName || !venue) {
        alert('イベント名と会場名は必須です');
        return;
    }
    const { data, error } = await supabase
        .from('event_presets')
        .insert({
            event_name: eventName,
            venue: venue,
            artist_name: artistName
        })
        .select()
        .single();
    
    if (error) {
        console.error(error);
        alert('保存に失敗しました');
    } else {
        setPresets([data, ...presets]);
        alert('プリセットを保存しました');
    }
  };

  const deletePreset = async (id: number) => {
    if(!confirm('このプリセットを削除しますか？')) return;
    await supabase.from('event_presets').delete().eq('id', id);
    setPresets(presets.filter(p => p.id !== id));
  };

  // Upload & Add Song directly from Setlist Builder
  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
        const file = files[0]; // Single file for quick upload
        
        // 1. Get duration
        const duration = await new Promise<number>((resolve) => {
          const audio = new Audio(URL.createObjectURL(file));
          audio.onloadedmetadata = () => {
            resolve(audio.duration);
            URL.revokeObjectURL(audio.src);
          };
          audio.onerror = () => resolve(0);
        });

        // 2. Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('songs')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // 3. Insert metadata to DB
        const { data: newSong, error: insertError } = await supabase
          .from('songs')
          .insert({
            title: file.name.replace(/\.[^/.]+$/, ""),
            duration,
            file_path: filePath,
            file_name: file.name,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // 4. Update Local State & Setlist Item
        if (newSong) {
            setSongs(prev => [newSong, ...prev]); // Add to local list
            updateItem(itemId, 'songId', newSong.id); // Auto select
        }

    } catch (error) {
      console.error("Upload failed", error);
      alert("アップロードに失敗しました。Supabaseの設定（Storageバケット作成など）を確認してください。");
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Add Item
  const addItem = (songId?: number) => {
    const song = songs.find(s => s.id === Number(songId));
    const newItem: SetlistItem = {
      id: crypto.randomUUID(),
      trackOrder: items.length + 1,
      songId: songId ? Number(songId) : undefined,
      title: song ? song.title : '',
      duration: song ? song.duration : 0,
      triggerType: '音先',
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
          const song = songs.find(s => s.id === Number(value));
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
    // Show loading indicator usually, but here we just block/alert
    
    try {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.songId) {
                const song = songs.find(s => s.id === item.songId);
                // Check if we need to fetch 'file_path' from song object
                // The 'Song' interface in types/index.ts should have filePath now,
                // but if supabase returns snake_case 'file_path', we need to handle it.
                // Assuming we mapped it or cast it.
                const path = song?.filePath || (song as any).file_path;

                if (path) {
                    // Download from Supabase Storage
                    const { data, error } = await supabase.storage
                        .from('songs')
                        .download(path);

                    if (error) {
                        console.error(`Failed to download song: ${item.title}`, error);
                        continue;
                    }

                    if (data) {
                        const fileNameStr = song?.fileName || (song as any).file_name || 'audio.mp3';
                        const ext = fileNameStr.split('.').pop() || 'mp3';
                        const fileName = `${String(i + 1).padStart(2, '0')}_${item.title.replace(/[\/\\:*?"<>|]/g, '_')}.${ext}`;
                        folder?.file(fileName, data);
                        hasAudio = true;
                    }
                }
            }
        }

        if (!hasAudio) {
            alert("音源が登録されている曲がありません、またはダウンロードに失敗しました。リストのみダウンロードします。");
        }

        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `${eventName || 'setlist'}_${date}.zip`);
    } catch (e) {
        console.error("ZIP generation error", e);
        alert("ダウンロード処理中にエラーが発生しました。");
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between print:hidden">
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
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 print:hidden">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="text-lg font-bold text-slate-700">イベント情報</h3>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Link href="/setlist/events" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                            <Settings size={12} /> イベント名管理
                        </Link>
                        <Link href="/setlist/venues" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                            <Settings size={12} /> 会場名管理
                        </Link>
                    </div>

                    <div className="flex items-center gap-1 border-l pl-4 ml-2">
                        <BookOpen size={16} className="text-slate-400" />
                        <select 
                            onChange={(e) => applyPreset(e.target.value)}
                            className="text-xs p-1 border rounded bg-slate-50 max-w-[150px]"
                            defaultValue=""
                        >
                            <option value="" disabled>セット履歴から呼出</option>
                            {presets.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.event_name} @{p.venue}
                                </option>
                            ))}
                        </select>
                        <button 
                            onClick={savePreset}
                            className="text-xs flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded transition-colors ml-1"
                            title="現在のイベント名・会場・アーティスト名を履歴に保存"
                        >
                            <BookmarkPlus size={14} />
                            保存
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">イベント名</label>
                <div className="relative">
                    <input 
                      type="text" 
                      list="event-suggestions"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      className="w-full p-2 border rounded-lg text-sm"
                      placeholder="イベント名を入力（候補から選択可）"
                      autoComplete="off"
                    />
                    <datalist id="event-suggestions">
                        {masterEvents.map(e => (
                            <option key={e.id} value={e.name} />
                        ))}
                    </datalist>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">会場</label>
                <div className="relative">
                    <input 
                      type="text" 
                      list="venue-suggestions"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      className="w-full p-2 border rounded-lg text-sm"
                      placeholder="会場名"
                      autoComplete="off"
                    />
                    <datalist id="venue-suggestions">
                        {masterVenues.map(v => (
                            <option key={v.id} value={v.name} />
                        ))}
                    </datalist>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">出演日</label>
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm"
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">アーティスト名</label>
                <input 
                  type="text" 
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm"
                  placeholder="アーティスト名"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">メンバー数</label>
                <input 
                  type="number" 
                  value={memberCount}
                  onChange={(e) => setMemberCount(Number(e.target.value))}
                  className="w-full p-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">マイク本数</label>
                <input 
                  type="number" 
                  value={micCount}
                  onChange={(e) => setMicCount(Number(e.target.value))}
                  className="w-full p-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">持ち時間 (分)</label>
                <input 
                  type="number" 
                  value={durationLimit}
                  onChange={(e) => setDurationLimit(Number(e.target.value))}
                  className="w-full p-2 border rounded-lg text-sm"
                />
                <div className="flex gap-1 mt-1">
                    {[15, 20, 25, 30].map(min => (
                        <button
                            key={min}
                            onClick={() => setDurationLimit(min)}
                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded transition-colors"
                        >
                            {min}
                        </button>
                    ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-none print:overflow-visible">
            {/* 編集用レイアウト (印刷時は非表示) */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center sticky top-0 z-10 print:hidden">
              <h3 className="text-lg font-bold text-slate-700">セットリスト</h3>
              <div className={`flex items-center gap-2 text-sm font-bold px-3 py-1 rounded-full ${isOverTime ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                <Clock size={16} />
                <span>合計: {formatTime(totalDuration)} / {durationLimit}:00</span>
                {isOverTime && <AlertCircle size={16} />}
              </div>
            </div>
            
            <div className="overflow-x-auto print:hidden">
              <table className="w-full text-sm min-w-[800px]">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                    <th className="px-4 py-2 w-12 text-center">#</th>
                    <th className="px-4 py-2 w-64">タイトル (曲)</th>
                    <th className="px-4 py-2 w-24">TIME</th>
                    <th className="px-4 py-2 w-32">キッカケ</th>
                    <th className="px-4 py-2 w-48">音響への要望</th>
                    <th className="px-4 py-2 w-48">照明への要望</th>
                    <th className="px-4 py-2 w-48">その他自由記載</th>
                    <th className="px-4 py-2 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2 text-center text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-2">
                        <div className="space-y-1">
                          <select 
                            value={item.songId || ''} 
                            onChange={(e) => updateItem(item.id, 'songId', e.target.value)}
                            className="w-full p-1 border rounded text-xs"
                          >
                            <option value="">(楽曲選択)</option>
                            {songs.map(s => (
                              <option key={s.id} value={s.id}>{s.title} ({formatTime(s.duration)})</option>
                            ))}
                          </select>
                          
                          {/* Quick Upload Button */}
                          {!item.songId && (
                              <label className="flex items-center justify-center gap-1 w-full p-1 border border-dashed border-indigo-300 rounded text-xs text-indigo-600 hover:bg-indigo-50 cursor-pointer transition-colors print:hidden">
                                <input 
                                    type="file" 
                                    accept="audio/*" 
                                    onChange={(e) => handleQuickUpload(e, item.id)} 
                                    className="hidden" 
                                    disabled={isUploading}
                                />
                                {isUploading ? (
                                    <span>UP中...</span>
                                ) : (
                                    <>
                                        <FileAudio size={12} />
                                        <span>音源を登録して選択</span>
                                    </>
                                )}
                              </label>
                          )}

                          <input 
                            type="text" 
                            value={item.title} 
                            onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                            className="w-full p-1 border rounded font-bold"
                            placeholder="曲名"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-2 font-mono text-center">
                        {formatTime(item.duration)}
                      </td>
                      <td className="px-4 py-2">
                        <select 
                          value={item.triggerType} 
                          onChange={(e) => updateItem(item.id, 'triggerType', e.target.value)}
                          className="w-full p-1 border rounded"
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
                          className="w-full p-1 border rounded h-16 resize-none"
                          placeholder="Reverb多め、など"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <textarea 
                          value={item.lightRequest} 
                          onChange={(e) => updateItem(item.id, 'lightRequest', e.target.value)}
                          className="w-full p-1 border rounded h-16 resize-none"
                          placeholder="赤系、激しく、など"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <textarea 
                          value={item.notes} 
                          onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                          className="w-full p-1 border rounded h-16 resize-none"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr>
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

            {/* 印刷用レイアウト (A4) */}
            <div className="hidden print:block text-black bg-white p-8 print:absolute print:top-0 print:left-0 print:w-full print:h-full print:z-50">
              {/* Header */}
              <div className="relative mb-6">
                 <h1 className="text-4xl font-black text-center text-slate-700 tracking-widest uppercase mb-2">SET LIST</h1>
                 <div className="text-right text-xs">
                    出力日: {new Date().toLocaleString('ja-JP')}
                 </div>
              </div>

              {/* Info Table */}
              <div className="border-2 border-black mb-6">
                <div className="grid grid-cols-12 border-b border-black">
                  <div className="col-span-2 bg-black text-white font-bold flex items-center justify-center p-1 text-sm border-r border-black">イベント名</div>
                  <div className="col-span-10 text-xl font-bold p-1 px-2">{eventName}</div>
                </div>
                <div className="grid grid-cols-12 border-b border-black">
                  <div className="col-span-2 bg-black text-white font-bold flex items-center justify-center p-1 text-sm border-r border-black">会場</div>
                  <div className="col-span-6 p-1 px-2 text-lg border-r border-black">{venue}</div>
                  <div className="col-span-2 bg-black text-white font-bold flex items-center justify-center p-1 text-sm border-r border-black">出演日</div>
                  <div className="col-span-2 p-1 px-2 text-lg flex items-center justify-center">{date}</div>
                </div>
                <div className="grid grid-cols-12 border-b border-black">
                  <div className="col-span-2 bg-black text-white font-bold flex items-center justify-center p-1 text-sm border-r border-black">アーティスト名</div>
                  <div className="col-span-10 text-2xl font-black p-1 px-2">{artistName}</div>
                </div>
                <div className="grid grid-cols-12">
                  <div className="col-span-2 bg-black text-white font-bold flex items-center justify-center p-1 text-sm border-r border-black">メンバー数</div>
                  <div className="col-span-2 p-1 px-2 text-lg border-r border-black">{memberCount > 0 ? `${memberCount}人` : ''}</div>
                  <div className="col-span-2 bg-black text-white font-bold flex items-center justify-center p-1 text-sm border-r border-black">マイク本数</div>
                  <div className="col-span-2 p-1 px-2 text-lg border-r border-black">{micCount > 0 ? `${micCount}本` : ''}</div>
                  <div className="col-span-2 bg-black text-white font-bold flex items-center justify-center p-1 text-sm border-r border-black">演奏時間</div>
                  <div className="col-span-2 p-1 px-2 text-lg">{durationLimit}分</div>
                </div>
              </div>

              {/* Setlist Table */}
              <table className="w-full border-2 border-black mb-4">
                <thead>
                  <tr className="bg-black text-white">
                    <th className="border border-white p-1 w-8 text-center text-sm">#</th>
                    <th className="border border-white p-1 w-64 text-center text-sm">タイトル</th>
                    <th className="border border-white p-1 w-12 text-center text-sm">track</th>
                    <th className="border border-white p-1 w-20 text-center text-sm">キッカケ</th>
                    <th className="border border-white p-1 text-center text-sm">音響への要望</th>
                    <th className="border border-white p-1 text-center text-sm">照明への要望</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id} className="border-b border-black">
                      {/* # */}
                      <td className="border-r border-black bg-black text-white font-bold text-center text-lg w-8">
                        {idx + 1}
                      </td>
                      
                      {/* タイトル & TIME */}
                      <td className="border-r border-black p-0 align-top w-64">
                         <div className="h-full flex flex-col">
                            <div className="flex-1 p-2 flex items-center justify-center text-center font-bold text-lg leading-tight min-h-[40px]">
                                {item.title}
                            </div>
                            <div className="flex border-t border-black text-xs h-6">
                                <div className="bg-black text-white font-bold px-2 flex items-center">TIME</div>
                                <div className="flex-1 flex items-center justify-center font-mono font-bold bg-white">
                                    {formatTime(item.duration)}
                                </div>
                            </div>
                         </div>
                      </td>

                      {/* track */}
                      <td className="border-r border-black text-center p-1 text-lg w-12">
                        {idx + 1}
                      </td>

                      {/* キッカケ */}
                      <td className="border-r border-black text-center p-1 font-medium w-20 text-sm">
                        {item.triggerType}
                      </td>

                      {/* 音響への要望 */}
                      <td className="border-r border-black p-2 align-top text-sm whitespace-pre-wrap">
                        {item.soundRequest}
                      </td>

                      {/* 照明への要望 */}
                      <td className="p-2 align-top text-sm whitespace-pre-wrap">
                        {item.lightRequest}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* その他欄 */}
              <div className="mt-2">
                 <div className="text-sm font-bold mb-1">その他</div>
                 <div className="border-2 border-black p-2 min-h-[100px] text-sm whitespace-pre-wrap">
                    {otherNotes}
                 </div>
              </div>
            </div>
          </div>
          
          <div className="print:hidden">
            <h4 className="font-bold text-slate-700 mb-2">その他（印刷用）</h4>
            <textarea 
                value={otherNotes}
                onChange={(e) => setOtherNotes(e.target.value)}
                className="w-full p-2 border rounded-lg h-24"
                placeholder="印刷用セットリストの下部に表示されるコメント欄です。"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col md:flex-row items-center gap-4 justify-end pt-4 print:hidden">
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
