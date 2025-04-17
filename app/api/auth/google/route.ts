import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      // Generate OAuth URL for initial authorization
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/userinfo.email'
        ],
        prompt: 'consent'
      });

      return NextResponse.json({ authUrl });
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Create or update user in Supabase
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user }, error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expiry_date ? Math.floor((new Date(tokens.expiry_date).getTime() - Date.now()) / 1000) : undefined
      }
    });

    if (authError) {
      throw authError;
    }

    // Store Google tokens in the database
    if (user) {
      await supabase
        .from('google_oauth_tokens')
        .upsert({
          user_id: user.id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expiry_date: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          scope: tokens.scope
        });
    }

    return NextResponse.json({ 
      success: true,
      user: userInfo,
      redirect: '/dashboard'
    });

  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
} 