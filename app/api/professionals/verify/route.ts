import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { professionalId, verified } = await request.json();

    // Check if user is admin (you'll need to implement this check based on your auth system)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update the professional's verified status
    const { data, error } = await supabase
      .from('profiles')
      .update({ verified })
      .eq('id', professionalId)
      .eq('user_type', 'professionnel')
      .select();

    if (error) {
      console.error('Error updating verification status:', error);
      return NextResponse.json({ error: 'Failed to update verification status' }, { status: 500 });
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('Error in verification update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 