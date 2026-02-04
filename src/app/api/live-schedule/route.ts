import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
import { deleteCalendarEvent, upsertCalendarEvent } from '@/lib/googleCalendar';
import type { LiveSchedule } from '@/types';

export const runtime = 'nodejs';

const normalizeValue = (value?: string | null) => {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

const normalizePayload = (payload: LiveSchedule) => ({
  title: payload.title.trim(),
  start_at: payload.start_at,
  end_at: normalizeValue(payload.end_at ?? null),
  venue: normalizeValue(payload.venue ?? null),
  price: normalizeValue(payload.price ?? null),
  ticket_url: normalizeValue(payload.ticket_url ?? null),
  announce_image_url: normalizeValue(payload.announce_image_url ?? null),
  notes: normalizeValue(payload.notes ?? null),
  open_time: normalizeValue(payload.open_time ?? null),
});

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('live_schedules')
      .select('*')
      .order('start_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as LiveSchedule;

    if (!payload.title || !payload.start_at) {
      return NextResponse.json({ error: 'title and start_at are required.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const normalized = normalizePayload(payload);

    if (payload.id) {
      const { data: existing, error: fetchError } = await supabase
        .from('live_schedules')
        .select('*')
        .eq('id', payload.id)
        .single();

      if (fetchError || !existing) {
        return NextResponse.json({ error: fetchError?.message ?? 'Not found' }, { status: 404 });
      }

      const { data: updated, error } = await supabase
        .from('live_schedules')
        .update(normalized)
        .eq('id', payload.id)
        .select('*')
        .single();

      if (error || !updated) {
        return NextResponse.json({ error: error?.message ?? 'Update failed' }, { status: 500 });
      }

      const calendarEventId = await upsertCalendarEvent({
        ...(updated as LiveSchedule),
        calendar_event_id: existing.calendar_event_id,
      });

      if (calendarEventId && calendarEventId !== existing.calendar_event_id) {
        await supabase
          .from('live_schedules')
          .update({ calendar_event_id: calendarEventId })
          .eq('id', payload.id);
      }

      return NextResponse.json({ data: updated });
    }

    const { data: created, error } = await supabase
      .from('live_schedules')
      .insert(normalized)
      .select('*')
      .single();

    if (error || !created) {
      return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 });
    }

    const calendarEventId = await upsertCalendarEvent(created as LiveSchedule);
    if (calendarEventId) {
      await supabase
        .from('live_schedules')
        .update({ calendar_event_id: calendarEventId })
        .eq('id', created.id);
    }

    return NextResponse.json({ data: created });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = (await request.json()) as { id?: number };
    if (!id) {
      return NextResponse.json({ error: 'id is required.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: existing, error: fetchError } = await supabase
      .from('live_schedules')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: fetchError?.message ?? 'Not found' }, { status: 404 });
    }

    const { error } = await supabase.from('live_schedules').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (existing.calendar_event_id) {
      await deleteCalendarEvent(existing.calendar_event_id);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
