import { NextRequest, NextResponse } from 'next/server';

interface FormSubmission {
  formId: number;
  formTitle: string;
  data: Record<string, string>;
  submittedAt: string;
  userAgent?: string;
}

interface PromptIOContactList {
  id: number;
  name: string;
  apiId: string;
  icon: string | null;
  description: string;
  externalUrl: string | null;
  type: string;
}

interface PromptIOContactListsResponse {
  contactLists: PromptIOContactList[];
}

interface AddContactPayload {
  identityType: string;
  contacts: Array<{
    identityKey: string;
    displayName: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // Get environment variables
    const subdomain = process.env.subdomain;
    const apiKey = process.env.apiKey;

    if (!subdomain || !apiKey) {
      console.error('Missing environment variables:', { subdomain: !!subdomain, apiKey: !!apiKey });
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Parse request body
    const submission: FormSubmission = await request.json();
    console.log('Received form submission:', submission);

    // Validate required fields
    if (!submission.formId || !submission.data) {
      return NextResponse.json(
        { error: 'Invalid submission data' },
        { status: 400 }
      );
    }

    // Log all received data for debugging
    console.log('Received submission data:', JSON.stringify(submission.data, null, 2));
    
    // Step 0: Load form structure to map field IDs to labels
    let fieldLabelMap: Record<string, string> = {};
    try {
      const schemaUrl = `https://${subdomain}.prompt.io/rest/1.0/data/schema/6`;
      const schemaController = new AbortController();
      const schemaTimeoutId = setTimeout(() => schemaController.abort(), 10000);
      
      const schemaResponse = await fetch(schemaUrl, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'orgAuthToken': apiKey
        },
        signal: schemaController.signal
      });
      
      clearTimeout(schemaTimeoutId);
      
      if (schemaResponse.ok) {
        const schemaData = await schemaResponse.json();
        let forms: any[] = [];
        
        if (schemaData.forms && typeof schemaData.forms === 'string') {
          forms = JSON.parse(schemaData.forms);
        } else if (Array.isArray(schemaData.forms)) {
          forms = schemaData.forms;
        } else if (Array.isArray(schemaData)) {
          forms = schemaData;
        }
        
        // Find the form matching the submission's formId
        const form = forms[submission.formId - 1]; // formId is 1-indexed
        
        if (form) {
          // Build field ID to label mapping
          Object.keys(form).forEach((key) => {
            if (key.startsWith('field_')) {
              const fieldValue = form[key];
              if (fieldValue && typeof fieldValue === 'string') {
                // Parse field format: "Label (type, required)" or "Label (type)"
                const match = fieldValue.match(/^(.+?)\s*\((.+?)\)\s*$/);
                if (match) {
                  const label = match[1].trim();
                  fieldLabelMap[key] = label;
                }
              }
            }
          });
          
          console.log('Field label mapping:', fieldLabelMap);
        }
      }
    } catch (schemaError) {
      console.warn('Could not load form structure for field mapping:', schemaError);
      // Continue without field mapping - will fall back to field ID matching
    }
    
    // Extract phone number and name from form data - try multiple patterns
    let phoneNumber = submission.data.phone || submission.data.phoneNumber || submission.data.mobile || 
                      submission.data.cellPhone || submission.data.cell;
    
    // If still not found, try to find by field labels (using fieldLabelMap)
    if (!phoneNumber) {
      for (const [fieldId, value] of Object.entries(submission.data)) {
        if (!value) continue;
        
        const label = fieldLabelMap[fieldId] || '';
        const labelLower = label.toLowerCase().trim();
        const valueStr = String(value);
        
        // Check if label contains phone-related keywords
        if (labelLower.includes('phone') || labelLower.includes('mobile') || 
            labelLower.includes('cell') || labelLower.includes('telephone')) {
          phoneNumber = valueStr;
          console.log(`Found phone number in field "${fieldId}" (label: "${label}"): ${phoneNumber}`);
          break;
        }
      }
    }
    
    // If still not found, try to find any field with an ID that looks like phone
    if (!phoneNumber) {
      for (const [key, value] of Object.entries(submission.data)) {
        const strKey = key.toLowerCase();
        // Check if field name contains phone-related keywords
        if (strKey.includes('phone') || strKey.includes('mobile') || strKey.includes('cell')) {
          phoneNumber = value as string;
          console.log(`Found phone number in field "${key}": ${phoneNumber}`);
          break;
        }
      }
    }
    
    // Last resort: find any value that contains 10+ digits
    if (!phoneNumber) {
      for (const [key, value] of Object.entries(submission.data)) {
        const strValue = String(value);
        if (strValue.match(/\d{10,}/)) {
          phoneNumber = value as string;
          console.log(`Found phone number by pattern in field "${key}": ${phoneNumber}`);
          break;
        }
      }
    }
    
    if (!phoneNumber) {
      console.error('No phone number found in submission data:', Object.keys(submission.data));
      return NextResponse.json(
        { 
          error: 'Phone number is required',
          receivedFields: Object.keys(submission.data)
        },
        { status: 400 }
      );
    }

    // Extract first and last name
    let firstName = submission.data.firstName || submission.data.first_name || submission.data.fname || '';
    let lastName = submission.data.lastName || submission.data.last_name || submission.data.lname || '';
    
    // If not found, try to find by field labels (using fieldLabelMap)
    if (!firstName && !lastName) {
      for (const [fieldId, value] of Object.entries(submission.data)) {
        if (!value) continue;
        
        const label = fieldLabelMap[fieldId] || '';
        const labelLower = label.toLowerCase().trim();
        const valueStr = String(value).trim();
        
        // Check for "first name" or similar patterns
        if (!firstName && (labelLower.includes('first name') || labelLower === 'firstname' || 
            labelLower === 'fname' || labelLower.includes('first'))) {
          firstName = valueStr;
          console.log(`Found first name in field "${fieldId}" (label: "${label}"): ${firstName}`);
          continue;
        }
        
        // Check for "last name" or similar patterns
        if (!lastName && (labelLower.includes('last name') || labelLower === 'lastname' || 
            labelLower === 'lname' || labelLower.includes('last'))) {
          lastName = valueStr;
          console.log(`Found last name in field "${fieldId}" (label: "${label}"): ${lastName}`);
          continue;
        }
        
        // Check for general "name" field (might contain full name)
        if ((!firstName || !lastName) && labelLower.includes('name') && 
            !labelLower.includes('first') && !labelLower.includes('last')) {
          const nameParts = valueStr.split(/\s+/).filter(p => p.length > 0);
          if (nameParts.length >= 2) {
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join(' ');
            console.log(`Found full name in field "${fieldId}" (label: "${label}"): ${firstName} ${lastName}`);
            break;
          } else if (nameParts.length === 1 && !firstName) {
            firstName = nameParts[0];
            console.log(`Found name in field "${fieldId}" (label: "${label}"): ${firstName}`);
          }
        }
      }
    }
    
    // Fallback: try to find by field ID pattern (if fieldLabelMap didn't work)
    if (!firstName && !lastName) {
      for (const [key, value] of Object.entries(submission.data)) {
        const strKey = key.toLowerCase();
        if (strKey.includes('name') && value) {
          const nameParts = String(value).split(' ');
          if (nameParts.length >= 2) {
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join(' ');
            console.log(`Found name in field "${key}" (fallback): ${firstName} ${lastName}`);
          } else {
            firstName = String(value);
            console.log(`Found firstName in field "${key}" (fallback): ${firstName}`);
          }
          break;
        }
      }
    }
    
    const fullName = `${firstName} ${lastName}`.trim() || phoneNumber; // Use phone if no name
    
    console.log(`Extracted: phoneNumber=${phoneNumber}, fullName=${fullName}`);

    // Step 1: Fetch all contact lists
    console.log('Fetching contact lists from Prompt.io...');
    const listsUrl = `https://${subdomain}.prompt.io/rest/1.0/contact_lists?first=0&max=200`;
    
    const listsController = new AbortController();
    const listsTimeoutId = setTimeout(() => listsController.abort(), 10000);

    const listsResponse = await fetch(listsUrl, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'orgAuthToken': apiKey
      },
      signal: listsController.signal
    });

    clearTimeout(listsTimeoutId);

    if (!listsResponse.ok) {
      const errorText = await listsResponse.text();
      console.error('Failed to fetch contact lists:', listsResponse.status, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch contact lists from Prompt.io' },
        { status: listsResponse.status }
      );
    }

    const listsData: PromptIOContactListsResponse = await listsResponse.json();
    console.log('Contact lists fetched:', listsData.contactLists);

    // Step 2: Find matching list by formTitle
    let matchingList = listsData.contactLists.find(
      list => list.name === submission.formTitle
    );

    if (!matchingList) {
      console.log(`No contact list found matching form title: "${submission.formTitle}"`);
      console.log('Creating new contact list...');
      
      // Create new contact list
      const formTitleModded = submission.formTitle.replace(/[^a-zA-Z0-9]/g, '_');
      
      const createListUrl = `https://${subdomain}.prompt.io/rest/1.0/contact_lists`;
      const createListPayload = {
        name: submission.formTitle,
        apiId: formTitleModded,
        icon: "",
        description: ""
      };

      console.log('Creating list with payload:', createListPayload);

      const createListController = new AbortController();
      const createListTimeoutId = setTimeout(() => createListController.abort(), 10000);

      const createListResponse = await fetch(createListUrl, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'orgAuthToken': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createListPayload),
        signal: createListController.signal
      });

      clearTimeout(createListTimeoutId);

      if (!createListResponse.ok) {
        const errorText = await createListResponse.text();
        console.error('Failed to create contact list:', createListResponse.status, errorText);
        return NextResponse.json(
          { 
            error: 'Failed to create contact list in Prompt.io',
            details: errorText
          },
          { status: createListResponse.status }
        );
      }

      const newListData = await createListResponse.json();
      console.log('Contact list created successfully - raw response:', JSON.stringify(newListData, null, 2));
      
      // Handle different possible response structures
      if (newListData.contactList) {
        matchingList = newListData.contactList;
      } else if (newListData.id) {
        matchingList = newListData as PromptIOContactList;
      } else {
        console.error('Unexpected response structure when creating list:', newListData);
        return NextResponse.json(
          { error: 'Unable to determine created list ID' },
          { status: 500 }
        );
      }
      
      console.log('Parsed matching list:', matchingList);
    }

    // Type guard: matchingList should always be defined at this point
    if (!matchingList) {
      console.error('Critical error: matchingList is undefined');
      return NextResponse.json(
        { error: 'Failed to get or create contact list' },
        { status: 500 }
      );
    }

    console.log(`Using list: "${matchingList.name}" (ID: ${matchingList.id})`);

    // Step 3: Add contact to the matching list
    let contactAdded = false;
    try {
      const addContactUrl = `https://${subdomain}.prompt.io/rest/1.0/contact_lists/${matchingList.id}/contacts`;
      
      const contactPayload: AddContactPayload = {
        identityType: 'SMS',
        contacts: [
          {
            identityKey: phoneNumber,
            displayName: fullName
          }
        ]
      };

      console.log('Adding contact to list:', addContactUrl);
      console.log('Contact payload:', contactPayload);

      const addContactController = new AbortController();
      const addContactTimeoutId = setTimeout(() => addContactController.abort(), 10000);

      const addContactResponse = await fetch(addContactUrl, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'orgAuthToken': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactPayload),
        signal: addContactController.signal
      });

      clearTimeout(addContactTimeoutId);

      if (!addContactResponse.ok) {
        const errorText = await addContactResponse.text();
        console.error('Failed to add contact to list:', addContactResponse.status, errorText);
        console.error('This is non-fatal - continuing with SMS if opted in...');
      } else {
        const addContactResult = await addContactResponse.json();
        console.log('Contact added successfully:', addContactResult);
        contactAdded = true;
      }
    } catch (addContactError) {
      console.error('Error adding contact to list (non-fatal):', addContactError);
      console.error('Continuing with SMS if opted in...');
    }

    // Step 4: Send SMS if user opted in for text messages
    const wantsTextMessages = submission.data.text_messages === 'yes';
    
    if (wantsTextMessages) {
      try {
        console.log('User opted in for text messages, sending welcome message...');
        
        const sendMessageUrl = `https://${subdomain}.prompt.io/rest/1.0/messages/send_to_customer`;
        const messagePayload = {
          message: "Thank you for signing up to receive DAV membership and veteran resource information via text. Msg & data rates may apply. Reply STOP to opt out.",
          orgChannelApiId: "ps_1_859_2155511",
          customerChannelKey: phoneNumber,
          ignoreDeliveryRestrictions: true,
          isBroadcast: false
        };

        console.log('Sending message payload:', messagePayload);

        const sendMessageController = new AbortController();
        const sendMessageTimeoutId = setTimeout(() => sendMessageController.abort(), 10000);

        const sendMessageResponse = await fetch(sendMessageUrl, {
          method: 'POST',
          headers: {
            'accept': '*/*',
            'orgAuthToken': apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(messagePayload),
          signal: sendMessageController.signal
        });

        clearTimeout(sendMessageTimeoutId);

        if (!sendMessageResponse.ok) {
          const errorText = await sendMessageResponse.text();
          console.error('Failed to send message:', sendMessageResponse.status, errorText);
          // Continue even if message send fails - don't fail the whole submission
        } else {
          const messageResult = await sendMessageResponse.json();
          console.log('Message sent successfully:', messageResult);
        }
      } catch (messageError) {
        console.error('Error sending message (non-fatal):', messageError);
        // Continue even if message send fails - don't fail the whole submission
      }
    }

    return NextResponse.json({
      success: true,
      message: contactAdded ? 'Contact added to list and message sent successfully' : 'Message sent successfully (contact list update had issues)',
      data: {
        listId: matchingList.id,
        listName: matchingList.name,
        phoneNumber,
        displayName: fullName,
        contactAdded,
        messageSent: wantsTextMessages,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error processing form submission:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process submission',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

