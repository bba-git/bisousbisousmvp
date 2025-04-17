import { NextResponse } from 'next/server';
import { getGoogleTokens, getGoogleUserInfo } from '@/lib/google-auth';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL('/auth/login?error=' + error, request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/auth/login?error=no_code', request.url));
    }

    // Exchange code for tokens
    const tokens = await getGoogleTokens(code);
    
    // Get user info
    const userInfo = await getGoogleUserInfo(tokens.access_token);

    // Store tokens in HTTP-only cookies
    const cookieStore = cookies();
    cookieStore.set('access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: tokens.expires_in,
    });

    cookieStore.set('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // Store user info in session cookie
    cookieStore.set('user', JSON.stringify(userInfo), {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (err) {
    console.error('Error in callback:', err);
    return NextResponse.redirect(new URL('/auth/login?error=callback_failed', request.url));
  }
} 