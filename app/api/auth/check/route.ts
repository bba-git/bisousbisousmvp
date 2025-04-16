import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Auth check endpoint called');
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    console.log('Session data:', { session, error });
    
    if (error) {
      console.error('Auth check error:', error);
      return NextResponse.json(
        { isAuthenticated: false, error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json({
      isAuthenticated: !!session,
      user: session?.user
    });
  } catch (error) {
    console.error('Unexpected error in auth check:', error);
    return NextResponse.json(
      { isAuthenticated: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 