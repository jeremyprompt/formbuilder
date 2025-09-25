// API endpoint to serve individual forms for embedding
export default function handler(req, res) {
  // Set CORS headers for embedding
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
    return;
  }

  const formId = req.query.formId || req.query.id;

  if (!formId) {
    res.status(400).json({
      success: false,
      message: 'Form ID is required'
    });
    return;
  }

  // Sample forms data (in a real app, this would come from a database)
  // This should match the data in /api/forms.js
  const sampleForms = [
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

  const form = sampleForms.find(f => f.id == formId);

  if (!form) {
    res.status(404).json({
      success: false,
      message: 'Form not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: form
  });
};
