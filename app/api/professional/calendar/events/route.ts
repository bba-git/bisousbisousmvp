import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the calendar credentials
    const { data: credentials, error: credentialsError } = await supabase
      .from('google_calendar_credentials')
      .select('*')
      .eq('professional_id', session.user.id)
      .single();

    if (credentialsError || !credentials) {
      return NextResponse.json({ error: 'Calendar not integrated' }, { status: 400 });
    }

    const { start, end, title, description } = await request.json();

    // Create event in Google Calendar
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: title,
        description: description,
        start: {
          dateTime: start,
          timeZone: 'Europe/Paris',
        },
        end: {
          dateTime: end,
          timeZone: 'Europe/Paris',
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create calendar event');
    }

    const event = await response.json();

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json({ error: 'Failed to create calendar event' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the calendar credentials
    const { data: credentials, error: credentialsError } = await supabase
      .from('google_calendar_credentials')
      .select('*')
      .eq('professional_id', session.user.id)
      .single();

    if (credentialsError || !credentials) {
      return NextResponse.json({ error: 'Calendar not integrated' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const timeMin = searchParams.get('timeMin');
    const timeMax = searchParams.get('timeMax');

    // Fetch events from Google Calendar
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}`,
      {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch calendar events');
    }

    const events = await response.json();

    return NextResponse.json({ events: events.items });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 });
  }
} 