const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

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

// API Routes
app.get('/api/forms', (req, res) => {
  res.json({
    success: true,
    data: sampleForms
  });
});

app.post('/api/forms', (req, res) => {
  const newForm = {
    id: sampleForms.length + 1,
    ...req.body,
    createdAt: new Date().toISOString()
  };
  
  sampleForms.push(newForm);
  
  res.status(201).json({
    success: true,
    data: newForm
  });
});

app.get('/api/embed-form', (req, res) => {
  const formId = req.query.formId || req.query.id;
  
  if (!formId) {
    res.status(400).json({
      success: false,
      message: 'Form ID is required'
    });
    return;
  }

  const form = sampleForms.find(f => f.id == formId);

  if (!form) {
    res.status(404).json({
      success: false,
      message: 'Form not found'
    });
    return;
  }

  res.json({
    success: true,
    data: form
  });
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve embed page
app.get('/embed.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'embed.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log(`📝 Forms API: http://localhost:${PORT}/api/forms`);
  console.log(`🔗 Embed API: http://localhost:${PORT}/api/embed-form`);
  console.log(`📄 Main page: http://localhost:${PORT}/`);
  console.log(`📄 Embed page: http://localhost:${PORT}/embed.html`);
});
