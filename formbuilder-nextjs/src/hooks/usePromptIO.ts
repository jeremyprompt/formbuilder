'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

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

interface PromptIOConfig {
  subdomain: string | null;
  orgAuthToken: string | null;
  apiBaseUrl: string | null;
  callbackUrl: string | null;
}

export function usePromptIO() {
  const searchParams = useSearchParams();
  const [config, setConfig] = useState<PromptIOConfig>({
    subdomain: null,
    orgAuthToken: null,
    apiBaseUrl: null,
    callbackUrl: null
  });

  const loadConfig = () => {
    // Extract subdomain from current URL
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    
    let subdomain: string | null = null;
    let apiBaseUrl: string | null = null;
    
    // Check if we're on a subdomain (e.g., jeremy.prompt.io)
    if (parts.length >= 3 && parts[1] === 'prompt') {
      subdomain = parts[0];
      apiBaseUrl = `https://${subdomain}.prompt.io/api`;
    } else {
      // Fallback for development or custom domains
      subdomain = localStorage.getItem('promptio_subdomain') || 'demo';
      apiBaseUrl = `https://${subdomain}.prompt.io/api`;
    }
    
    // Load token from localStorage
    const orgAuthToken = localStorage.getItem('promptio_orgAuthToken');
    
    // Get callback URL from URL params
    const callbackUrl = searchParams.get('callbackUrl');
    
    setConfig({
      subdomain,
      orgAuthToken,
      apiBaseUrl,
      callbackUrl
    });
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const saveConfig = (subdomain: string, orgAuthToken: string) => {
    // Save to localStorage
    localStorage.setItem('promptio_subdomain', subdomain);
    localStorage.setItem('promptio_orgAuthToken', orgAuthToken);
    
    // Update config
    const apiBaseUrl = `https://${subdomain}.prompt.io/api`;
    setConfig({
      subdomain,
      orgAuthToken,
      apiBaseUrl,
      callbackUrl: config.callbackUrl
    });
  };

  const saveFormToPromptIO = async (form: Form) => {
    if (!config.orgAuthToken || !config.apiBaseUrl) {
      throw new Error('Prompt.io not configured');
    }

    try {
      const response = await fetch(`${config.apiBaseUrl}/custom-data/formbuilder_forms`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${config.orgAuthToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          forms: [form]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving form to Prompt.io:', error);
      throw error;
    }
  };

  const loadFormsFromPromptIO = async () => {
    if (!config.orgAuthToken || !config.apiBaseUrl) {
      throw new Error('Prompt.io not configured');
    }

    try {
      const response = await fetch(`${config.apiBaseUrl}/custom-data/formbuilder_forms`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.orgAuthToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return []; // No forms found yet
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle Prompt.io response format
      if (data && Array.isArray(data.forms)) {
        return data.forms;
      } else if (data && Array.isArray(data)) {
        return data;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error loading forms from Prompt.io:', error);
      throw error;
    }
  };

  const submitToCallbackUrl = async (formData: Record<string, unknown>, formCallbackUrl?: string) => {
    const targetCallbackUrl = formCallbackUrl || config.callbackUrl;
    
    if (!targetCallbackUrl) {
      console.log('No callback URL configured');
      return;
    }

    try {
      const response = await fetch(targetCallbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Form submitted successfully to callback URL');
      return await response.json();
    } catch (error) {
      console.error('Error submitting to callback URL:', error);
      throw error;
    }
  };

  return {
    config,
    saveConfig,
    saveFormToPromptIO,
    loadFormsFromPromptIO,
    submitToCallbackUrl,
    isConfigured: !!(config.subdomain && config.orgAuthToken)
  };
}
