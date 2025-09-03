// Sample forms API endpoint
module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Sample forms data
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

  if (req.method === 'GET') {
    res.status(200).json({
      success: true,
      data: sampleForms
    });
  } else if (req.method === 'POST') {
    // Handle form creation
    const newForm = {
      id: sampleForms.length + 1,
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    res.status(201).json({
      success: true,
      data: newForm
    });
  } else {
    res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }
};
