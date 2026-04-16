/* eslint-disable */
import { useState } from 'react'
import { UserPlus, Calendar, DollarSign, Building2, FileText } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { Separator } from './ui/separator'
import { Badge } from './ui/badge'
import { toast } from 'sonner'
import { KYCApplication, ConvertToTenantData } from '../types/kyc'

// Mock properties data
const mockProperties = [
  {
    id: 1,
    name: "Sunset View Apartments",
    address: "123 Main Street, Lagos",
    status: "Available",
    suggestedRent: 1200000
  },
  {
    id: 2,
    name: "Garden View Complex",
    address: "456 Garden Avenue, Lagos",
    status: "Available", 
    suggestedRent: 800000
  },
  {
    id: 3,
    name: "Urban Residences",
    address: "789 Urban Drive, Lagos",
    status: "Available",
    suggestedRent: 950000
  }
]

interface ConvertToTenantModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicant: KYCApplication
  onConfirm: (data: ConvertToTenantData) => void
}

export function ConvertToTenantModal({
  open,
  onOpenChange,
  applicant,
  onConfirm
}: ConvertToTenantModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    propertyId: applicant.linkedPropertyId?.toString() || '',
    rentAmount: '',
    rentDueDate: '1', // Default to 1st of the month
    leaseStartDate: '',
    leaseEndDate: '',
    securityDeposit: '',
    additionalNotes: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Auto-calculate lease end date when start date changes
    if (field === 'leaseStartDate' && value) {
      const startDate = new Date(value)
      const endDate = new Date(startDate)
      endDate.setFullYear(endDate.getFullYear() + 1)
      setFormData(prev => ({
        ...prev,
        leaseEndDate: endDate.toISOString().split('T')[0]
      }))
    }
  }

  const handlePropertyChange = (propertyId: string) => {
    setFormData(prev => ({ ...prev, propertyId }))
    
    // Auto-fill suggested rent amount
    const selectedProperty = mockProperties.find(p => p.id.toString() === propertyId)
    if (selectedProperty) {
      setFormData(prev => ({
        ...prev,
        rentAmount: selectedProperty.suggestedRent.toString()
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.propertyId) {
      toast.error('Please select a property')
      return
    }
    
    if (!formData.rentAmount || parseInt(formData.rentAmount) <= 0) {
      toast.error('Please enter a valid rent amount')
      return
    }
    
    if (!formData.leaseStartDate) {
      toast.error('Please select a lease start date')
      return
    }
    
    if (!formData.leaseEndDate) {
      toast.error('Please select a lease end date')
      return
    }
    
    const startDate = new Date(formData.leaseStartDate)
    const endDate = new Date(formData.leaseEndDate)
    
    if (endDate <= startDate) {
      toast.error('Lease end date must be after start date')
      return
    }
    
    setIsLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const convertData: ConvertToTenantData = {
        applicantId: applicant.id,
        propertyId: parseInt(formData.propertyId),
        rentAmount: parseInt(formData.rentAmount),
        rentDueDate: formData.rentDueDate,
        leaseStartDate: formData.leaseStartDate,
        leaseEndDate: formData.leaseEndDate,
        securityDeposit: formData.securityDeposit ? parseInt(formData.securityDeposit) : undefined,
        additionalNotes: formData.additionalNotes || undefined
      }
      
      onConfirm(convertData)
      
      // Reset form
      setFormData({
        propertyId: '',
        rentAmount: '',
        rentDueDate: '1',
        leaseStartDate: '',
        leaseEndDate: '',
        securityDeposit: '',
        additionalNotes: ''
      })
      
    } catch (error) {
      toast.error('Failed to convert applicant. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        propertyId: applicant.linkedPropertyId?.toString() || '',
        rentAmount: '',
        rentDueDate: '1',
        leaseStartDate: '',
        leaseEndDate: '',
        securityDeposit: '',
        additionalNotes: ''
      })
      onOpenChange(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`
  }

  const selectedProperty = mockProperties.find(p => p.id.toString() === formData.propertyId)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5 text-[#FF5000]" />
            <span>Convert to Tenant</span>
          </DialogTitle>
          <DialogDescription>
            Convert {applicant.applicantName} from KYC applicant to active tenant
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Applicant Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-900">Applicant Information</h3>
            
            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-slate-900">{applicant.applicantName}</h4>
                <Badge variant="default">Approved</Badge>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Email:</span>
                  <div className="text-slate-900">{applicant.email}</div>
                </div>
                <div>
                  <span className="text-slate-500">Phone:</span>
                  <div className="text-slate-900">{applicant.phone}</div>
                </div>
                <div>
                  <span className="text-slate-500">Occupation:</span>
                  <div className="text-slate-900">{applicant.kycData.personalInfo.occupation}</div>
                </div>
                <div>
                  <span className="text-slate-500">Monthly Income:</span>
                  <div className="text-slate-900">{applicant.kycData.employment.monthlyIncome}</div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Tenancy Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-900">Tenancy Details</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="property">Property *</Label>
                <Select
                  value={formData.propertyId}
                  onValueChange={handlePropertyChange}
                  disabled={isLoading}
                >
                  <SelectTrigger id="property">
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockProperties.map(property => (
                      <SelectItem key={property.id} value={property.id.toString()}>
                        <div>
                          <div className="font-medium">{property.name}</div>
                          <div className="text-sm text-slate-500">{property.address}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProperty && (
                  <div className="text-sm text-slate-600 mt-1">
                    Suggested rent: {formatCurrency(selectedProperty.suggestedRent)}/month
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rent-amount">Monthly Rent Amount *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₦</span>
                  <Input
                    id="rent-amount"
                    type="number"
                    value={formData.rentAmount}
                    onChange={(e) => handleInputChange('rentAmount', e.target.value)}
                    placeholder="0"
                    className="pl-8"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rent-due-date">Rent Due Date</Label>
                <Select
                  value={formData.rentDueDate}
                  onValueChange={(value) => handleInputChange('rentDueDate', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="rent-due-date">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of each month
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lease-start">Lease Start Date *</Label>
                <Input
                  id="lease-start"
                  type="date"
                  value={formData.leaseStartDate}
                  onChange={(e) => handleInputChange('leaseStartDate', e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lease-end">Lease End Date *</Label>
                <Input
                  id="lease-end"
                  type="date"
                  value={formData.leaseEndDate}
                  onChange={(e) => handleInputChange('leaseEndDate', e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="security-deposit">Security Deposit (Optional)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₦</span>
                  <Input
                    id="security-deposit"
                    type="number"
                    value={formData.securityDeposit}
                    onChange={(e) => handleInputChange('securityDeposit', e.target.value)}
                    placeholder="0"
                    className="pl-8"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="additional-notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="additional-notes"
                  value={formData.additionalNotes}
                  onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                  placeholder="Any additional notes about the tenancy agreement..."
                  rows={3}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="order-2 sm:order-1 border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="order-1 sm:order-2 bg-[#FF5000] hover:bg-[#FF5000]/90 text-white flex-1 sm:flex-none"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Converting...</span>
                </div>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Convert to Tenant
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}