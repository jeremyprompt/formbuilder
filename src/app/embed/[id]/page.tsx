'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePromptIO } from '@/hooks/usePromptIO';

interface Form {
  id: number;
  title: string;
  description: string;
  fields: FormField[];
  callbackUrl?: string;
  confirmationMessage?: string;
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

const US_STATE_ABBREVIATIONS = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export default function EmbedForm({ params }: { params: Promise<{ id: string }> }) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');
  const { submitToCallbackUrl } = usePromptIO();
  
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadFormData = async () => {
      const { id } = await params;
      await loadForm(id);
    };
    loadFormData();
  }, [params]);

  const loadForm = async (formId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/load-schema-forms`);
      const data = await response.json();
      
      if (data.success && data.forms) {
        const foundForm = data.forms.find((f: Form) => f.id === parseInt(formId));
        if (foundForm) {
          setForm(foundForm);
        } else {
          setMessage({ type: 'error', text: 'Form not found' });
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to load form' });
      }
    } catch (error) {
      console.error('Error loading form:', error);
      setMessage({ type: 'error', text: 'Failed to load form' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!form) return;
    
    setSubmitting(true);
    setMessage(null);

    try {
      const formData = new FormData(e.currentTarget);
      const data: Record<string, string> = {};
      
      // Validate email fields
      const emailRegex = /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/i;
      for (const field of form.fields) {
        if (field.type === 'email') {
          const emailValue = formData.get(field.id)?.toString() || '';
          if (field.required && !emailValue) {
            setMessage({ type: 'error', text: `Please enter a valid email address for ${field.label}` });
            setSubmitting(false);
            return;
          }
          if (emailValue && !emailRegex.test(emailValue)) {
            setMessage({ type: 'error', text: `Please enter a valid email address for ${field.label}` });
            setSubmitting(false);
            return;
          }
        }
      }
      
      formData.forEach((value, key) => {
        data[key] = value.toString();
      });

      console.log('=== CLIENT-SIDE FORM SUBMISSION ===');
      console.log('Form ID:', form.id);
      console.log('Form Title:', form.title);
      console.log('Form fields:', form.fields);
      console.log('Submission data:', data);
      console.log('Data keys:', Object.keys(data));

      const submission = {
        formId: form.id,
        formTitle: form.title,
        data,
        submittedAt: new Date().toISOString(),
        userAgent: navigator.userAgent
      };

      console.log('Full submission payload:', JSON.stringify(submission, null, 2));

      // Submit to Prompt.io form submission API
      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submission)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Submission failed');
      }

      // Also optionally call the callback URL if provided
      const targetCallbackUrl = callbackUrl || form.callbackUrl;
      
      if (targetCallbackUrl) {
        try {
          await submitToCallbackUrl(submission, targetCallbackUrl);
        } catch (callbackError) {
          console.error('Callback URL error (non-fatal):', callbackError);
        }
      }

      setMessage({ type: 'success', text: 'Thank you! Your form has been submitted successfully.' });
      
      // Reset form (only if it still exists)
      if (e.currentTarget) {
        try {
          e.currentTarget.reset();
        } catch (resetError) {
          console.log('Form already cleared or removed from DOM');
        }
      }

      // Hide success message after 5 seconds
      setTimeout(() => {
        setMessage(null);
      }, 5000);

    } catch (error) {
      console.error('Error submitting form:', error);
      setMessage({ type: 'error', text: 'Sorry, there was an error submitting your form. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const fieldId = `field_${field.id}`; // Used in all field type cases (textarea, select, state, radio, checkbox, email, default)
    const requiredStar = field.required ? <span className="text-red-500">*</span> : null;

    switch (field.type) {
      case 'textarea':
        return (
          <div key={field.id} className="mb-4">
            <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-2">
              {field.label} {requiredStar}
            </label>
            <textarea
              id={fieldId}
              name={field.id}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical text-gray-900"
              placeholder={field.label}
              required={field.required}
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="mb-4">
            <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-2">
              {field.label} {requiredStar}
            </label>
            <select
              id={fieldId}
              name={field.id}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              required={field.required}
            >
              <option value="">Select an option</option>
              {(field.options || []).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );

      case 'state':
        return (
          <div key={field.id} className="mb-4">
            <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-2">
              {field.label} {requiredStar}
            </label>
            <select
              id={fieldId}
              name={field.id}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              required={field.required}
            >
              <option value="">Select a state</option>
              {US_STATE_ABBREVIATIONS.map((abbr) => (
                <option key={abbr} value={abbr}>
                  {abbr}
                </option>
              ))}
            </select>
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label} {requiredStar}
            </label>
            <div className="space-y-2">
              {(field.options || ['Option 1', 'Option 2']).map((option, index) => (
                <div key={index} className="flex items-center">
                  <input
                    type="radio"
                    id={`${fieldId}_${index}`}
                    name={field.id}
                    value={option}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                    required={field.required}
                  />
                  <label htmlFor={`${fieldId}_${index}`} className="text-sm text-gray-700">
                    {option}
                  </label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'checkbox':
        // If checkbox has options, render multiple checkboxes (one per option)
        // Otherwise, render as a single checkbox
        if (field.options && field.options.length > 0) {
          return (
            <div key={field.id} className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label} {requiredStar}
              </label>
              <div className="space-y-2">
                {field.options.map((option, index) => (
                  <div key={index} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`${fieldId}_${index}`}
                      name={field.id}
                      value={option}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor={`${fieldId}_${index}`} className="text-sm text-gray-700">
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return (
          <div key={field.id} className="mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id={fieldId}
                name={field.id}
                value="true"
                className="mr-2 text-blue-600 focus:ring-blue-500"
                required={field.required}
              />
              <label htmlFor={fieldId} className="text-sm font-medium text-gray-700">
                {field.label} {requiredStar}
              </label>
            </div>
          </div>
        );

      case 'email':
        return (
          <div key={field.id} className="mb-4">
            <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-2">
              {field.label} {requiredStar}
            </label>
            <input
              type="email"
              id={fieldId}
              name={field.id}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder={field.label}
              required={field.required}
              pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$"
              title="Please enter a valid email address"
            />
          </div>
        );

      default:
        return (
          <div key={field.id} className="mb-4">
            <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-2">
              {field.label} {requiredStar}
            </label>
            <input
              type={field.type}
              id={fieldId}
              name={field.id}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder={field.label}
              required={field.required}
            />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading form...</div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">Form not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">{form.title}</h2>
          {form.description && (
            <p className="text-gray-600 mb-6">{form.description}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {form.fields.map(renderField)}
            
            <div className="mb-4 pl-0">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="text_messages"
                  name="text_messages"
                  value="yes"
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="text_messages" className="text-sm font-medium text-gray-700">
                  Yes! I want to receive text messages
                </label>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              {submitting ? 'Submitting...' : 'Sign Up'}
            </button>
            
            <div className="text-xs text-gray-500 mt-2 space-y-1">
              <div>Message and data rates may apply.</div>
              <div>Recurring messages subscription.</div>
              <div>Available in US and Canada.</div>
            </div>
          </form>

          {message && (
            <div className={`mt-4 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
