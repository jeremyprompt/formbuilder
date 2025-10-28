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

    // Extract phone number and name from form data
    const phoneNumber = submission.data.phone || submission.data.phoneNumber || submission.data.mobile;
    
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Extract first and last name
    const firstName = submission.data.firstName || submission.data.first_name || '';
    const lastName = submission.data.lastName || submission.data.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim() || phoneNumber; // Use phone if no name

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
      console.log('Contact list created successfully:', newListData);
      
      matchingList = newListData;
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
      return NextResponse.json(
        { 
          error: 'Failed to add contact to Prompt.io list',
          details: errorText
        },
        { status: addContactResponse.status }
      );
    }

    const addContactResult = await addContactResponse.json();
    console.log('Contact added successfully:', addContactResult);

    // Step 4: Send SMS if user opted in for text messages
    const wantsTextMessages = submission.data.text_messages === 'yes';
    
    if (wantsTextMessages) {
      try {
        console.log('User opted in for text messages, sending welcome message...');
        
        const sendMessageUrl = `https://${subdomain}.prompt.io/rest/1.0/messages/send_to_customer`;
        const messagePayload = {
          message: "Thank you for signing up to receive DAV membership and veteran resource information via text. Msg & data rates may apply. Reply STOP to opt out.",
          orgChannelApiId: "ps_1_216_2361535",
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
      message: 'Contact added to list successfully',
      data: {
        listId: matchingList.id,
        listName: matchingList.name,
        phoneNumber,
        displayName: fullName,
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

