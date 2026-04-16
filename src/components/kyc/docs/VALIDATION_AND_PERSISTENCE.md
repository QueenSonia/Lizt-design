# Form Validation and Persistence

This document explains how to use the form validation and persistence functionality in the KYC form system.

## Form Validation

### FormValidator Class

The `FormValidator` class provides step-by-step validation for all form fields with specific error messages.

#### Basic Usage

```typescript
import { FormValidator, FormData } from "@/components/kyc";

// Validate a specific step
const validation = FormValidator.validateStep(1, formData);
if (validation.isValid) {
  // Proceed to next step
} else {
  // Display errors
  console.log(validation.errors);
}

// Validate individual steps
const personalDetailsValidation =
  FormValidator.validatePersonalDetails(formData);
const documentsValidation = FormValidator.validateDocuments(formData);

// Validate file uploads
const fileValidation = FormValidator.validateFile(file, "passport");
if (!fileValidation.isValid) {
  console.error(fileValidation.error);
}
```

#### Validation Rules

The validator includes rules for:

- **Required fields**: All mandatory fields per step
- **Format validation**: Email, phone, names, etc.
- **Length constraints**: Minimum and maximum character limits
- **Age validation**: Minimum 18 years, maximum 100 years
- **File validation**: Size limits (5MB) and allowed types
- **OTP validation**: 6-digit numeric code

#### Error Messages

All error messages are defined in `constants/validation.ts` and include:

- Field-specific requirements
- Format examples
- Clear instructions for correction

## Form Persistence

### FormPersistence Class

The `FormPersistence` class handles automatic saving and loading of form data using localStorage.

#### Basic Usage

```typescript
import { FormPersistence } from "@/components/kyc";

// Save form data
const success = FormPersistence.saveFormData(token, formData);

// Load form data
const savedData = FormPersistence.loadFormData(token);

// Save current step
FormPersistence.saveCurrentStep(token, 2);

// Load current step
const currentStep = FormPersistence.loadCurrentStep(token);

// Clear all data
FormPersistence.clearFormData(token);
```

#### Features

- **Automatic expiry**: Data expires after 24 hours
- **File URL storage**: Saves Cloudinary URLs for uploaded files
- **Step tracking**: Remembers current form step
- **Error handling**: Graceful fallback when localStorage unavailable
- **Cleanup**: Automatic removal of expired data

### useFormPersistence Hook

React hook that provides a convenient interface for form persistence.

```typescript
import { useFormPersistence } from "@/components/kyc";

function MyForm({ token }: { token: string }) {
  const {
    saveFormData,
    loadFormData,
    saveCurrentStep,
    loadCurrentStep,
    clearFormData,
    saveFileUrl,
    removeFileUrl,
    isStorageAvailable,
  } = useFormPersistence({ token });

  // Use the methods as needed
  const handleSave = () => {
    saveFormData(formData);
  };
}
```

### useAutoSave Hook

Automatically saves form data with debouncing to prevent excessive localStorage writes.

```typescript
import { useAutoSave } from "@/components/kyc";

function MyForm({ token }: { token: string }) {
  const [formData, setFormData] = useState<Partial<FormData>>({});

  // Auto-save with 1 second delay
  useAutoSave(token, formData, 1000);

  // Form data is automatically saved when it changes
}
```

## Storage Indicator Component

The `FormStorageIndicator` component shows users the current storage status.

```typescript
import { FormStorageIndicator } from "@/components/kyc";

function MyForm({ token }: { token: string }) {
  return (
    <div>
      <FormStorageIndicator token={token} className="mb-4" />
      {/* Rest of form */}
    </div>
  );
}
```

## Complete Example

See `examples/FormWithPersistence.tsx` for a complete working example that demonstrates:

- Form validation with real-time error display
- Automatic form data persistence
- Step navigation with validation
- Storage status indicators
- Error handling and recovery

## Best Practices

### Validation

1. **Real-time validation**: Validate fields as users type to provide immediate feedback
2. **Step validation**: Always validate the current step before allowing navigation
3. **Clear error messages**: Use specific, actionable error messages
4. **File validation**: Validate files both client-side and server-side

### Persistence

1. **Auto-save**: Use debounced auto-save to prevent data loss
2. **Step tracking**: Save current step to restore user position
3. **File URLs**: Store Cloudinary URLs separately from File objects
4. **Cleanup**: Clear saved data after successful submission
5. **Fallback**: Handle cases where localStorage is unavailable

### Performance

1. **Debouncing**: Use appropriate delays for auto-save (1000ms recommended)
2. **Selective saving**: Only save changed data when possible
3. **Cleanup**: Regularly clean up expired data
4. **Error handling**: Fail gracefully when storage operations fail

## Security Considerations

1. **Token-based storage**: All data is scoped to specific KYC tokens
2. **No sensitive data**: Don't store sensitive information in localStorage
3. **Expiry**: Data automatically expires after 24 hours
4. **File handling**: Store only URLs, not actual file content
5. **Validation**: Always validate data loaded from storage

## Browser Compatibility

- **localStorage**: Supported in all modern browsers
- **Fallback**: Graceful degradation when storage unavailable
- **Error handling**: Comprehensive error catching and logging
- **Testing**: Use `FormPersistence.isStorageAvailable()` to check support
