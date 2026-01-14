'use client';

import { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2, Edit } from 'lucide-react';

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

// Automatic fields that are always present in every form
const AUTOMATIC_FIELDS: FormField[] = [
  { id: 'first_name', type: 'text', label: 'First Name', required: true },
  { id: 'last_name', type: 'text', label: 'Last Name', required: true },
  { id: 'phone_number', type: 'text', label: 'Phone Number', required: true }
];

const US_STATE_ABBREVIATIONS = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

// Check if a field is an automatic field
const isAutomaticField = (fieldId: string): boolean => {
  return AUTOMATIC_FIELDS.some(f => f.id === fieldId);
};

interface FormBuilderProps {
  form: Form;
  onSave: (form: Form) => void;
  onCancel: () => void;
}

export default function FormBuilder({ form, onSave, onCancel }: FormBuilderProps) {
  const [title, setTitle] = useState(form.title);
  const [description, setDescription] = useState(form.description);
  const [callbackUrl, setCallbackUrl] = useState(form.callbackUrl || '');
  const [confirmationMessage, setConfirmationMessage] = useState(form.confirmationMessage || '');
  
  // Separate automatic fields from additional fields
  const [additionalFields, setAdditionalFields] = useState<FormField[]>(() => {
    // Filter out automatic fields from form.fields to get only additional fields
    return form.fields.filter(field => !isAutomaticField(field.id));
  });

  // Ensure automatic fields are always present when form is initialized or saved
  useEffect(() => {
    // This ensures automatic fields are included when component mounts
    // They'll be merged when saving
  }, []);

  const fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'email', label: 'Email' },
    { value: 'textarea', label: 'Textarea' },
    { value: 'state', label: '2 Character State' },
    { value: 'select', label: 'Dropdown' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'checkbox', label: 'Checkbox' }
  ];

  const addField = () => {
    const fieldId = `field_${Date.now()}`;
    const newField: FormField = {
      id: fieldId,
      type: 'text',
      label: 'New Field',
      required: false,
      options: []
    };
    setAdditionalFields([...additionalFields, newField]);
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    // Check if it's an automatic field (shouldn't happen, but safety check)
    if (isAutomaticField(fieldId)) {
      return; // Don't allow editing automatic fields
    }
    setAdditionalFields(additionalFields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ));
  };

  const removeField = (fieldId: string) => {
    // Prevent removal of automatic fields
    if (isAutomaticField(fieldId)) {
      return;
    }
    setAdditionalFields(additionalFields.filter(field => field.id !== fieldId));
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Please enter a form title');
      return;
    }

    // Merge automatic fields with additional fields
    const allFields = [...AUTOMATIC_FIELDS, ...additionalFields];

    const updatedForm: Form = {
      ...form,
      title: title.trim(),
      description: description.trim(),
      callbackUrl: callbackUrl.trim(),
      confirmationMessage: confirmationMessage.trim(),
      fields: allFields,
      updatedAt: new Date().toISOString()
    };

    onSave(updatedForm);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Form Builder</h2>
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save Form
              </button>
              <button
                onClick={onCancel}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <X className="w-5 h-5" />
                Cancel
              </button>
            </div>
          </div>

          {/* Form Settings */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Form Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter form title"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Form Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter form description"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmation Message
              </label>
              <textarea
                value={confirmationMessage}
                onChange={(e) => setConfirmationMessage(e.target.value)}
                placeholder="This will be the confirmation message text your clients will receive when they submit their form."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical text-gray-900"
              />
              <p className="text-sm text-gray-500 mt-2">
                This will be the confirmation message text your clients will receive when they submit their form.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Callback URL (Optional)
              </label>
              <input
                type="url"
                value={callbackUrl}
                onChange={(e) => setCallbackUrl(e.target.value)}
                placeholder="https://your-api.com/webhook"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
              <p className="text-sm text-gray-500 mt-2">
                Form submissions will be sent to this URL via POST request
              </p>
            </div>
          </div>
        </div>

        {/* Automatic Fields Section */}
        <div className="bg-blue-50 rounded-xl p-6 shadow-sm border border-blue-200 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Automatic Fields</h3>
          <p className="text-sm text-gray-600 mb-4">
            These fields are automatically included in every form and cannot be removed.
          </p>
          <div className="space-y-3">
            {AUTOMATIC_FIELDS.map((field) => (
              <div key={field.id} className="bg-white border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-900">{field.label}</span>
                  <span className="text-sm text-gray-500">({fieldTypes.find(t => t.value === field.type)?.label})</span>
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                    Required
                  </span>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Automatic
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Fields Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Additional Fields</h3>
            <button
              onClick={addField}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Field
            </button>
          </div>

          <div className="space-y-4">
            {additionalFields.map((field) => (
              <FieldEditor
                key={field.id}
                field={field}
                fieldTypes={fieldTypes}
                onUpdate={(updates) => updateField(field.id, updates)}
                onRemove={() => removeField(field.id)}
              />
            ))}

            {additionalFields.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No additional fields added yet. Click &quot;Add Field&quot; to add custom fields.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface FieldEditorProps {
  field: FormField;
  fieldTypes: { value: string; label: string }[];
  onUpdate: (updates: Partial<FormField>) => void;
  onRemove: () => void;
}

function FieldEditor({ field, fieldTypes, onUpdate, onRemove }: FieldEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(field.label);

  const handleSaveLabel = () => {
    if (editLabel.trim()) {
      onUpdate({ label: editLabel.trim() });
      setIsEditing(false);
    }
  };

  const handleTypeChange = (nextType: string) => {
    // For "2 Character State", force a dropdown of all US states.
    if (nextType === 'state') {
      onUpdate({ type: nextType, options: US_STATE_ABBREVIATIONS });
      return;
    }

    // If switching away from state, clear its forced options.
    if (field.type === 'state') {
      onUpdate({ type: nextType, options: [] });
      return;
    }

    onUpdate({ type: nextType });
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {isEditing ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                autoFocus
                onBlur={handleSaveLabel}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveLabel();
                  if (e.key === 'Escape') {
                    setEditLabel(field.label);
                    setIsEditing(false);
                  }
                }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900">{field.label}</h4>
              <span className="text-sm text-gray-500">
                ({fieldTypes.find(t => t.value === field.type)?.label})
              </span>
              {field.required && (
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                  Required
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="text-gray-600 hover:text-gray-800 p-1"
            title="Edit label"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onRemove}
            className="text-red-600 hover:text-red-800 p-1"
            title="Remove field"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Field Type
          </label>
          <select
            value={field.type}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          >
            {fieldTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => onUpdate({ required: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Required</span>
          </label>
        </div>
      </div>
    </div>
  );
}
