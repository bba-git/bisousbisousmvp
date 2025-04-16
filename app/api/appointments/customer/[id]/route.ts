import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('🔍 API: Fetching appointments for customer:', params.id);

  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ API: Session error:', sessionError);
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }

    if (!session) {
      console.log('❌ API: No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user is requesting their own appointments
    if (session.user.id !== params.id) {
      console.log('❌ API: User trying to access other user appointments');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get appointments with professional data
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        *,
        professional:profiles!appointments_professional_id_fkey (
          first_name,
          last_name,
          profession
        )
      `)
      .eq('client_id', params.id)
      .order('appointment_date', { ascending: true });

    if (error) {
      console.error('❌ API: Error fetching appointments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ API: Successfully fetched appointments:', appointments);
    return NextResponse.json(appointments);
  } catch (error: any) {
    console.error('❌ API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 