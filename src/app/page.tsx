'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Settings } from 'lucide-react';
import FormBuilder from '@/components/FormBuilder';
import FormCard from '@/components/FormCard';
import SettingsDialog from '@/components/SettingsDialog';
import { usePromptIO } from '@/hooks/usePromptIO';

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

interface SchemaPayload {
  formTitle: string;
  formDescription: string;
  [key: string]: string;
}

function FormBuilderContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');
  const { isConfigured, saveFormToPromptIO } = usePromptIO();
  
  const [forms, setForms] = useState<Form[]>([]);
  const [currentForm, setCurrentForm] = useState<Form | null>(null);
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  const saveFormToPromptIOSchema = useCallback(async (form: Form) => {
    // Automatic fields that should NOT be saved to schema (they're always added automatically)
    const automaticFieldIds = ['first_name', 'last_name', 'phone_number'];
    
    // Build the payload according to your requirements
    const payload: SchemaPayload = {
      formTitle: form.title || '',
      formDescription: form.description || ''
    };

    // Add each form field as a property, EXCLUDING automatic fields
    let fieldIndex = 0;
    form.fields.forEach((field) => {
      // Skip automatic fields - they don't need to be saved
      if (!automaticFieldIds.includes(field.id)) {
        payload[`field_${fieldIndex}`] = `${field.label} (${field.type}${field.required ? ', required' : ''})`;
        fieldIndex++;
      }
    });

    console.log('Saving form payload:', payload);
    console.log('Form title:', form.title, 'Form description:', form.description);

    try {
      // Use environment variables for subdomain and apiKey
      const response = await fetch('/api/save-to-schema', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        // Try to read error details from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        // Read response as text first, then try to parse as JSON
        try {
          const responseText = await response.text();
          console.error('Error response text:', responseText);
          
          try {
            const errorData = JSON.parse(responseText);
            console.error('Error response from API:', errorData);
            errorMessage = errorData.error || errorMessage;
            if (errorData.details) {
              errorMessage += ` - Details: ${JSON.stringify(errorData.details)}`;
            }
            if (errorData.received) {
              errorMessage += ` - Received: ${JSON.stringify(errorData.received)}`;
            }
          } catch (parseError) {
            // Not JSON, use the text directly
            errorMessage += ` - ${responseText}`;
          }
        } catch (readError) {
          console.error('Could not read error response:', readError);
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Form saved to Prompt.io schema successfully:', result);
      return result;
    } catch (error) {
      console.error('Error saving form to Prompt.io schema:', error);
      throw error;
    }
  }, []);

  const loadForms = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load forms from schema endpoint (uses Vercel env vars)
      const response = await fetch('/api/load-schema-forms', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Failed to load forms from schema:', response.status);
        setForms([]);
        return;
      }

      const result = await response.json();
      
      if (result.success && result.forms) {
        setForms(result.forms);
      } else {
        console.warn('No forms returned from schema');
        setForms([]);
      }
    } catch (error) {
      console.error('Error loading forms:', error);
      setForms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  const handleCreateForm = () => {
    // Automatic fields that are always included
    const automaticFields = [
      { id: 'first_name', type: 'text', label: 'First Name', required: true },
      { id: 'last_name', type: 'text', label: 'Last Name', required: true },
      { id: 'phone_number', type: 'text', label: 'Phone Number', required: true }
    ];
    
    setCurrentForm({
      id: 0,
      title: '',
      description: '',
      fields: automaticFields, // Include automatic fields by default
      callbackUrl: callbackUrl || '',
      createdAt: new Date().toISOString()
    });
    setShowFormBuilder(true);
  };

  const handleEditForm = (form: Form) => {
    setCurrentForm({ ...form });
    setShowFormBuilder(true);
  };

  const handleSaveForm = async (form: Form) => {
    try {
      // Save to Prompt.io schema endpoint (uses env variables)
      try {
        await saveFormToPromptIOSchema(form);
      } catch (schemaError) {
        console.warn('Failed to save to Prompt.io schema:', schemaError);
        const errorMessage = schemaError instanceof Error ? schemaError.message : 'Unknown error';
        alert(`Failed to save form: ${errorMessage}`);
        throw schemaError;
      }

      // Also save to Prompt.io custom data (if configured)
      if (isConfigured) {
        try {
          await saveFormToPromptIO(form);
        } catch (customDataError) {
          console.warn('Failed to save to Prompt.io custom data:', customDataError);
          // Schema save was successful, so we can continue
        }
      }
      
      await loadForms(); // Reload forms
      setShowFormBuilder(false);
      setCurrentForm(null);
    } catch (error) {
      console.error('Error saving form:', error);
      alert('Failed to save form. Please try again.');
    }
  };

  const handleDeleteForm = async (form: Form) => {
    if (!confirm('Are you sure you want to delete this form?')) {
      return;
    }

    try {
      // Call DELETE endpoint with formTitle
      const response = await fetch('/api/save-to-schema', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ formTitle: form.title })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Form deleted successfully:', result);
      
      // Reload forms after successful deletion
      await loadForms();
    } catch (error) {
      console.error('Error deleting form:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to delete form: ${errorMessage}`);
    }
  };

  const handlePreviewForm = (form: Form) => {
    const preview = window.open('', '_blank', 'width=600,height=500');
    preview?.document.write(`
      <html>
        <head>
          <title>Preview: ${form.title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .form-field { margin-bottom: 15px; }
            label { display: block; margin-bottom: 5px; font-weight: bold; }
            input, textarea, select { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
            .required { color: red; }
            .checkbox-label { display: flex; align-items: center; gap: 8px; font-weight: normal; }
            .disclaimer { font-size: 11px; color: #666; margin-top: 10px; line-height: 1.4; }
          </style>
        </head>
        <body>
          <h2>${form.title}</h2>
          <p>${form.description}</p>
          <form>
            ${form.fields.map(field => `
              <div class="form-field">
                <label>${field.label} ${field.required ? '<span class="required">*</span>' : ''}</label>
                ${renderFieldInput(field)}
              </div>
            `).join('')}
            <div style="margin-bottom: 15px; padding-left: 0;">
              <label class="checkbox-label" style="padding-left: 0; margin-left: 0;">
                <input type="checkbox" id="text_messages" name="text_messages" value="yes">
                Yes! I want to receive text messages
              </label>
            </div>
            <button type="submit" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%;">Sign Up</button>
            <div class="disclaimer">
              <div>Message and data rates may apply.</div>
              <div>Recurring messages subscription.</div>
              <div>Available in US and Canada.</div>
            </div>
          </form>
        </body>
      </html>
    `);
  };

  const renderFieldInput = (field: FormField) => {
    switch (field.type) {
      case 'textarea':
        return `<textarea placeholder="${field.label}"></textarea>`;
      case 'select':
        return `<select><option>Select an option</option></select>`;
      case 'radio':
        return `<input type="radio" name="${field.id}"> Option 1<br><input type="radio" name="${field.id}"> Option 2`;
      case 'checkbox':
        return `<input type="checkbox"> ${field.label}`;
      default:
        return `<input type="${field.type}" placeholder="${field.label}">`;
    }
  };

  const handleGenerateEmbedCode = (form: Form) => {
    const baseUrl = window.location.origin;
    const embedUrl = `${baseUrl}/embed/${form.id}${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`;
    
    const embedCode = `<iframe 
    src="${embedUrl}" 
    width="100%" 
    height="600" 
    frameborder="0" 
    style="border: none; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
</iframe>`;

    navigator.clipboard.writeText(embedCode).then(() => {
      alert('Embed code copied to clipboard!');
    }).catch(() => {
      // Fallback: show in prompt
      prompt('Copy this embed code:', embedCode);
    });
  };

  if (showFormBuilder && currentForm) {
    return (
      <FormBuilder
        form={currentForm}
        onSave={handleSaveForm}
        onCancel={() => {
          setShowFormBuilder(false);
          setCurrentForm(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8 mb-8 shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2">Form Builder</h1>
              <p className="text-blue-100">Create and manage your forms with ease</p>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg border border-white/30 transition-colors"
              title="Configure Prompt.io Integration"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900">Your Forms</h2>
            <button
              onClick={handleCreateForm}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create New Form
            </button>
          </div>

          {/* Forms Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-gray-500">Loading forms...</div>
            </div>
          ) : forms.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">
                No forms created yet. Click &quot;Create New Form&quot; to get started!
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {forms.map((form) => (
                <FormCard
                  key={form.id}
                  form={form}
                  onEdit={() => handleEditForm(form)}
                  onPreview={() => handlePreviewForm(form)}
                  onEmbed={() => handleGenerateEmbedCode(form)}
                  onDelete={() => handleDeleteForm(form)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Settings Dialog */}
      {showSettings && (
        <SettingsDialog
          onClose={() => setShowSettings(false)}
          callbackUrl={callbackUrl}
        />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <FormBuilderContent />
    </Suspense>
  );
}