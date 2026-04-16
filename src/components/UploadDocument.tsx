/* eslint-disable */
import { useState } from 'react'
import { Upload, FileText, Check, X } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Card } from './ui/card'

// Mock data for tenants
const mockTenants = [
  {
    id: 1,
    name: "Adetola Omoyele",
    property: "Flat 2B, Maple Court"
  },
  {
    id: 2,
    name: "Sarah Chen",
    property: "Unit 5A, Marina Heights"
  },
  {
    id: 3,
    name: "Michael Johnson",
    property: "Apartment 3C, Garden View Complex"
  },
  {
    id: 4,
    name: "Fatima Hassan",
    property: "Studio 1B, Urban Residences"
  }
]

interface UploadDocumentProps {
  onBack: () => void
}

export function UploadDocument({ onBack }: UploadDocumentProps) {
  const [documentTitle, setDocumentTitle] = useState('')
  const [documentType, setDocumentType] = useState('')
  const [selectedTenant, setSelectedTenant] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadedDocument, setUploadedDocument] = useState<any>(null)

  const documentTypes = [
    'Tenancy Agreement',
    'Rent Notice',
    'General Notice',
    'Other'
  ]

  const acceptedFileTypes = '.pdf,.doc,.docx,.jpg,.jpeg,.png'
  const maxFileSize = 10 * 1024 * 1024 // 10MB in bytes

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > maxFileSize) {
        alert('File size exceeds 10MB limit. Please choose a smaller file.')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    // Reset the file input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!documentTitle || !documentType || !selectedTenant || !selectedFile) {
      alert('Please fill in all required fields and select a file.')
      return
    }

    setIsUploading(true)

    // Simulate upload process
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const selectedTenantData = mockTenants.find(t => t.id.toString() === selectedTenant)
      
      const documentData = {
        title: documentTitle,
        type: documentType,
        tenant: selectedTenantData,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        uploadDate: new Date().toLocaleString()
      }
      
      setUploadedDocument(documentData)
      setUploadSuccess(true)
      
      // Reset form
      setDocumentTitle('')
      setDocumentType('')
      setSelectedTenant('')
      setSelectedFile(null)
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement
      if (fileInput) {
        fileInput.value = ''
      }
      
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    if (documentTitle || documentType || selectedTenant || selectedFile) {
      if (confirm('Are you sure you want to cancel? All entered data will be lost.')) {
        onBack()
      }
    } else {
      onBack()
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleStartNewUpload = () => {
    setUploadSuccess(false)
    setUploadedDocument(null)
  }

  if (uploadSuccess && uploadedDocument) {
    return (
      <div className="p-8 pl-12">
        {/* Success Message */}
        <Card className="max-w-2xl shadow-lg border-0 bg-white/80 backdrop-blur-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          
          <h2 className="text-slate-900 mb-2">Document Uploaded Successfully!</h2>
          <p className="text-slate-600 mb-6">Your document has been uploaded and assigned to the selected tenant.</p>
          
          <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
            <h3 className="text-slate-900 mb-3">Document Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Title:</span>
                <span className="text-slate-900">{uploadedDocument.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Type:</span>
                <span className="text-slate-900">{uploadedDocument.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Tenant:</span>
                <span className="text-slate-900">{uploadedDocument.tenant.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Property:</span>
                <span className="text-slate-900">{uploadedDocument.tenant.property}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">File:</span>
                <span className="text-slate-900">{uploadedDocument.fileName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Uploaded:</span>
                <span className="text-slate-900">{uploadedDocument.uploadDate}</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center space-x-4">
            <Button onClick={handleStartNewUpload} className="gradient-primary text-white shadow-md hover:shadow-lg transition-all duration-200">
              <Upload className="w-4 h-4 mr-2" />
              Upload Another Document
            </Button>
            <Button variant="outline" onClick={onBack} className="border-slate-200 text-slate-600 hover:bg-slate-50">
              Back to Documents
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 pl-12">
      {/* Main Content */}
      <Card className="max-w-2xl shadow-lg border-0 bg-white/80 backdrop-blur-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Document Title */}
          <div className="space-y-2">
            <Label htmlFor="document-title" className="text-slate-700 font-medium">
              Document Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="document-title"
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="e.g., July 2025 Rent Notice"
              required
              className="h-12 border-slate-200 focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Document Type */}
          <div className="space-y-2">
            <Label htmlFor="document-type" className="text-slate-700 font-medium">
              Document Type <span className="text-red-500">*</span>
            </Label>
            <Select value={documentType} onValueChange={setDocumentType} required>
              <SelectTrigger className="h-12 border-slate-200 focus:border-indigo-500 transition-colors">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Select Tenant */}
          <div className="space-y-2">
            <Label htmlFor="select-tenant" className="text-slate-700 font-medium">
              Select Tenant <span className="text-red-500">*</span>
            </Label>
            <Select value={selectedTenant} onValueChange={setSelectedTenant} required>
              <SelectTrigger className="h-12 border-slate-200 focus:border-indigo-500 transition-colors">
                <SelectValue placeholder="Choose tenant to assign document" />
              </SelectTrigger>
              <SelectContent>
                {mockTenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id.toString()}>
                    {tenant.name} – {tenant.property}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Upload File */}
          <div className="space-y-2">
            <Label htmlFor="file-upload" className="text-slate-700 font-medium">
              Upload File <span className="text-red-500">*</span>
            </Label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
              {selectedFile ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center space-x-2">
                    <FileText className="w-8 h-8 text-indigo-600" />
                    <div className="text-left">
                      <p className="text-slate-900">{selectedFile.name}</p>
                      <p className="text-sm text-slate-600">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remove File
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                  <div>
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer text-indigo-600 hover:text-indigo-700"
                    >
                      Click to upload
                    </label>
                    <p className="text-slate-600"> or drag and drop</p>
                  </div>
                  <p className="text-xs text-slate-500">
                    PDF, DOC, JPG, PNG up to 10MB
                  </p>
                </div>
              )}
              <input
                id="file-upload"
                type="file"
                accept={acceptedFileTypes}
                onChange={handleFileSelect}
                className="hidden"
                required
              />
            </div>
            <p className="text-sm text-slate-600">
              Max file size: 10MB. PDF preferred.
            </p>
          </div>

          {/* Submit Section */}
          <div className="flex justify-end pt-6 border-t border-slate-200">
            <Button
              type="submit"
              disabled={isUploading || !documentTitle || !documentType || !selectedTenant || !selectedFile}
              className="gradient-primary text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}