import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    // Get environment variables
    const subdomain = process.env.subdomain;
    const apiKey = process.env.apiKey;

    console.log('Environment check:', { 
      hasSubdomain: !!subdomain, 
      hasApiKey: !!apiKey,
      subdomain: subdomain ? `${subdomain.substring(0, 3)}...` : 'undefined'
    });

    if (!subdomain || !apiKey) {
      console.error('Missing environment variables:', { subdomain: !!subdomain, apiKey: !!apiKey });
      return NextResponse.json(
        { error: 'Missing environment variables: subdomain or apiKey' },
        { status: 500 }
      );
    }

    // Get the new form payload from the request body
    const newForm = await request.json();
    console.log('Received new form:', JSON.stringify(newForm, null, 2));

    // Validate payload structure
    if (!newForm.formTitle || !newForm.formDescription) {
      console.error('Invalid payload: missing formTitle or formDescription');
      return NextResponse.json(
        { error: 'Invalid payload: formTitle and formDescription are required' },
        { status: 400 }
      );
    }

    const url = `https://${subdomain}.prompt.io/rest/1.0/data/schema/6`;
    
    // Step 1: Get existing forms array from Prompt.io
    console.log('Fetching existing forms from:', url);
    const getController = new AbortController();
    const getTimeoutId = setTimeout(() => getController.abort(), 10000);

    const getResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'orgAuthToken': apiKey
      },
      signal: getController.signal
    });

    clearTimeout(getTimeoutId);

    let existingForms = [];
    
    if (getResponse.ok) {
      const existingData = await getResponse.json();
      console.log('Existing data from Prompt.io:', existingData);
      
      // Parse existing forms
      if (existingData.forms && typeof existingData.forms === 'string') {
        try {
          existingForms = JSON.parse(existingData.forms);
        } catch (parseError) {
          console.error('Error parsing existing forms:', parseError);
          existingForms = [];
        }
      } else if (Array.isArray(existingData.forms)) {
        existingForms = existingData.forms;
      } else if (Array.isArray(existingData)) {
        existingForms = existingData;
      }
    } else {
      console.warn('Could not fetch existing forms, starting with empty array');
    }

    // Step 2: Check if form with this title already exists, update or add
    const existingIndex = existingForms.findIndex((form: Record<string, unknown>) => form.formTitle === newForm.formTitle);
    
    if (existingIndex >= 0) {
      // Update existing form
      existingForms[existingIndex] = newForm;
      console.log('Updated existing form:', existingForms.length, 'total forms');
    } else {
      // Add new form
      existingForms.push(newForm);
      console.log('Added new form:', existingForms.length, 'total forms');
    }

    // Step 3: Put the updated array back to Prompt.io
    console.log('Saving updated forms array to:', url);
    const putController = new AbortController();
    const putTimeoutId = setTimeout(() => putController.abort(), 10000);

    const putResponse = await fetch(url, {
      method: 'PUT',
      headers: {
        'accept': '*/*',
        'orgAuthToken': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        forms: JSON.stringify(existingForms)
      }),
      signal: putController.signal
    });

    clearTimeout(putTimeoutId);

    console.log('PUT response status:', putResponse.status);

    if (!putResponse.ok) {
      const errorText = await putResponse.text();
      console.error('Prompt.io PUT API error:', putResponse.status, errorText);
      return NextResponse.json(
        { error: `Prompt.io PUT API error: ${putResponse.status} - ${errorText}` },
        { status: putResponse.status }
      );
    }

    const result = await putResponse.json();
    console.log('Success response:', result);
    
    const wasUpdate = existingIndex >= 0;
    return NextResponse.json({
      success: true,
      data: result,
      message: wasUpdate 
        ? `Form updated successfully. Total forms: ${existingForms.length}`
        : `Form added successfully. Total forms: ${existingForms.length}`
    });

  } catch (error) {
    console.error('Error saving to Prompt.io schema:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get environment variables
    const subdomain = process.env.subdomain;
    const apiKey = process.env.apiKey;

    console.log('DELETE: Environment check:', { 
      hasSubdomain: !!subdomain, 
      hasApiKey: !!apiKey,
      subdomain: subdomain ? `${subdomain.substring(0, 3)}...` : 'undefined'
    });

    if (!subdomain || !apiKey) {
      console.error('Missing environment variables:', { subdomain: !!subdomain, apiKey: !!apiKey });
      return NextResponse.json(
        { error: 'Missing environment variables: subdomain or apiKey' },
        { status: 500 }
      );
    }

    // Get the form title from the request body
    const { formTitle } = await request.json();
    console.log('DELETE: Received formTitle:', formTitle);

    if (!formTitle) {
      console.error('Invalid payload: missing formTitle');
      return NextResponse.json(
        { error: 'Invalid payload: formTitle is required' },
        { status: 400 }
      );
    }

    const url = `https://${subdomain}.prompt.io/rest/1.0/data/schema/6`;
    
    // Step 1: Get existing forms array from Prompt.io
    console.log('DELETE: Fetching existing forms from:', url);
    const getController = new AbortController();
    const getTimeoutId = setTimeout(() => getController.abort(), 10000);

    const getResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'orgAuthToken': apiKey
      },
      signal: getController.signal
    });

    clearTimeout(getTimeoutId);

    let existingForms = [];
    
    if (getResponse.ok) {
      const existingData = await getResponse.json();
      console.log('DELETE: Existing data from Prompt.io:', existingData);
      
      // Parse existing forms
      if (existingData.forms && typeof existingData.forms === 'string') {
        try {
          existingForms = JSON.parse(existingData.forms);
        } catch (parseError) {
          console.error('Error parsing existing forms:', parseError);
          existingForms = [];
        }
      } else if (Array.isArray(existingData.forms)) {
        existingForms = existingData.forms;
      } else if (Array.isArray(existingData)) {
        existingForms = existingData;
      }
    } else {
      console.warn('Could not fetch existing forms, starting with empty array');
    }

    // Step 2: Remove the form matching the formTitle
    const initialLength = existingForms.length;
    existingForms = existingForms.filter((form: Record<string, unknown>) => form.formTitle !== formTitle);
    const removedCount = initialLength - existingForms.length;
    
    console.log('DELETE: Updated forms array (removing form):', existingForms.length, 'total forms remaining');
    
    if (removedCount === 0) {
      console.warn('DELETE: Form not found in array');
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      );
    }

    // Step 3: Put the updated array back to Prompt.io
    console.log('DELETE: Saving updated forms array to:', url);
    const putController = new AbortController();
    const putTimeoutId = setTimeout(() => putController.abort(), 10000);

    const putResponse = await fetch(url, {
      method: 'PUT',
      headers: {
        'accept': '*/*',
        'orgAuthToken': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        forms: JSON.stringify(existingForms)
      }),
      signal: putController.signal
    });

    clearTimeout(putTimeoutId);

    console.log('DELETE: PUT response status:', putResponse.status);

    if (!putResponse.ok) {
      const errorText = await putResponse.text();
      console.error('Prompt.io PUT API error:', putResponse.status, errorText);
      return NextResponse.json(
        { error: `Prompt.io PUT API error: ${putResponse.status} - ${errorText}` },
        { status: putResponse.status }
      );
    }

    const result = await putResponse.json();
    console.log('DELETE: Success response:', result);
    
    return NextResponse.json({
      success: true,
      data: result,
      message: `Form deleted successfully. Total forms: ${existingForms.length}`
    });

  } catch (error) {
    console.error('Error deleting from Prompt.io schema:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
