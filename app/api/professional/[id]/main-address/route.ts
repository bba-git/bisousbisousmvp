import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Fetching main address for professional:', params.id);

    // First try to get the primary address
    const { data: primaryAddress, error: primaryError } = await supabase
      .from('professional_addresses')
      .select('*')
      .eq('profile_id', params.id)
      .eq('is_primary', true)
      .single();

    if (primaryError) {
      console.error('Error fetching primary address:', primaryError);
      
      // If no primary address found, try to get any address
      const { data: anyAddress, error: anyAddressError } = await supabase
        .from('professional_addresses')
        .select('*')
        .eq('profile_id', params.id)
        .limit(1)
        .single();

      if (anyAddressError) {
        console.error('Error fetching any address:', anyAddressError);
        return NextResponse.json(
          { 
            error: 'Failed to fetch address',
            details: anyAddressError.message
          },
          { status: 500 }
        );
      }

      if (!anyAddress) {
        return NextResponse.json(
          { error: 'No addresses found for this professional' },
          { status: 404 }
        );
      }

      return NextResponse.json(anyAddress);
    }

    if (!primaryAddress) {
      // If no primary address found, try to get any address
      const { data: anyAddress, error: anyAddressError } = await supabase
        .from('professional_addresses')
        .select('*')
        .eq('profile_id', params.id)
        .limit(1)
        .single();

      if (anyAddressError) {
        console.error('Error fetching any address:', anyAddressError);
        return NextResponse.json(
          { 
            error: 'Failed to fetch address',
            details: anyAddressError.message
          },
          { status: 500 }
        );
      }

      if (!anyAddress) {
        return NextResponse.json(
          { error: 'No addresses found for this professional' },
          { status: 404 }
        );
      }

      return NextResponse.json(anyAddress);
    }

    return NextResponse.json(primaryAddress);
  } catch (err) {
    console.error('Error in main-address endpoint:', err);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: err instanceof Error ? err.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 