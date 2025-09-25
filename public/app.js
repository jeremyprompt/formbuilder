// Form Builder Application
class FormBuilder {
    constructor() {
        this.forms = [];
        this.currentForm = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadForms();
    }

    bindEvents() {
        // Form creation and management
        document.getElementById('createFormBtn').addEventListener('click', () => this.showFormBuilder());
        document.getElementById('saveFormBtn').addEventListener('click', () => this.saveForm());
        document.getElementById('cancelFormBtn').addEventListener('click', () => this.hideFormBuilder());
        document.getElementById('addFieldBtn').addEventListener('click', () => this.addField());
    }

    async loadForms() {
        try {
            const response = await fetch('/api/forms');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error('Server returned non-JSON response');
            }

            const data = await response.json();
            
            if (data.success) {
                this.forms = data.data;
                this.renderForms();
            } else {
                this.showError(data.message || 'Failed to load forms');
            }
        } catch (error) {
            console.error('Error loading forms:', error);
            this.showError('Failed to load forms: ' + error.message);
        }
    }

    renderForms() {
        const formsList = document.getElementById('formsList');
        
        if (this.forms.length === 0) {
            formsList.innerHTML = `
                <div class="text-center mt-4">
                    <p>No forms created yet. Click "Create New Form" to get started!</p>
                </div>
            `;
            return;
        }

        formsList.innerHTML = this.forms.map(form => `
            <div class="form-card">
                <h3>${form.title}</h3>
                <p>${form.description}</p>
                <div class="form-meta">
                    ${form.fields.length} field(s) • Created ${new Date(form.createdAt).toLocaleDateString()}
                </div>
                <div class="form-actions">
                    <button class="btn btn-primary btn-small" onclick="formBuilder.editForm(${form.id})">
                        Edit
                    </button>
                    <button class="btn btn-outline btn-small" onclick="formBuilder.previewForm(${form.id})">
                        Preview
                    </button>
                    <button class="btn btn-success btn-small" onclick="formBuilder.generateEmbedCode(${form.id})">
                        Embed
                    </button>
                    <button class="btn btn-secondary btn-small" onclick="formBuilder.deleteForm(${form.id})">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    showFormBuilder() {
        this.currentForm = {
            title: '',
            description: '',
            fields: []
        };
        
        document.getElementById('formTitle').value = '';
        document.getElementById('formDescription').value = '';
        document.getElementById('fieldsList').innerHTML = '';
        
        document.querySelector('.forms-section').classList.add('hidden');
        document.getElementById('formBuilder').classList.remove('hidden');
    }

    hideFormBuilder() {
        document.querySelector('.forms-section').classList.remove('hidden');
        document.getElementById('formBuilder').classList.add('hidden');
        this.currentForm = null;
    }

    addField() {
        if (!this.currentForm) return;

        const fieldTypes = [
            { value: 'text', label: 'Text Input' },
            { value: 'email', label: 'Email' },
            { value: 'textarea', label: 'Textarea' },
            { value: 'select', label: 'Dropdown' },
            { value: 'radio', label: 'Radio Buttons' },
            { value: 'checkbox', label: 'Checkbox' }
        ];

        const fieldId = `field_${Date.now()}`;
        const field = {
            id: fieldId,
            type: 'text',
            label: 'New Field',
            required: false,
            options: []
        };

        this.currentForm.fields.push(field);
        this.renderFields();
    }

    renderFields() {
        const fieldsList = document.getElementById('fieldsList');
        
        fieldsList.innerHTML = this.currentForm.fields.map(field => `
            <div class="field-item">
                <div class="field-info">
                    <h4>${field.label}</h4>
                    <p>Type: ${field.type} ${field.required ? '(Required)' : '(Optional)'}</p>
                </div>
                <div class="field-actions">
                    <button class="btn btn-outline btn-small" onclick="formBuilder.editField('${field.id}')">
                        Edit
                    </button>
                    <button class="btn btn-secondary btn-small" onclick="formBuilder.removeField('${field.id}')">
                        Remove
                    </button>
                </div>
            </div>
        `).join('');
    }

    editField(fieldId) {
        const field = this.currentForm.fields.find(f => f.id === fieldId);
        if (!field) return;

        const newLabel = prompt('Enter field label:', field.label);
        if (newLabel !== null) {
            field.label = newLabel;
            this.renderFields();
        }
    }

    removeField(fieldId) {
        this.currentForm.fields = this.currentForm.fields.filter(f => f.id !== fieldId);
        this.renderFields();
    }

    async saveForm() {
        if (!this.currentForm) return;

        const title = document.getElementById('formTitle').value.trim();
        const description = document.getElementById('formDescription').value.trim();

        if (!title) {
            alert('Please enter a form title');
            return;
        }

        this.currentForm.title = title;
        this.currentForm.description = description;

        try {
            const response = await fetch('/api/forms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.currentForm)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error('Server returned non-JSON response');
            }

            const data = await response.json();
            
            if (data.success) {
                this.forms.push(data.data);
                this.renderForms();
                this.hideFormBuilder();
                this.showSuccess('Form saved successfully!');
            } else {
                this.showError(data.message || 'Failed to save form');
            }
        } catch (error) {
            console.error('Error saving form:', error);
            this.showError('Failed to save form: ' + error.message);
        }
    }

    editForm(formId) {
        const form = this.forms.find(f => f.id === formId);
        if (!form) return;

        this.currentForm = { ...form };
        
        document.getElementById('formTitle').value = form.title;
        document.getElementById('formDescription').value = form.description;
        this.renderFields();
        
        document.querySelector('.forms-section').classList.add('hidden');
        document.getElementById('formBuilder').classList.remove('hidden');
    }

    previewForm(formId) {
        const form = this.forms.find(f => f.id === formId);
        if (!form) return;

        // Create a simple preview modal
        const preview = window.open('', '_blank', 'width=600,height=400');
        preview.document.write(`
            <html>
                <head>
                    <title>Preview: ${form.title}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .form-field { margin-bottom: 15px; }
                        label { display: block; margin-bottom: 5px; font-weight: bold; }
                        input, textarea, select { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
                        .required { color: red; }
                    </style>
                </head>
                <body>
                    <h2>${form.title}</h2>
                    <p>${form.description}</p>
                    <form>
                        ${form.fields.map(field => `
                            <div class="form-field">
                                <label>${field.label} ${field.required ? '<span class="required">*</span>' : ''}</label>
                                ${this.renderFieldInput(field)}
                            </div>
                        `).join('')}
                        <button type="submit" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Submit</button>
                    </form>
                </body>
            </html>
        `);
    }

    renderFieldInput(field) {
        switch (field.type) {
            case 'textarea':
                return `<textarea placeholder="${field.label}"></textarea>`;
            case 'select':
                return `<select><option>Select an option</option></select>`;
            case 'radio':
                return `<input type="radio" name="${field.id}"> Option 1<br><input type="radio" name="${field.id}"> Option 2`;
            case 'checkbox':
                return `<input type="checkbox"> ${field.label}`;
            default:
                return `<input type="${field.type}" placeholder="${field.label}">`;
        }
    }

    deleteForm(formId) {
        if (confirm('Are you sure you want to delete this form?')) {
            this.forms = this.forms.filter(f => f.id !== formId);
            this.renderForms();
            this.showSuccess('Form deleted successfully!');
        }
    }

    generateEmbedCode(formId) {
        const form = this.forms.find(f => f.id === formId);
        if (!form) return;

        // Get the current domain (assuming this will be deployed)
        const baseUrl = window.location.origin;
        const embedUrl = `${baseUrl}/embed.html?formId=${formId}`;
        
        const embedCode = `<iframe 
    src="${embedUrl}" 
    width="100%" 
    height="600" 
    frameborder="0" 
    style="border: none; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
</iframe>`;

        // Create modal to show embed code
        this.showEmbedModal(form, embedCode);
    }

    showEmbedModal(form, embedCode) {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'embed-modal-overlay';
        modal.innerHTML = `
            <div class="embed-modal">
                <div class="embed-modal-header">
                    <h3>Embed Code for "${form.title}"</h3>
                    <button class="embed-modal-close">&times;</button>
                </div>
                <div class="embed-modal-body">
                    <p>Copy the code below to embed this form on your website:</p>
                    <div class="embed-code-container">
                        <textarea readonly class="embed-code-textarea">${embedCode}</textarea>
                        <button class="btn btn-primary copy-btn" onclick="formBuilder.copyEmbedCode()">Copy Code</button>
                    </div>
                    <div class="embed-preview">
                        <h4>Preview:</h4>
                        <div class="embed-preview-frame">
                            ${embedCode}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        modal.querySelector('.embed-modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    copyEmbedCode() {
        const textarea = document.querySelector('.embed-code-textarea');
        textarea.select();
        textarea.setSelectionRange(0, 99999); // For mobile devices
        
        try {
            document.execCommand('copy');
            this.showSuccess('Embed code copied to clipboard!');
        } catch (err) {
            // Fallback for modern browsers
            navigator.clipboard.writeText(textarea.value).then(() => {
                this.showSuccess('Embed code copied to clipboard!');
            }).catch(() => {
                this.showError('Failed to copy embed code');
            });
        }
    }

    showSuccess(message) {
        // Simple success notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }

    showError(message) {
        // Simple error notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }
}

// Initialize the application
const formBuilder = new FormBuilder();
