'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface SettingsDialogProps {
  onClose: () => void;
  callbackUrl: string | null;
}

export default function SettingsDialog({ onClose, callbackUrl }: SettingsDialogProps) {
  const [subdomain, setSubdomain] = useState('');
  const [orgAuthToken, setOrgAuthToken] = useState('');

  const handleSave = () => {
    if (!subdomain.trim() || !orgAuthToken.trim()) {
      alert('Please enter both subdomain and auth token');
      return;
    }

    // Save to localStorage
    localStorage.setItem('promptio_subdomain', subdomain.trim());
    localStorage.setItem('promptio_orgAuthToken', orgAuthToken.trim());
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            ⚙️ Configure Prompt.io Integration
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">
            Connect this form builder to your Prompt.io organization.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization Subdomain
            </label>
            <input
              type="text"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              placeholder="e.g., jeremy"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Your Prompt.io subdomain (from subdomain.prompt.io)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization Auth Token
            </label>
            <input
              type="password"
              value={orgAuthToken}
              onChange={(e) => setOrgAuthToken(e.target.value)}
              placeholder="Enter your orgAuthToken"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Get this token from your Prompt.io organization settings
            </p>
          </div>

          {callbackUrl && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Callback URL:</strong> {callbackUrl}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                This URL will be used for form submissions
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Save Configuration
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
