import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getGoogleCalendarClient(userId: string) {
  // Get the user's Google Calendar credentials
  const { data: credentials, error } = await supabase
    .from('google_calendar_credentials')
    .select('*')
    .eq('professional_id', userId)
    .single();

  if (error || !credentials) {
    throw new Error('No Google Calendar credentials found');
  }

  // Check if token needs refresh
  if (new Date(credentials.expiry_date) < new Date()) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: credentials.refresh_token
    });

    const { tokens } = await oauth2Client.refreshAccessToken();
    
    // Update the credentials in the database
    await supabase
      .from('google_calendar_credentials')
      .update({
        access_token: tokens.access_token,
        expiry_date: new Date(tokens.expiry_date!),
      })
      .eq('professional_id', userId);

    credentials.access_token = tokens.access_token!;
  }

  // Create and return the calendar client
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  auth.setCredentials({
    access_token: credentials.access_token,
    refresh_token: credentials.refresh_token,
  });

  return google.calendar({ version: 'v3', auth });
}

export async function createCalendarEvent(
  userId: string,
  event: {
    summary: string;
    description: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    attendees?: { email: string }[];
  }
) {
  const calendar = await getGoogleCalendarClient(userId);
  
  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

export async function listCalendarEvents(
  userId: string,
  timeMin: string,
  timeMax: string
) {
  const calendar = await getGoogleCalendarClient(userId);
  
  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items;
  } catch (error) {
    console.error('Error listing calendar events:', error);
    throw error;
  }
} 