import { NextRequest, NextResponse } from 'next/server';

interface Form {
  id: number;
  title: string;
  description: string;
  fields: FormField[];
  callbackUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[];
}

// Sample forms data (in production, this would be stored in Prompt.io)
const sampleForms: Form[] = [
  {
    id: 1,
    title: 'Contact Form',
    description: 'A simple contact form',
    fields: [
      { id: 'name', type: 'text', label: 'Name', required: true },
      { id: 'email', type: 'email', label: 'Email', required: true },
      { id: 'message', type: 'textarea', label: 'Message', required: true }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Survey Form',
    description: 'Customer satisfaction survey',
    fields: [
      { id: 'rating', type: 'radio', label: 'Rating', options: ['1', '2', '3', '4', '5'], required: true },
      { id: 'feedback', type: 'textarea', label: 'Additional Feedback', required: false }
    ],
    createdAt: new Date().toISOString()
  }
];

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: sampleForms
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to load forms'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();
    
    // Generate new ID
    const newId = Math.max(...sampleForms.map(f => f.id), 0) + 1;
    
    const newForm: Form = {
      id: newId,
      ...formData,
      createdAt: new Date().toISOString()
    };
    
    sampleForms.push(newForm);
    
    return NextResponse.json({
      success: true,
      data: newForm
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to save form'
    }, { status: 500 });
  }
}
