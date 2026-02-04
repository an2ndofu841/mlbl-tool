import { google } from 'googleapis';
import type { LiveSchedule } from '@/types';

const getCalendarClient = () => {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!clientEmail || !privateKey || !calendarId) {
    throw new Error('Missing Google Calendar environment variables.');
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  const calendar = google.calendar({ version: 'v3', auth });
  return { calendar, calendarId };
};

const buildDescription = (schedule: LiveSchedule) => {
  const lines: string[] = [];

  if (schedule.price) {
    lines.push(`料金: ${schedule.price}`);
  }

  if (schedule.ticket_url) {
    lines.push(`チケット: ${schedule.ticket_url}`);
  }

  if (schedule.notes) {
    lines.push(`メモ: ${schedule.notes}`);
  }

  if (schedule.announce_image_url) {
    lines.push(`告知画像: ${schedule.announce_image_url}`);
  }

  return lines.join('\n');
};

const formatDateTime = (value: string) => new Date(value).toISOString();

export const upsertCalendarEvent = async (schedule: LiveSchedule) => {
  const { calendar, calendarId } = getCalendarClient();

  const startDateTime = formatDateTime(schedule.start_at);
  const endDateTime = schedule.end_at
    ? formatDateTime(schedule.end_at)
    : formatDateTime(new Date(new Date(schedule.start_at).getTime() + 2 * 60 * 60 * 1000).toISOString());

  const payload = {
    summary: schedule.title,
    location: schedule.venue || undefined,
    description: buildDescription(schedule) || undefined,
    start: {
      dateTime: startDateTime,
      timeZone: 'Asia/Tokyo',
    },
    end: {
      dateTime: endDateTime,
      timeZone: 'Asia/Tokyo',
    },
  };

  if (schedule.calendar_event_id) {
    const response = await calendar.events.update({
      calendarId,
      eventId: schedule.calendar_event_id,
      requestBody: payload,
    });
    return response.data.id ?? schedule.calendar_event_id;
  }

  const response = await calendar.events.insert({
    calendarId,
    requestBody: payload,
  });
  return response.data.id ?? null;
};

export const deleteCalendarEvent = async (eventId: string) => {
  const { calendar, calendarId } = getCalendarClient();
  await calendar.events.delete({
    calendarId,
    eventId,
  });
};
