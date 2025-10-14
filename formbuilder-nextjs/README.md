# Form Builder - Next.js Version

A modern form builder application built with Next.js, TypeScript, and Tailwind CSS, designed to integrate seamlessly with Prompt.io organizations.

## Features

- 🎨 **Modern UI**: Clean, responsive design with Tailwind CSS
- 📝 **Form Creation**: Create custom forms with various field types
- 🔧 **Form Management**: Edit, preview, and delete your forms
- 🔗 **Prompt.io Integration**: Dynamic integration with any Prompt.io organization
- 💾 **Cloud Storage**: Forms are stored directly in your Prompt.io organization
- 🔒 **Secure**: Token-based authentication with Prompt.io
- 🌐 **Multi-Org Support**: Works with any Prompt.io subdomain
- 📱 **Responsive**: Works on desktop and mobile devices
- ⚡ **Next.js**: Built with App Router and TypeScript

## Field Types Supported

- Text Input
- Email
- Textarea
- Dropdown (Select)
- Radio Buttons
- Checkbox

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Prompt.io organization account
- Your Prompt.io organization auth token

### Installation

1. Navigate to the Next.js project:
   ```bash
   cd formbuilder-nextjs
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Prompt.io Integration

This form builder is designed to work dynamically with any Prompt.io organization. All form data is stored directly in your Prompt.io instance, making it a truly multi-tenant solution.

### Configuration

#### Option 1: Automatic Subdomain Detection (Recommended)

When you deploy this app to a Prompt.io subdomain (e.g., `jeremy.prompt.io`), the app will automatically detect the subdomain and only require you to enter your auth token.

1. Deploy the app to your Prompt.io organization's subdomain
2. Click the **⚙️ Settings** button in the header
3. Enter your **Organization Auth Token**
4. Click **Save Configuration**

#### Option 2: Manual Configuration

If you're running the app on a custom domain or localhost:

1. Click the **⚙️ Settings** button in the header
2. Enter your **Organization Subdomain** (e.g., `jeremy` from `jeremy.prompt.io`)
3. Enter your **Organization Auth Token**
4. Click **Save Configuration**

### Getting Your Auth Token

To get your Prompt.io organization auth token:

1. Log in to your Prompt.io organization dashboard
2. Navigate to **Settings** → **API** or **Integrations**
3. Copy your **Organization Auth Token** (orgAuthToken)
4. Paste it into the form builder's configuration dialog

### How It Works

- **Subdomain Detection**: The app automatically detects which Prompt.io org you're using
- **Secure Storage**: Your auth token is stored securely in your browser's localStorage
- **API Communication**: All form data is saved/loaded directly from Prompt.io's API
- **Multi-Org Ready**: Deploy the same codebase to multiple organizations without changes

## Callback URLs

Callback URLs allow your forms to send submission data to external endpoints, including Prompt.io Instant App webhooks.

### What are Callback URLs?

When you configure a callback URL for a form, all form submissions will automatically send a POST request to that URL with the submission data. This is perfect for:

- **Prompt.io Instant Apps**: Trigger workflows and actions in your Prompt.io organization
- **Webhooks**: Integrate with third-party services like Zapier, Make, or custom APIs
- **CRM Integration**: Send lead data directly to your CRM system
- **Notifications**: Trigger email/SMS notifications on form submission

### Setting Up a Callback URL

1. **Create or Edit a Form**
2. In the **Callback URL** field, enter your webhook endpoint:
   - For Prompt.io Instant Apps: Use your Instant App webhook URL
   - For custom integrations: Use any HTTPS endpoint that accepts POST requests

Example callback URLs:
```
https://jeremy.prompt.io/api/webhooks/form-submission
https://hooks.zapier.com/hooks/catch/12345/abcdef/
https://your-api.com/webhooks/form-submissions
```

### Callback Payload Format

When a form is submitted, the following JSON payload is sent to your callback URL:

```json
{
  "formId": 12345,
  "formTitle": "Contact Form",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Hello world!"
  },
  "submittedAt": "2024-01-15T10:30:00.000Z",
  "userAgent": "Mozilla/5.0..."
}
```

## Usage

1. **Create a Form:**
   - Click "Create New Form" button
   - Enter form title and description
   - (Optional) Add a callback URL for form submissions
   - Add fields using the "Add Field" button
   - Save your form (stored in Prompt.io)

2. **Manage Forms:**
   - View all your forms on the main page
   - Edit existing forms
   - Preview forms in a new window
   - Generate embed code for your forms
   - Delete forms you no longer need

3. **Form Fields:**
   - Add various field types to your forms
   - Set fields as required or optional
   - Customize field labels

4. **Embed Forms:**
   - Click "Embed" on any form to get the embed code
   - Copy the iframe code and paste it on your website
   - Forms submit data to your configured callback URL

5. **Form Submissions:**
   - Submissions are automatically sent to your callback URL
   - Perfect for Prompt.io Instant App webhooks
   - Use with Zapier, Make, or custom integrations

## Project Structure

```
formbuilder-nextjs/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   └── forms/         # Forms API endpoints
│   │   ├── embed/             # Embed pages
│   │   │   └── [id]/         # Individual form embed
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Main form builder page
│   ├── components/            # React components
│   │   ├── FormBuilder.tsx    # Form creation component
│   │   ├── FormCard.tsx       # Form display component
│   │   └── SettingsDialog.tsx # Configuration dialog
│   └── hooks/                 # Custom React hooks
│       └── usePromptIO.ts     # Prompt.io integration hook
├── tailwind.config.ts         # Tailwind CSS configuration
├── next.config.ts             # Next.js configuration
└── package.json               # Dependencies and scripts
```

## API Endpoints

### GET /api/forms
Returns a list of all forms (fallback when Prompt.io not configured).

### POST /api/forms
Creates a new form (fallback when Prompt.io not configured).

### DELETE /api/forms/[id]
Deletes a form by ID (fallback when Prompt.io not configured).

## Deployment

### Deploy to Vercel

1. **Using Vercel CLI:**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Using Vercel Dashboard:**
   - Connect your GitHub repository to Vercel
   - Vercel will automatically detect the Next.js configuration and deploy

3. **Manual deployment:**
   ```bash
   npm run build
   npm run start
   ```

### Deploy to Prompt.io Subdomain

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the `out` folder to your Prompt.io subdomain:
   ```
   https://yourorg.prompt.io/formbuilder/
   ```

3. Configure the app with your Prompt.io auth token

## Customization

### Adding New Field Types

To add new field types, modify the `fieldTypes` array in `src/components/FormBuilder.tsx`:

```typescript
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

The application uses Tailwind CSS with:
- Responsive design utilities
- Custom color schemes
- Smooth transitions and animations
- Modern component styling

Modify `tailwind.config.ts` to customize the appearance.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Environment Variables

Create a `.env.local` file for environment-specific configuration:

```env
NEXT_PUBLIC_PROMPTIO_API_BASE=https://yourorg.prompt.io/api
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For Prompt.io-specific questions:
- Check Prompt.io documentation
- Contact Prompt.io support

For Form Builder issues:
- Check browser console
- Review this README
- Check GitHub issues