import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const professionalId = searchParams.get('id');

    if (!professionalId) {
      return NextResponse.json({ error: 'Professional ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('verified')
      .eq('id', professionalId)
      .single();

    if (error) {
      console.error('Error checking verification status:', error);
      return NextResponse.json({ error: 'Failed to check verification status' }, { status: 500 });
    }

    return NextResponse.json({ verified: data?.verified || false });
  } catch (error) {
    console.error('Error in verification check:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 