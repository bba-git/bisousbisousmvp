import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 401 }
      );
    }

    if (!session) {
      console.log('No session found');
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const { professional_id, motivation, appointment_date } = await request.json();

    // Validate required fields
    if (!professional_id || !motivation || !appointment_date) {
      console.log('Missing fields:', { professional_id, motivation, appointment_date });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if professional exists
    const { data: professional, error: professionalError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', professional_id)
      .single();

    if (professionalError) {
      console.error('Professional fetch error:', professionalError);
      return NextResponse.json(
        { error: 'Error fetching professional' },
        { status: 500 }
      );
    }

    if (!professional) {
      console.log('Professional not found:', professional_id);
      return NextResponse.json(
        { error: 'Professional not found' },
        { status: 404 }
      );
    }

    // Create the appointment
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        professional_id,
        client_id: session.user.id,
        motivation,
        appointment_date,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Appointment creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create appointment' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in appointment creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 