import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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

    // Test calendar access by fetching the next 10 events
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10&orderBy=startTime&singleEvents=true',
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

    return NextResponse.json({ 
      success: true,
      events: events.items,
      message: 'Successfully connected to Google Calendar'
    });
  } catch (error) {
    console.error('Error testing calendar integration:', error);
    return NextResponse.json({ 
      error: 'Failed to test calendar integration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 