import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test 1: Check if we can access any table
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    console.log('Test 1 - Profiles table access:', {
      data: testData,
      error: testError
    });

    // Test 2: Try to get specific services by ID
    const { data: specificServices, error: specificError } = await supabase
      .from('professional_services')
      .select('*')
      .in('id', [
        '8fd7d098-8133-479c-bbf0-20f3b7b51e66',
        'd59470c9-bcd3-4815-a8c6-bb7471f92ca1'
      ]);

    console.log('Test 2 - Specific services by ID:', {
      data: specificServices,
      error: specificError
    });

    // Test 3: Try a simple query with logging
    const { data, error } = await supabase
      .from('professional_services')
      .select('*');

    console.log('Test 3 - Full query results:', {
      data,
      error,
      count: data?.length
    });

    return NextResponse.json({
      connection: 'success',
      tests: {
        profilesAccess: !testError,
        specificServicesFound: specificServices?.length || 0,
        allServicesCount: data?.length || 0
      }
    });
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json(
      { error: 'Connection test failed', details: error },
      { status: 500 }
    );
  }
} 