import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get environment variables
    const subdomain = process.env.PROMPTIO_SUBDOMAIN;
    const apiKey = process.env.PROMPTIO_API_KEY;

    console.log('Environment check:', { 
      hasSubdomain: !!subdomain, 
      hasApiKey: !!apiKey,
      subdomain: subdomain ? `${subdomain.substring(0, 3)}...` : 'undefined'
    });

    if (!subdomain || !apiKey) {
      console.error('Missing environment variables:', { subdomain: !!subdomain, apiKey: !!apiKey });
      return NextResponse.json(
        { error: 'Missing environment variables: PROMPTIO_SUBDOMAIN or PROMPTIO_API_KEY' },
        { status: 500 }
      );
    }

    // Get the payload from the request body
    const payload = await request.json();
    console.log('Received payload:', JSON.stringify(payload, null, 2));

    const url = `https://${subdomain}.prompt.io/rest/1.0/data/schema/30`;
    console.log('Making request to:', url);

    // Make the request to Prompt.io schema endpoint
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'orgAuthToken': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Prompt.io API error:', response.status, errorText);
      return NextResponse.json(
        { error: `Prompt.io API error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('Success response:', result);
    
    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error saving to Prompt.io schema:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
