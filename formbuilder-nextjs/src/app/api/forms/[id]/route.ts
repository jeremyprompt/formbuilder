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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formId = parseInt(id);
    
    const formIndex = sampleForms.findIndex(f => f.id === formId);
    if (formIndex === -1) {
      return NextResponse.json({
        success: false,
        message: 'Form not found'
      }, { status: 404 });
    }
    
    sampleForms.splice(formIndex, 1);
    
    return NextResponse.json({
      success: true,
      message: 'Form deleted successfully'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to delete form'
    }, { status: 500 });
  }
}
