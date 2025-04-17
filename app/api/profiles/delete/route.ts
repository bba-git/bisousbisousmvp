import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  return await handleDelete();
}

export async function DELETE() {
  return await handleDelete();
}

async function handleDelete() {
  try {
    console.log('🔍 API: Starting profile deletion process');
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('🔍 API: Current user:', user?.id);
    
    if (userError) {
      console.error('❌ API: Error getting user:', userError);
      return NextResponse.json({ error: 'Failed to get user' }, { status: 500 });
    }
    
    if (!user) {
      console.log('❌ API: No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to delete any professional addresses if they exist
    try {
      console.log('🔍 API: Attempting to delete professional addresses');
      const { error: addressError } = await supabase
        .from('professional_addresses')
        .delete()
        .eq('profile_id', user.id);

      if (addressError) {
        console.log('⚠️ API: No addresses found or table does not exist:', addressError.message);
      } else {
        console.log('✅ API: Professional addresses deleted successfully');
      }
    } catch (error) {
      // Don't throw error if addresses deletion fails
      console.log('⚠️ API: Could not delete addresses:', error);
    }

    // Try to delete Google Calendar credentials if they exist
    try {
      console.log('🔍 API: Attempting to delete Google Calendar credentials');
      const { error: calendarError } = await supabase
        .from('google_calendar_credentials')
        .delete()
        .eq('professional_id', user.id);

      if (calendarError) {
        console.log('⚠️ API: No calendar credentials found or table does not exist:', calendarError.message);
      } else {
        console.log('✅ API: Google Calendar credentials deleted successfully');
      }
    } catch (error) {
      // Don't throw error if calendar credentials deletion fails
      console.log('⚠️ API: Could not delete calendar credentials:', error);
    }

    // Delete the profile
    console.log('🔍 API: Deleting profile for user:', user.id);
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (profileError) {
      console.error('❌ API: Error deleting profile:', profileError);
      throw profileError;
    }
    console.log('✅ API: Profile deleted successfully');

    // Sign out the user
    console.log('🔍 API: Signing out user');
    await supabase.auth.signOut();
    console.log('✅ API: User signed out successfully');

    return NextResponse.json({ 
      success: true,
      message: 'Profile deleted successfully and user signed out',
      redirect: '/'
    });
  } catch (error) {
    console.error('❌ API: Error in profile deletion:', error);
    return NextResponse.json(
      { error: 'Failed to delete profile' },
      { status: 500 }
    );
  }
} 