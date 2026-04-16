/* eslint-disable */
import { useState } from 'react'
import { Download, Trash2, FileText, Image, FileX, AlertTriangle } from 'lucide-react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'

// Extended mock document data that matches the Documents component
const mockDocuments = [
  {
    id: 1,
    documentName: "Lease_Agreement_Johnson.pdf",
    tenantName: "Sarah Johnson",
    tenantId: 1,
    documentType: "Tenancy Agreement",
    dateUploaded: "Dec 1, 2024",
    uploadedBy: "Admin",
    downloadUrl: "#",
    fileType: "pdf",
    fileSize: "2.4 MB",
    previewUrl: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&h=600&fit=crop" // Mock preview
  },
  {
    id: 2,
    documentName: "ID_Card_Michael_Chen.pdf",
    tenantName: "Michael Chen", 
    tenantId: 2,
    documentType: "ID Card",
    dateUploaded: "Nov 28, 2024",
    uploadedBy: "Admin",
    downloadUrl: "#",
    fileType: "pdf",
    fileSize: "1.8 MB",
    previewUrl: "https://images.unsplash.com/photo-1591237657185-9d2e3d0d2a6d?w=800&h=600&fit=crop"
  },
  {
    id: 3,
    documentName: "Proof_of_Income_Rodriguez.pdf",
    tenantName: "Emily Rodriguez",
    tenantId: 3,
    documentType: "Proof of Income",
    dateUploaded: "Nov 25, 2024",
    uploadedBy: "Admin",
    downloadUrl: "#",
    fileType: "pdf",
    fileSize: "3.1 MB",
    previewUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=600&fit=crop"
  },
  {
    id: 4,
    documentName: "Passport_Copy_James_Wilson.jpg",
    tenantName: "James Wilson",
    tenantId: 4,
    documentType: "ID Card",
    dateUploaded: "Nov 22, 2024",
    uploadedBy: "Admin",
    downloadUrl: "#",
    fileType: "image",
    fileSize: "4.2 MB",
    previewUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop"
  },
  {
    id: 5,
    documentName: "Bank_Statement_Chen.pdf",
    tenantName: "Michael Chen",
    tenantId: 2,
    documentType: "Proof of Payment",
    dateUploaded: "Nov 20, 2024",
    uploadedBy: "Admin",
    downloadUrl: "#",
    fileType: "pdf",
    fileSize: "2.7 MB",
    previewUrl: "https://images.unsplash.com/photo-1554224154-26032fded8bd?w=800&h=600&fit=crop"
  },
  {
    id: 6,
    documentName: "Utility_Bill_Johnson.pdf",
    tenantName: "Sarah Johnson",
    tenantId: 1,
    documentType: "Utility Bill",
    dateUploaded: "Nov 18, 2024",
    uploadedBy: "Admin",
    downloadUrl: "#",
    fileType: "pdf",
    fileSize: "1.5 MB",
    previewUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop"
  },
  {
    id: 7,
    documentName: "Reference_Letter_Rodriguez.docx",
    tenantName: "Emily Rodriguez",
    tenantId: 3,
    documentType: "Reference Letter",
    dateUploaded: "Nov 15, 2024",
    uploadedBy: "Admin",
    downloadUrl: "#",
    fileType: "docx",
    fileSize: "456 KB",
    previewUrl: null // Unsupported file type
  },
  {
    id: 8,
    documentName: "Employment_Letter_Wilson.pdf",
    tenantName: "James Wilson",
    tenantId: 4,
    documentType: "Proof of Income",
    dateUploaded: "Nov 12, 2024",
    uploadedBy: "Admin",
    downloadUrl: "#",
    fileType: "pdf",
    fileSize: "2.2 MB",
    previewUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop"
  }
]

interface DocumentDetailProps {
  documentId: number | null
  isOpen: boolean
  onClose: () => void
  onTenantClick: (tenantId: string) => void
}

export function DocumentDetail({ documentId, isOpen, onClose, onTenantClick }: DocumentDetailProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const document = mockDocuments.find(doc => doc.id === documentId)

  if (!document) {
    return null
  }

  const handleDownload = () => {
    // In a real app, this would trigger the download
    window.open(document.downloadUrl, '_blank')
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    // Simulate API call
    setTimeout(() => {
      setIsDeleting(false)
      onClose()
    }, 1000)
  }

  const handleTenantClick = () => {
    onTenantClick(document.tenantId.toString())
    onClose()
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="w-5 h-5 text-green-500" />
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />
      default:
        return <FileX className="w-5 h-5 text-slate-500" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] p-0 flex flex-col">
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b border-slate-200 bg-white">
          <DialogTitle className="text-xl text-slate-900">Document Details</DialogTitle>
          <DialogDescription className="text-slate-600">
            View and manage document details, including preview and metadata information.
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-2xl mx-auto p-8 space-y-8">
              {/* Document Information */}
              <div>
                <div className="space-y-6">
                  {/* Document Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">
                      Document Name
                    </label>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-start space-x-3">
                        {getFileIcon(document.fileType)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 break-words">
                            {document.documentName}
                          </p>
                          <p className="text-sm text-slate-500 mt-1">
                            {document.fileSize}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tenant */}
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">
                      Tenant
                    </label>
                    <button
                      onClick={handleTenantClick}
                      className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium transition-colors"
                    >
                      {document.tenantName}
                    </button>
                  </div>

                  {/* Upload Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">
                        Date Uploaded
                      </label>
                      <p className="text-slate-900">{document.dateUploaded}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">
                        Uploaded By
                      </label>
                      <p className="text-slate-900">{document.uploadedBy}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-slate-200 pt-8">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Download Button */}
                  <Button
                    onClick={handleDownload}
                    className="flex-1 justify-center gradient-primary text-white border-0 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Document
                  </Button>

                  {/* Delete Button */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex-1 justify-center border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Document
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                          </div>
                          <div>
                            <AlertDialogTitle>Delete Document</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this document? This action cannot be undone.
                            </AlertDialogDescription>
                          </div>
                        </div>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-slate-200 text-slate-600 hover:bg-slate-50">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          disabled={isDeleting}
                          className="gradient-danger text-white border-0 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          {isDeleting ? 'Deleting...' : 'Delete Document'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}