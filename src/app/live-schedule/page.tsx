'use client';

import { useEffect, useState } from 'react';
import type { LiveSchedule } from '@/types';
import { Plus, Trash2, Pencil } from 'lucide-react';

type FormState = {
  id?: number;
  title: string;
  startAtLocal: string;
  endAtLocal: string;
  openTime: string;
  venue: string;
  price: string;
  ticketUrl: string;
  announceImageUrl: string;
  notes: string;
};

const emptyForm: FormState = {
  title: '',
  startAtLocal: '',
  endAtLocal: '',
  openTime: '',
  venue: '',
  price: '',
  ticketUrl: '',
  announceImageUrl: '',
  notes: '',
};

const toLocalInputValue = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
};

const formatDate = (value?: string | null) => {
  if (!value) return '';
  return new Date(value).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function LiveSchedulePage() {
  const [items, setItems] = useState<LiveSchedule[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/live-schedule');
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || '取得に失敗しました');
      }
      setItems(result.data ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const resetForm = () => setForm(emptyForm);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title || !form.startAtLocal) return;

    setIsSaving(true);
    setError(null);
    try {
      const payload: LiveSchedule = {
        id: form.id ?? 0,
        title: form.title,
        start_at: new Date(form.startAtLocal).toISOString(),
        end_at: form.endAtLocal ? new Date(form.endAtLocal).toISOString() : null,
        open_time: form.openTime || null,
        venue: form.venue || null,
        price: form.price || null,
        ticket_url: form.ticketUrl || null,
        announce_image_url: form.announceImageUrl || null,
        notes: form.notes || null,
      };

      const response = await fetch('/api/live-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || '保存に失敗しました');
      }

      await fetchSchedules();
      resetForm();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (item: LiveSchedule) => {
    setForm({
      id: item.id,
      title: item.title,
      startAtLocal: toLocalInputValue(item.start_at),
      endAtLocal: toLocalInputValue(item.end_at),
      openTime: item.open_time ?? '',
      venue: item.venue ?? '',
      price: item.price ?? '',
      ticketUrl: item.ticket_url ?? '',
      announceImageUrl: item.announce_image_url ?? '',
      notes: item.notes ?? '',
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('削除しますか？')) return;
    setError(null);
    try {
      const response = await fetch('/api/live-schedule', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || '削除に失敗しました');
      }
      await fetchSchedules();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Liveスケジュール登録</h2>
        <p className="text-slate-500 text-sm mt-1">登録内容は公開Googleカレンダーに反映されます。</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">ライブ名</span>
            <input
              type="text"
              required
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              className="w-full p-2 border rounded-lg"
              placeholder="例: CrazyFantasyワンマン"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">会場</span>
            <input
              type="text"
              value={form.venue}
              onChange={(event) => setForm((prev) => ({ ...prev, venue: event.target.value }))}
              className="w-full p-2 border rounded-lg"
              placeholder="例: 渋谷WWW"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">開演日時 (ST)</span>
            <input
              type="datetime-local"
              required
              value={form.startAtLocal}
              onChange={(event) => setForm((prev) => ({ ...prev, startAtLocal: event.target.value }))}
              className="w-full p-2 border rounded-lg"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">終了日時 (任意)</span>
            <input
              type="datetime-local"
              value={form.endAtLocal}
              onChange={(event) => setForm((prev) => ({ ...prev, endAtLocal: event.target.value }))}
              className="w-full p-2 border rounded-lg"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">開場時間 (OP)</span>
            <input
              type="time"
              value={form.openTime}
              onChange={(event) => setForm((prev) => ({ ...prev, openTime: event.target.value }))}
              className="w-full p-2 border rounded-lg"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">料金</span>
            <input
              type="text"
              value={form.price}
              onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
              className="w-full p-2 border rounded-lg"
              placeholder="例: 前売 3,500円 / 当日 4,000円"
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">チケットURL</span>
            <input
              type="url"
              value={form.ticketUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, ticketUrl: event.target.value }))}
              className="w-full p-2 border rounded-lg"
              placeholder="https://..."
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">告知画像URL</span>
            <input
              type="url"
              value={form.announceImageUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, announceImageUrl: event.target.value }))}
              className="w-full p-2 border rounded-lg"
              placeholder="https://..."
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">メモ</span>
            <textarea
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              className="w-full p-2 border rounded-lg min-h-[80px]"
              placeholder="補足事項があれば記入"
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus size={18} />
            {form.id ? '更新する' : '登録する'}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            クリア
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">登録済みスケジュール</h3>
          {isLoading && <span className="text-sm text-slate-400">読み込み中...</span>}
        </div>
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div>
                <p className="font-semibold text-slate-800">{item.title}</p>
                <p className="text-sm text-slate-500">
                  {formatDate(item.start_at)} {item.venue ? `@ ${item.venue}` : ''}
                </p>
                {item.price && <p className="text-xs text-slate-400 mt-1">料金: {item.price}</p>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  <Pencil size={14} />
                  編集
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                  削除
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && !isLoading && (
            <p className="text-sm text-slate-400">まだ登録がありません。</p>
          )}
        </div>
      </section>
    </div>
  );
}
