/* eslint-disable */
import { useState, useEffect } from 'react'
import { ArrowLeft, User, Building, Calendar, Clock, AlertTriangle, FileText, MessageSquare, DollarSign, CheckCircle, XCircle } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'

interface ServiceRequest {
  id: number
  tenantName: string
  tenantEmail: string
  tenantPhone: string
  property: string
  propertyAddress: string
  issueType: string
  issueSummary: string
  description: string
  dateSubmitted: string
  timeSubmitted: string
  status: 'Pending' | 'Approved' | 'Resolved' | 'Rejected'
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'
  estimatedCost?: string
  facilityManagerNotes?: string
  adminRemarks?: string
  dateProcessed?: string
  timeProcessed?: string
  resolvedDate?: string
}

interface RequestDetailProps {
  requestId: number | null
  onBack: () => void
  onPropertyNameChange?: (propertyName: string | null) => void
}

export function RequestDetail({ requestId, onBack, onPropertyNameChange }: RequestDetailProps) {
  const [request, setRequest] = useState<ServiceRequest | null>(null)

  // Mock data for the specific request
  useEffect(() => {
    if (!requestId) {
      // Clear property name if no request ID
      if (onPropertyNameChange) {
        onPropertyNameChange(null)
      }
      return
    }

    // Simulate API call to get request details
    const mockRequests: Record<number, ServiceRequest> = {
      1: {
        id: 1,
        tenantName: 'Sarah Johnson',
        tenantEmail: 'sarah.johnson@email.com',
        tenantPhone: '(555) 0123',
        property: 'Victoria Gardens Estate - Block A, Unit 12',
        propertyAddress: '123 Victoria Gardens, Lagos',
        issueType: 'Electrical',
        issueSummary: 'Kitchen outlet not working',
        description: 'The electrical outlet in the kitchen near the sink has stopped working completely. Tried multiple appliances and none work when plugged in. This is affecting our daily cooking routine and we need this resolved urgently.',
        dateSubmitted: '2024-01-15',
        timeSubmitted: '09:30 AM',
        status: 'Approved',
        priority: 'Medium',
        estimatedCost: '₦25,000',
        facilityManagerNotes: 'Inspected the outlet during my visit. Appears to be a wiring issue that requires a professional electrician. The circuit breaker seems fine, so the issue is likely with the internal wiring of the outlet.',
        adminRemarks: 'Approved for immediate repair. Electrician will be scheduled within 24 hours. This is a safety concern and needs to be addressed promptly.',
        dateProcessed: '2024-01-15',
        timeProcessed: '02:45 PM'
      },
      2: {
        id: 2,
        tenantName: 'David Chen',
        tenantEmail: 'david.chen@email.com',
        tenantPhone: '(555) 0124',
        property: 'Lekki Heights - Block B, Unit 205',
        propertyAddress: '456 Lekki Heights, Lagos',
        issueType: 'Plumbing',
        issueSummary: 'Bathroom faucet leaking',
        description: 'The bathroom faucet has been leaking for 3 days. Water is dripping constantly and the issue is getting worse. The dripping sound is also disturbing our sleep.',
        dateSubmitted: '2024-01-14',
        timeSubmitted: '02:15 PM',
        status: 'Resolved',
        priority: 'High',
        estimatedCost: '₦15,000',
        facilityManagerNotes: 'Urgent repair needed. Faucet valve needs replacement to stop the constant dripping.',
        adminRemarks: 'Issue has been resolved. New faucet valve installed successfully. Plumber confirmed no other issues with the plumbing system.',
        dateProcessed: '2024-01-14',
        timeProcessed: '04:30 PM',
        resolvedDate: '2024-01-15'
      },
      3: {
        id: 3,
        tenantName: 'Maria Rodriguez',
        tenantEmail: 'maria.rodriguez@email.com',
        tenantPhone: '(555) 0125',
        property: 'Ikeja Premium Suites - Block C, Unit 301',
        propertyAddress: '789 Ikeja Premium, Lagos',
        issueType: 'HVAC',
        issueSummary: 'Air conditioning not cooling',
        description: 'The air conditioning unit in the living room is running but not producing cold air. Room temperature remains high even after running for hours.',
        dateSubmitted: '2024-01-13',
        timeSubmitted: '11:45 AM',
        status: 'Pending',
        priority: 'Medium',
        estimatedCost: '₦35,000',
        facilityManagerNotes: 'AC unit needs refrigerant refill and filter cleaning. May also need duct inspection.'
      },
      4: {
        id: 4,
        tenantName: 'James Thompson',
        tenantEmail: 'james.thompson@email.com',
        tenantPhone: '(555) 0126',
        property: 'Victoria Gardens Estate - Block B, Unit 08',
        propertyAddress: '321 Victoria Gardens, Lagos',
        issueType: 'General Maintenance',
        issueSummary: 'Ceiling fan making noise',
        description: 'The ceiling fan in the bedroom is making a grinding noise when operating. Speed control also seems to be malfunctioning.',
        dateSubmitted: '2024-01-12',
        timeSubmitted: '04:20 PM',
        status: 'Rejected',
        priority: 'Low',
        estimatedCost: '₦8,000',
        facilityManagerNotes: 'Fan needs bearing replacement and speed control repair.',
        adminRemarks: 'Request rejected. Issue not urgent enough for immediate attention. Will be scheduled for routine maintenance during the next maintenance cycle.',
        dateProcessed: '2024-01-13',
        timeProcessed: '10:15 AM'
      },
      5: {
        id: 5,
        tenantName: 'Anna Okafor',
        tenantEmail: 'anna.okafor@email.com',
        tenantPhone: '(555) 0127',
        property: 'Lekki Heights - Block A, Unit 102',
        propertyAddress: '654 Lekki Heights, Lagos',
        issueType: 'Security',
        issueSummary: 'Door lock malfunctioning',
        description: 'The main door lock is very difficult to turn and sometimes gets stuck. Concerned about security and being locked out.',
        dateSubmitted: '2024-01-11',
        timeSubmitted: '08:15 AM',
        status: 'Approved',
        priority: 'Urgent',
        estimatedCost: '₦20,000',
        facilityManagerNotes: 'Lock mechanism needs immediate replacement for security reasons. This is a safety concern.',
        adminRemarks: 'Urgent security issue approved. Locksmith will be dispatched immediately to replace the lock mechanism.',
        dateProcessed: '2024-01-11',
        timeProcessed: '09:30 AM'
      }
    }

    const requestData = mockRequests[requestId] || null
    setRequest(requestData)
    
    // Notify parent component of the property name change
    if (onPropertyNameChange) {
      const propertyName = requestData ? requestData.property : null
      console.log('Setting property name:', propertyName) // Debug log
      onPropertyNameChange(propertyName)
    }
  }, [requestId])

  if (!request) {
    return (
      <div className="min-h-full bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="page-container">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Request Not Found</h1>
            <p className="text-slate-600">The requested service request could not be found.</p>
          </div>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pending Review</Badge>
      case 'Approved':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Approved</Badge>
      case 'Resolved':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Resolved</Badge>
      case 'Rejected':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Urgent</Badge>
      case 'High':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">High</Badge>
      case 'Medium':
        return null
      case 'Low':
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200">Low</Badge>
      default:
        return <Badge variant="secondary">{priority}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock className="h-5 w-5 text-amber-500" />
      case 'Approved':
        return <CheckCircle className="h-5 w-5 text-blue-500" />
      case 'Resolved':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />
      case 'Rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-slate-500" />
    }
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Status */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Request Status</h2>
                <div className="flex items-center gap-3">
                  {getStatusIcon(request.status)}
                  {getStatusBadge(request.status)}
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-500">Tenant</label>
                  <p className="text-slate-900">{request.tenantName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Date Submitted</label>
                  <p className="text-slate-700">{request.dateSubmitted} at {request.timeSubmitted}</p>
                </div>
              </div>
            </Card>

            {/* Issue Information */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-[#FF5000]" />
                <h2 className="text-lg font-semibold text-slate-900">Issue Details</h2>
                {getPriorityBadge(request.priority)}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-500">Issue Type</label>
                  <p className="text-slate-900">{request.issueType}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-500">Summary</label>
                  <p className="text-slate-900">{request.issueSummary}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-500">Description</label>
                  <p className="text-slate-700 leading-relaxed">{request.description}</p>
                </div>

                {request.estimatedCost && (
                  <div>
                    <label className="text-sm font-medium text-slate-500">Estimated Cost</label>
                    <p className="text-slate-900 font-medium">{request.estimatedCost}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Facility Manager Notes */}
            {request.facilityManagerNotes && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="h-5 w-5 text-[#FF5000]" />
                  <h2 className="text-lg font-semibold text-slate-900">Facility Manager Notes</h2>
                </div>
                <p className="text-slate-700 leading-relaxed">{request.facilityManagerNotes}</p>
              </Card>
            )}

            {/* Admin Response */}
            {request.adminRemarks && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-[#FF5000]" />
                  <h2 className="text-lg font-semibold text-slate-900">Admin Response</h2>
                </div>
                <div className="space-y-3">
                  <p className="text-slate-700 leading-relaxed">{request.adminRemarks}</p>
                  {request.dateProcessed && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="h-4 w-4" />
                      <span>Processed on {request.dateProcessed} at {request.timeProcessed}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Resolution Information */}
            {request.status === 'Resolved' && request.resolvedDate && (
              <Card className="p-6 border-emerald-200 bg-emerald-50">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <h2 className="text-lg font-semibold text-emerald-900">Resolution Details</h2>
                </div>
                <div className="flex items-center gap-2 text-sm text-emerald-700">
                  <Calendar className="h-4 w-4" />
                  <span>Issue resolved on {request.resolvedDate}</span>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tenant Information */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-[#FF5000]" />
                <h2 className="text-lg font-semibold text-slate-900">Tenant Information</h2>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-500">Name</label>
                  <p className="text-slate-900">{request.tenantName}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-500">Email</label>
                  <p className="text-slate-700">{request.tenantEmail}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-500">Phone</label>
                  <p className="text-slate-700">{request.tenantPhone}</p>
                </div>
              </div>
            </Card>

            {/* Property Information */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building className="h-5 w-5 text-[#FF5000]" />
                <h2 className="text-lg font-semibold text-slate-900">Property Information</h2>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-500">Property</label>
                  <p className="text-slate-900">{request.property}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-500">Address</label>
                  <p className="text-slate-700">{request.propertyAddress}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}