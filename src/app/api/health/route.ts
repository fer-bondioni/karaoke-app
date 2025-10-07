import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Health check endpoint for monitoring deployment status
 * Returns 200 OK with system information
 */
export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      youtubeApiKey: !!process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
      appUrl: !!process.env.NEXT_PUBLIC_APP_URL,
    };

    const allEnvVarsPresent = Object.values(envCheck).every(Boolean);

    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '0.1.0',
        checks: {
          environmentVariables: allEnvVarsPresent ? 'pass' : 'warn',
          api: 'pass',
        },
        details: {
          environmentVariables: envCheck,
          message: allEnvVarsPresent 
            ? 'All required environment variables are set' 
            : 'Some environment variables are missing',
        },
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
