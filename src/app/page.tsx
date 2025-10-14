'use client';

import { Suspense, useState, useEffect } from 'react';
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

function FormBuilderContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');
  const { isConfigured, loadFormsFromPromptIO, saveFormToPromptIO } = usePromptIO();
  
  const [forms, setForms] = useState<Form[]>([]);
  const [currentForm, setCurrentForm] = useState<Form | null>(null);
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadForms();
  }, [isConfigured, loadFormsFromPromptIO]);

  const loadForms = async () => {
    try {
      setLoading(true);
      
      if (isConfigured) {
        // Load from Prompt.io
        const promptIOForms = await loadFormsFromPromptIO();
        setForms(promptIOForms);
      } else {
        // Fallback to local API
        const response = await fetch('/api/forms');
        const data = await response.json();
        
        if (data.success) {
          setForms(data.data);
        } else {
          console.error('Failed to load forms:', data.message);
        }
      }
    } catch (error) {
      console.error('Error loading forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForm = () => {
    setCurrentForm({
      id: 0,
      title: '',
      description: '',
      fields: [],
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
      if (isConfigured) {
        // Save to Prompt.io
        await saveFormToPromptIO(form);
      } else {
        // Fallback to local API
        const response = await fetch('/api/forms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form),
        });

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message);
        }
      }
      
      await loadForms(); // Reload forms
      setShowFormBuilder(false);
      setCurrentForm(null);
    } catch (error) {
      console.error('Error saving form:', error);
    }
  };

  const handleDeleteForm = async (formId: number) => {
    if (!confirm('Are you sure you want to delete this form?')) {
      return;
    }

    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        await loadForms(); // Reload forms
      } else {
        console.error('Failed to delete form:', data.message);
      }
    } catch (error) {
      console.error('Error deleting form:', error);
    }
  };

  const handlePreviewForm = (form: Form) => {
    const preview = window.open('', '_blank', 'width=600,height=400');
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
            <button type="submit" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Submit</button>
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
                  onDelete={() => handleDeleteForm(form.id)}
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