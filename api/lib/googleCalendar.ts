import { google } from 'googleapis';

const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_SERVICE_ACCOUNT_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

let calendarClient: any = null;

function getCalendarClient() {
  if (calendarClient) {
    return calendarClient;
  }

  if (GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_SERVICE_ACCOUNT_KEY) {
    // Use service account authentication
    const auth = new google.auth.JWT({
      email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: GOOGLE_SERVICE_ACCOUNT_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    calendarClient = google.calendar({ version: 'v3', auth });
  } else {
    throw new Error('Google Calendar credentials not configured. Please set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_KEY');
  }

  return calendarClient;
}

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: { date: string; timeZone?: string };
  end: { date: string; timeZone?: string };
  attendees?: Array<{ email: string }>;
}

export async function createCalendarEvent(
  calendarId: string,
  event: CalendarEvent
): Promise<string> {
  try {
    const calendar = getCalendarClient();
    const response = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: {
          date: event.start.date,
          timeZone: event.start.timeZone || 'UTC',
        },
        end: {
          date: event.end.date,
          timeZone: event.end.timeZone || 'UTC',
        },
        attendees: event.attendees,
      },
    });

    return response.data.id || '';
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

export async function updateCalendarEvent(
  calendarId: string,
  eventId: string,
  event: CalendarEvent
): Promise<void> {
  try {
    const calendar = getCalendarClient();
    await calendar.events.update({
      calendarId,
      eventId,
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: {
          date: event.start.date,
          timeZone: event.start.timeZone || 'UTC',
        },
        end: {
          date: event.end.date,
          timeZone: event.end.timeZone || 'UTC',
        },
        attendees: event.attendees,
      },
    });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw error;
  }
}

export async function deleteCalendarEvent(
  calendarId: string,
  eventId: string
): Promise<void> {
  try {
    const calendar = getCalendarClient();
    await calendar.events.delete({
      calendarId,
      eventId,
    });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
}

export async function listCalendarEvents(
  calendarId: string,
  timeMin: string,
  timeMax: string
): Promise<any[]> {
  try {
    const calendar = getCalendarClient();
    const response = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items || [];
  } catch (error) {
    console.error('Error listing calendar events:', error);
    throw error;
  }
}

export function getCentralCalendarId(): string {
  if (!GOOGLE_CALENDAR_ID) {
    throw new Error('GOOGLE_CALENDAR_ID not configured');
  }
  return GOOGLE_CALENDAR_ID;
}





