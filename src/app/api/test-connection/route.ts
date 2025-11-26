import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
    openRouter: process.env.OPENROUTER_API_KEY ? 'SET' : 'MISSING',
    scenarioKey: process.env.SCENARIO_API_KEY ? 'SET' : 'MISSING',
    message: 'API is working!'
  });
}