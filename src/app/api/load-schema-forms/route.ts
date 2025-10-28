import { NextResponse } from 'next/server';

interface SchemaForm {
  field_0?: string;
  field_1?: string;
  field_2?: string;
  field_3?: string;
  field_4?: string;
  field_5?: string;
  field_6?: string;
  field_7?: string;
  field_8?: string;
  field_9?: string;
  formTitle: string;
  formDescription: string;
  [key: string]: string | undefined;
}

interface ParsedField {
  id: string;
  type: string;
  label: string;
  required: boolean;
}

interface ParsedForm {
  id: number;
  title: string;
  description: string;
  fields: ParsedField[];
  createdAt: string;
}

export async function GET() {
  try {
    // Get environment variables
    const subdomain = process.env.subdomain;
    const apiKey = process.env.apiKey;

    if (!subdomain || !apiKey) {
      console.error('Missing environment variables:', { subdomain: !!subdomain, apiKey: !!apiKey });
      return NextResponse.json(
        { error: 'Missing environment variables: subdomain or apiKey' },
        { status: 500 }
      );
    }

    const url = `https://${subdomain}.prompt.io/rest/1.0/data/schema/30`;
    console.log('Fetching forms from:', url);

    // Make the request to Prompt.io schema endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'orgAuthToken': apiKey
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

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
    console.log('Raw response from Prompt.io:', result);

    // Parse the forms JSON string
    let forms: SchemaForm[] = [];
    if (result.forms && typeof result.forms === 'string') {
      try {
        forms = JSON.parse(result.forms);
      } catch (parseError) {
        console.error('Error parsing forms JSON string:', parseError);
        return NextResponse.json(
          { error: 'Failed to parse forms data' },
          { status: 500 }
        );
      }
    } else if (Array.isArray(result.forms)) {
      forms = result.forms;
    } else if (Array.isArray(result)) {
      forms = result;
    }

    console.log('Parsed forms:', forms);

    // Convert schema forms to app form structure
    const parsedForms: ParsedForm[] = forms.map((form, index) => {
      const fields: ParsedField[] = [];
      
      // Extract all field_* properties
      Object.keys(form).forEach((key) => {
        if (key.startsWith('field_')) {
          const fieldValue = form[key];
          if (fieldValue && typeof fieldValue === 'string') {
            // Parse field format: "Label (type, required)" or "Label (type)"
            const match = fieldValue.match(/^(.+?)\s*\((.+?)\)\s*$/);
            if (match) {
              const label = match[1].trim();
              const meta = match[2].trim();
              const parts = meta.split(',').map(p => p.trim());
              
              let type = 'text';
              let required = false;
              
              parts.forEach(part => {
                if (part.toLowerCase() === 'required') {
                  required = true;
                } else {
                  type = part;
                }
              });
              
              fields.push({
                id: key,
                type,
                label,
                required
              });
            }
          }
        }
      });

      return {
        id: index + 1, // Generate ID
        title: form.formTitle || 'Untitled Form',
        description: form.formDescription || '',
        fields,
        createdAt: new Date().toISOString()
      };
    });

    return NextResponse.json({
      success: true,
      forms: parsedForms
    });

  } catch (error) {
    console.error('Error loading forms from schema:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

