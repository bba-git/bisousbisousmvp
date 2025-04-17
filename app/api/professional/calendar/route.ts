import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

async function validateGoogleCalendarToken(accessToken: string) {
  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Calendar API validation failed:', errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating Google Calendar token:', error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { access_token, refresh_token, expires_in } = await request.json();

    // Validate the access token with Google Calendar API
    const isValid = await validateGoogleCalendarToken(access_token);
    if (!isValid) {
      return NextResponse.json({ 
        error: 'Invalid Google Calendar credentials',
        redirect: '/auth/calendar-setup'
      }, { status: 400 });
    }

    // Store the credentials in the database
    const { error } = await supabase
      .from('google_calendar_credentials')
      .upsert({
        professional_id: session.user.id,
        access_token,
        refresh_token,
        token_expiry: new Date(Date.now() + expires_in * 1000).toISOString()
      });

    if (error) {
      console.error('Error storing calendar credentials:', error);
      return NextResponse.json({ error: 'Failed to store calendar credentials' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in calendar integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    const { data, error } = await supabase
      .from('google_calendar_credentials')
      .select('*')
      .eq('professional_id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching calendar credentials:', error);
      return NextResponse.json({ error: 'Failed to fetch calendar credentials' }, { status: 500 });
    }

    return NextResponse.json({ credentials: data });
  } catch (error) {
    console.error('Error in calendar integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 