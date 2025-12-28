'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MasterItem } from '@/types';
import { Trash2, Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EventsPage() {
  const [events, setEvents] = useState<MasterItem[]>([]);
  const [newItem, setNewItem] = useState('');

  const fetchEvents = async () => {
    const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false });
    if (data) setEvents(data);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleAdd = async () => {
    if (!newItem) return;
    await supabase.from('events').insert({ name: newItem });
    setNewItem('');
    fetchEvents();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('削除しますか？')) return;
    await supabase.from('events').delete().eq('id', id);
    fetchEvents();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/setlist/manage" className="p-2 hover:bg-slate-100 rounded-full">
            <ArrowLeft size={20} />
        </Link>
        <h2 className="text-2xl font-bold">イベント名管理</h2>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex gap-2 mb-6">
            <input 
                type="text" 
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                className="flex-1 p-2 border rounded-lg"
                placeholder="新しいイベント名を登録"
            />
            <button 
                onClick={handleAdd}
                disabled={!newItem}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
                <Plus size={20} />
            </button>
        </div>

        <ul className="divide-y divide-slate-100">
            {events.map(event => (
                <li key={event.id} className="py-3 flex justify-between items-center group">
                    <span className="font-medium">{event.name}</span>
                    <button 
                        onClick={() => handleDelete(event.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                </li>
            ))}
            {events.length === 0 && (
                <li className="text-center text-slate-400 py-8">登録されたイベントはありません</li>
            )}
        </ul>
      </div>
    </div>
  );
}

