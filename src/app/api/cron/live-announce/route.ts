import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
import { postTweet } from '@/lib/xClient';
import type { LiveSchedule } from '@/types';

export const runtime = 'nodejs';

const shouldAuthorize = () => Boolean(process.env.CRON_SECRET);

const isAuthorized = (request: Request) => {
  if (!shouldAuthorize()) return true;
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.replace('Bearer ', '').trim();
  return token === process.env.CRON_SECRET;
};

const getJstRangeForTargetDay = (daysAhead: number) => {
  const nowJst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const targetYear = nowJst.getUTCFullYear();
  const targetMonth = nowJst.getUTCMonth();
  const targetDay = nowJst.getUTCDate() + daysAhead;

  const startUtcMs = Date.UTC(targetYear, targetMonth, targetDay, 0, 0, 0) - 9 * 60 * 60 * 1000;
  const endUtcMs = Date.UTC(targetYear, targetMonth, targetDay + 1, 0, 0, 0) - 9 * 60 * 60 * 1000;

  return {
    start: new Date(startUtcMs).toISOString(),
    end: new Date(endUtcMs).toISOString(),
  };
};

const formatJstDate = (value: string) =>
  new Date(value).toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

const formatJstTime = (value: string) =>
  new Date(value).toLocaleTimeString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
  });

const buildTweetText = (schedule: LiveSchedule) => {
  const dateText = formatJstDate(schedule.start_at);
  const timeText = formatJstTime(schedule.start_at);
  const stTime = timeText;
  const opTime = schedule.open_time || '00:00';
  const venueText = schedule.venue || '未定';
  const ticketText = schedule.ticket_url || '未定';

  return `【${schedule.title}】 ${dateText}▶︎ ${timeText}▶︎ OP${opTime}/ST${stTime} 場所▶︎ ${venueText} チケット▶︎ ${ticketText}`;
};

const runAnnounce = async (request: Request) => {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const range = getJstRangeForTargetDay(3);
  const { data, error } = await supabase
    .from('live_schedules')
    .select('*')
    .gte('start_at', range.start)
    .lt('start_at', range.end)
    .is('last_announced_at', null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const schedules = (data ?? []) as LiveSchedule[];
  const now = new Date().toISOString();

  for (const schedule of schedules) {
    const text = buildTweetText(schedule);
    await postTweet(text, schedule.announce_image_url);
    await supabase
      .from('live_schedules')
      .update({ last_announced_at: now })
      .eq('id', schedule.id);
  }

  return NextResponse.json({ ok: true, count: schedules.length });
};

export async function GET(request: Request) {
  try {
    return await runAnnounce(request);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    return await runAnnounce(request);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
