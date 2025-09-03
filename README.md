# Form Builder

A modern form builder application built with JavaScript and deployed on Vercel.

## Features

- 🎨 **Modern UI**: Clean, responsive design with a beautiful interface
- 📝 **Form Creation**: Create custom forms with various field types
- 🔧 **Form Management**: Edit, preview, and delete your forms
- 🚀 **Vercel Ready**: Optimized for Vercel deployment
- 📱 **Responsive**: Works on desktop and mobile devices

## Field Types Supported

- Text Input
- Email
- Textarea
- Dropdown (Select)
- Radio Buttons
- Checkbox

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Vercel CLI (optional, for local development)

### Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Local Development

1. Install Vercel CLI globally (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:3000`

### Deployment to Vercel

1. **Using Vercel CLI:**
   ```bash
   vercel
   ```

2. **Using Vercel Dashboard:**
   - Connect your GitHub repository to Vercel
   - Vercel will automatically detect the configuration and deploy

3. **Manual deployment:**
   ```bash
   npm run deploy
   ```

## Project Structure

```
formbuilder/
├── api/                    # API routes
│   ├── hello.js           # Sample API endpoint
│   └── forms.js           # Forms management API
├── public/                # Static files
│   ├── index.html         # Main HTML file
│   ├── styles.css         # CSS styles
│   └── app.js             # Frontend JavaScript
├── package.json           # Dependencies and scripts
├── vercel.json           # Vercel configuration
└── README.md             # This file
```

## API Endpoints

### GET /api/hello
Returns a greeting message with optional name parameter.

**Example:**
```
GET /api/hello?name=John
```

### GET /api/forms
Returns a list of all forms.

### POST /api/forms
Creates a new form.

**Request Body:**
```json
{
  "title": "Contact Form",
  "description": "A simple contact form",
  "fields": [
    {
      "id": "name",
      "type": "text",
      "label": "Name",
      "required": true
    }
  ]
}
```

## Usage

1. **Create a Form:**
   - Click "Create New Form" button
   - Enter form title and description
   - Add fields using the "Add Field" button
   - Save your form

2. **Manage Forms:**
   - View all your forms on the main page
   - Edit existing forms
   - Preview forms in a new window
   - Delete forms you no longer need

3. **Form Fields:**
   - Add various field types to your forms
   - Set fields as required or optional
   - Customize field labels

## Customization

### Adding New Field Types

To add new field types, modify the `addField()` method in `public/app.js`:

```javascript
const fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'email', label: 'Email' },
    { value: 'textarea', label: 'Textarea' },
    { value: 'select', label: 'Dropdown' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'checkbox', label: 'Checkbox' },
    // Add your new field type here
    { value: 'date', label: 'Date Picker' }
];
```

### Styling

The application uses modern CSS with:
- CSS Grid for layouts
- Flexbox for component alignment
- CSS custom properties for theming
- Responsive design principles

Modify `public/styles.css` to customize the appearance.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have questions, please open an issue on the repository.
