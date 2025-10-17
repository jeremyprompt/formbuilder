import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get environment variables
    const subdomain = process.env.PROMPTIO_SUBDOMAIN;
    const apiKey = process.env.PROMPTIO_API_KEY;

    return NextResponse.json({
      success: true,
      environment: {
        hasSubdomain: !!subdomain,
        hasApiKey: !!apiKey,
        subdomain: subdomain ? `${subdomain.substring(0, 3)}...` : 'undefined',
        apiKeyLength: apiKey ? apiKey.length : 0
      }
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to check environment' },
      { status: 500 }
    );
  }
}
