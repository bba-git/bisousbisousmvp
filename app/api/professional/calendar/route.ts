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

    const { access_token, refresh_token, expires_in } = await request.json();

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