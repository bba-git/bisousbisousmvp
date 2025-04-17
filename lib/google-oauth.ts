import { google } from 'googleapis';
import { supabase } from './supabase';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function refreshGoogleToken(userId: string) {
  try {
    // Get stored tokens
    const { data: tokens, error } = await supabase
      .from('google_oauth_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !tokens) {
      throw new Error('No Google OAuth tokens found');
    }

    // Check if token needs refresh
    if (tokens.expiry_date && new Date(tokens.expiry_date) < new Date()) {
      oauth2Client.setCredentials({
        refresh_token: tokens.refresh_token
      });

      const { tokens: newTokens } = await oauth2Client.refreshAccessToken();
      
      // Update tokens in database
      await supabase
        .from('google_oauth_tokens')
        .update({
          access_token: newTokens.access_token,
          expiry_date: new Date(newTokens.expiry_date!),
        })
        .eq('user_id', userId);

      return newTokens.access_token;
    }

    return tokens.access_token;
  } catch (error) {
    console.error('Error refreshing Google token:', error);
    throw error;
  }
}

export async function getGoogleUserInfo(accessToken: string) {
  try {
    oauth2Client.setCredentials({
      access_token: accessToken
    });

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    return userInfo;
  } catch (error) {
    console.error('Error getting Google user info:', error);
    throw error;
  }
} 