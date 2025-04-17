import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    
    try {
      console.log('Exchanging code for session...');
      const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (sessionError) {
        console.error('Error exchanging code for session:', sessionError);
        return NextResponse.redirect(new URL('/auth/login?error=authentication_failed', requestUrl.origin));
      }

      if (!session) {
        console.error('No session after code exchange');
        return NextResponse.redirect(new URL('/auth/login?error=no_session', requestUrl.origin));
      }

      console.log('Session created successfully for user:', session.user.id);

      // First profile check
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking profile:', profileError);
        return NextResponse.redirect(new URL('/auth/login?error=profile_check_failed', requestUrl.origin));
      }

      // If no profile found, wait a moment and check again to avoid race conditions
      if (!existingProfile) {
        console.log('No profile found on first check, waiting and checking again...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        const { data: doubleCheckProfile, error: doubleCheckError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (doubleCheckError && doubleCheckError.code !== 'PGRST116') {
          console.error('Error in double-check profile:', doubleCheckError);
          return NextResponse.redirect(new URL('/auth/login?error=profile_check_failed', requestUrl.origin));
        }

        if (!doubleCheckProfile) {
          console.log('No existing profile found after double-check, redirecting to type selection');
          return NextResponse.redirect(new URL('/auth/select-type', requestUrl.origin));
        }
      }

      console.log('Existing profile found, redirecting to dashboard');
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
    } catch (error) {
      console.error('Unexpected error in callback:', error);
      return NextResponse.redirect(new URL('/auth/login?error=unexpected_error', requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL('/auth/login', requestUrl.origin));
} 