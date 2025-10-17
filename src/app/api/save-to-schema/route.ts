import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get environment variables
    const subdomain = process.env.PROMPTIO_SUBDOMAIN;
    const apiKey = process.env.PROMPTIO_API_KEY;

    if (!subdomain || !apiKey) {
      return NextResponse.json(
        { error: 'Missing environment variables: PROMPTIO_SUBDOMAIN or PROMPTIO_API_KEY' },
        { status: 500 }
      );
    }

    // Get the payload from the request body
    const payload = await request.json();

    // Make the request to Prompt.io schema endpoint
    const response = await fetch(`https://${subdomain}.prompt.io/rest/1.0/data/schema/30`, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'orgAuthToken': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Prompt.io API error:', response.status, errorText);
      return NextResponse.json(
        { error: `Prompt.io API error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error saving to Prompt.io schema:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
