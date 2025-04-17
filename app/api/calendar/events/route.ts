import { google } from 'googleapis';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's Google Calendar credentials
    const { data: credentials, error: credentialsError } = await supabase
      .from('google_calendar_credentials')
      .select('*')
      .eq('professional_id', session.user.id)
      .single();

    if (credentialsError || !credentials) {
      console.error('No Google Calendar credentials found:', credentialsError);
      return NextResponse.json({ error: 'No Google Calendar credentials found' }, { status: 404 });
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
        .eq('professional_id', session.user.id);

      credentials.access_token = tokens.access_token!;
    }

    // Create calendar client
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    auth.setCredentials({
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token,
    });

    const calendar = google.calendar({ version: 'v3', auth });

    // Get events for the next 30 days
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: thirtyDaysFromNow.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    return NextResponse.json(response.data.items);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 });
  }
} 