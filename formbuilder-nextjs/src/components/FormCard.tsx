'use client';

import { Edit, Eye, Code, Trash2 } from 'lucide-react';

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

interface FormCardProps {
  form: Form;
  onEdit: () => void;
  onPreview: () => void;
  onEmbed: () => void;
  onDelete: () => void;
}

export default function FormCard({ form, onEdit, onPreview, onEmbed, onDelete }: FormCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{form.title}</h3>
      <p className="text-gray-600 mb-4">{form.description}</p>
      
      <div className="text-sm text-gray-500 mb-4">
        {form.fields.length} field(s) • Created {new Date(form.createdAt).toLocaleDateString()}
        {form.callbackUrl && (
          <div className="mt-1">
            📡 Callback URL configured
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
        
        <button
          onClick={onPreview}
          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
        >
          <Eye className="w-4 h-4" />
          Preview
        </button>
        
        <button
          onClick={onEmbed}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
        >
          <Code className="w-4 h-4" />
          Embed
        </button>
        
        <button
          onClick={onDelete}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>
  );
}
