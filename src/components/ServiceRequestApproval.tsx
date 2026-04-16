/* eslint-disable */
import { useState, useEffect } from 'react'
import { Search, Filter, Check, X, Calendar, User, Building, Clock, FileText, MessageSquare, ArrowLeft } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Card } from './ui/card'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { toast } from 'sonner'

interface ServiceRequest {
  id: number
  tenantName: string
  tenantId: number
  property: string
  propertyId: number
  issueType: string
  issueSummary: string
  description: string
  submittedBy: string
  submittedById: number
  dateSubmitted: string
  timeSubmitted: string
  status: 'pending' | 'approved' | 'rejected'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  estimatedCost?: string
  facilityManagerNotes?: string
  adminFeedback?: string
  images?: string[]
}

interface ServiceRequestApprovalProps {
  searchTerm: string
}

export function ServiceRequestApproval({ searchTerm }: ServiceRequestApprovalProps) {
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<ServiceRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [propertyFilter, setPropertyFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [adminComment, setAdminComment] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Mock data for service requests
  useEffect(() => {
    const mockRequests: ServiceRequest[] = [
      {
        id: 1,
        tenantName: 'Sarah Johnson',
        tenantId: 1,
        property: 'Victoria Gardens Estate - Block A, Unit 12',
        propertyId: 1,
        issueType: 'Electrical',
        issueSummary: 'Kitchen outlet not working',
        description: 'The electrical outlet in the kitchen near the sink has stopped working completely. Tried multiple appliances and none work when plugged in.',
        submittedBy: 'Mike Williams',
        submittedById: 101,
        dateSubmitted: '2024-01-15',
        timeSubmitted: '09:30 AM',
        status: 'pending',
        priority: 'medium',
        estimatedCost: '₦25,000',
        facilityManagerNotes: 'Inspected the outlet. Appears to be a wiring issue that requires an electrician.',
        images: []
      },
      {
        id: 2,
        tenantName: 'David Chen',
        tenantId: 2,
        property: 'Lekki Heights - Block B, Unit 205',
        propertyId: 2,
        issueType: 'Plumbing',
        issueSummary: 'Bathroom faucet leaking',
        description: 'The bathroom faucet has been leaking for 3 days. Water is dripping constantly and the issue is getting worse.',
        submittedBy: 'Jennifer Adams',
        submittedById: 102,
        dateSubmitted: '2024-01-14',
        timeSubmitted: '02:15 PM',
        status: 'pending',
        priority: 'high',
        estimatedCost: '₦15,000',
        facilityManagerNotes: 'Urgent repair needed. Faucet valve needs replacement.',
        images: []
      },
      {
        id: 3,
        tenantName: 'Maria Rodriguez',
        tenantId: 3,
        property: 'Ikeja Premium Suites - Block C, Unit 301',
        propertyId: 3,
        issueType: 'HVAC',
        issueSummary: 'Air conditioning not cooling',
        description: 'The air conditioning unit in the living room is running but not producing cold air. Room temperature remains high.',
        submittedBy: 'Michael Torres',
        submittedById: 103,
        dateSubmitted: '2024-01-13',
        timeSubmitted: '11:45 AM',
        status: 'approved',
        priority: 'medium',
        estimatedCost: '₦35,000',
        facilityManagerNotes: 'AC unit needs refrigerant refill and filter cleaning.',
        adminFeedback: 'Approved for immediate service.'
      },
      {
        id: 4,
        tenantName: 'James Thompson',
        tenantId: 4,
        property: 'Victoria Gardens Estate - Block B, Unit 08',
        propertyId: 1,
        issueType: 'General Maintenance',
        issueSummary: 'Ceiling fan making noise',
        description: 'The ceiling fan in the bedroom is making a grinding noise when operating. Speed control also seems to be malfunctioning.',
        submittedBy: 'Mike Williams',
        submittedById: 101,
        dateSubmitted: '2024-01-12',
        timeSubmitted: '04:20 PM',
        status: 'rejected',
        priority: 'low',
        facilityManagerNotes: 'Fan needs bearing replacement and speed control repair.',
        adminFeedback: 'Request rejected. Issue not urgent enough for immediate attention.'
      },
      {
        id: 5,
        tenantName: 'Anna Okafor',
        tenantId: 5,
        property: 'Lekki Heights - Block A, Unit 102',
        propertyId: 2,
        issueType: 'Security',
        issueSummary: 'Door lock malfunctioning',
        description: 'The main door lock is very difficult to turn and sometimes gets stuck. Concerned about security.',
        submittedBy: 'Jennifer Adams',
        submittedById: 102,
        dateSubmitted: '2024-01-15',
        timeSubmitted: '08:15 AM',
        status: 'pending',
        priority: 'urgent',
        estimatedCost: '₦20,000',
        facilityManagerNotes: 'Lock mechanism needs immediate replacement for security reasons.',
        images: []
      }
    ]
    setRequests(mockRequests)
  }, [])

  // Filter requests based on search term and filters
  useEffect(() => {
    let filtered = requests

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.issueSummary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.submittedBy.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter)
    }

    // Apply property filter
    if (propertyFilter !== 'all') {
      filtered = filtered.filter(request => request.property.includes(propertyFilter))
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(request => request.priority === priorityFilter)
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const today = new Date()
      const filterDate = new Date()
      
      switch (dateFilter) {
        case 'today':
          filterDate.setDate(today.getDate())
          break
        case 'week':
          filterDate.setDate(today.getDate() - 7)
          break
        case 'month':
          filterDate.setMonth(today.getMonth() - 1)
          break
      }
      
      filtered = filtered.filter(request => {
        const requestDate = new Date(request.dateSubmitted)
        return requestDate >= filterDate
      })
    }

    setFilteredRequests(filtered)
  }, [requests, searchTerm, statusFilter, propertyFilter, priorityFilter, dateFilter])

  const handleRowClick = (request: ServiceRequest) => {
    setSelectedRequest(request)
    setAdminComment(request.adminFeedback || '')
  }

  const handleBackToList = () => {
    setSelectedRequest(null)
    setAdminComment('')
  }

  const handleApproveRequest = async (requestId: number, comment: string) => {
    setIsProcessing(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setRequests(prev => prev.map(request =>
      request.id === requestId
        ? { ...request, status: 'approved' as const, adminFeedback: comment }
        : request
    ))
    
    setIsProcessing(false)
    setAdminComment('')
    toast.success('Service request approved successfully')
  }

  const handleRejectRequest = async (requestId: number, comment: string) => {
    setIsProcessing(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setRequests(prev => prev.map(request =>
      request.id === requestId
        ? { ...request, status: 'rejected' as const, adminFeedback: comment }
        : request
    ))
    
    setIsProcessing(false)
    setAdminComment('')
    toast.success('Service request rejected')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pending</Badge>
      case 'approved':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Urgent</Badge>
      case 'high':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">High</Badge>
      case 'medium':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Medium</Badge>
      case 'low':
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200">Low</Badge>
      default:
        return <Badge variant="secondary">{priority}</Badge>
    }
  }

  const clearFilters = () => {
    setStatusFilter('all')
    setPropertyFilter('all')
    setPriorityFilter('all')
    setDateFilter('all')
  }

  // Show detail view if a request is selected
  if (selectedRequest) {
    return (
      <div className="space-y-6">
        {/* Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={handleBackToList}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to List
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Service Request Details</h1>
            <p className="text-slate-600">Request #{selectedRequest.id}</p>
          </div>
        </div>

        {/* Detail Content */}
        <div className="space-y-6">
          {/* Request Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Tenant Information
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-slate-500">Name:</span>
                  <p className="font-medium">{selectedRequest.tenantName}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Building className="h-4 w-4" />
                Property Information
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-slate-500">Property:</span>
                  <p className="font-medium">{selectedRequest.property}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Issue Details */}
          <Card className="p-4">
            <h3 className="font-semibold text-slate-900 mb-3">Issue Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-sm text-slate-500">Issue Type:</span>
                <p className="font-medium">{selectedRequest.issueType}</p>
              </div>
              <div>
                <span className="text-sm text-slate-500">Priority:</span>
                <div className="mt-1">{getPriorityBadge(selectedRequest.priority)}</div>
              </div>
            </div>
            <div className="mb-4">
              <span className="text-sm text-slate-500">Summary:</span>
              <p className="font-medium">{selectedRequest.issueSummary}</p>
            </div>
            <div>
              <span className="text-sm text-slate-500">Detailed Description:</span>
              <p className="mt-1 text-slate-700">{selectedRequest.description}</p>
            </div>
          </Card>

          {/* Submission Details */}
          <Card className="p-4">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Submission Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-slate-500">Submitted By:</span>
                <p className="font-medium">{selectedRequest.submittedBy}</p>
              </div>
              <div>
                <span className="text-sm text-slate-500">Date Submitted:</span>
                <p className="font-medium">{selectedRequest.dateSubmitted}</p>
              </div>
              <div>
                <span className="text-sm text-slate-500">Time Submitted:</span>
                <p className="font-medium">{selectedRequest.timeSubmitted}</p>
              </div>
            </div>
          </Card>

          {/* Facility Manager Assessment */}
          {selectedRequest.facilityManagerNotes && (
            <Card className="p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Facility Manager Assessment</h3>
              <div className="mb-3">
                <span className="text-sm text-slate-500">Notes:</span>
                <p className="mt-1 text-slate-700">{selectedRequest.facilityManagerNotes}</p>
              </div>
              {selectedRequest.estimatedCost && (
                <div>
                  <span className="text-sm text-slate-500">Estimated Cost:</span>
                  <p className="font-semibold text-emerald-600">{selectedRequest.estimatedCost}</p>
                </div>
              )}
            </Card>
          )}

          {/* Current Status */}
          <Card className="p-4">
            <h3 className="font-semibold text-slate-900 mb-3">Current Status</h3>
            <div className="flex items-center gap-4 mb-3">
              <div>
                <span className="text-sm text-slate-500">Status:</span>
                <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
              </div>
            </div>
            {selectedRequest.adminFeedback && (
              <div>
                <span className="text-sm text-slate-500">Admin Feedback:</span>
                <p className="mt-1 text-slate-700">{selectedRequest.adminFeedback}</p>
              </div>
            )}
          </Card>

          {/* Admin Action */}
          {selectedRequest.status === 'pending' && (
            <Card className="p-4">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Admin Action
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Comment (Optional)
                  </label>
                  <Textarea
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    placeholder="Add a comment about your decision..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="destructive"
                    onClick={() => handleRejectRequest(selectedRequest.id, adminComment)}
                    disabled={isProcessing}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Reject Request
                  </Button>
                  <Button
                    onClick={() => handleApproveRequest(selectedRequest.id, adminComment)}
                    disabled={isProcessing}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Approve Request
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Service Request Approval</h1>
          <p className="text-slate-600 mt-1">Review and approve service requests from facility managers</p>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search by tenant, property, or issue..."
                  className="pl-10"
                  value={searchTerm}
                  readOnly
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Property" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  <SelectItem value="Victoria Gardens">Victoria Gardens</SelectItem>
                  <SelectItem value="Lekki Heights">Lekki Heights</SelectItem>
                  <SelectItem value="Ikeja Premium">Ikeja Premium</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>

              {(statusFilter !== 'all' || propertyFilter !== 'all' || priorityFilter !== 'all' || dateFilter !== 'all') && (
                <Button variant="outline" onClick={clearFilters} className="text-slate-600">
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-slate-600">
          Showing {filteredRequests.length} of {requests.length} requests
        </p>
      </div>

      {/* Simplified Requests Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200">
              <tr className="text-left">
                <th className="p-4 font-semibold text-slate-900">Submitted By</th>
                <th className="p-4 font-semibold text-slate-900">Issue Summary</th>
                <th className="p-4 font-semibold text-slate-900">Tenant</th>
                <th className="p-4 font-semibold text-slate-900">Property</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    No service requests found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr 
                    key={request.id} 
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(request)}
                  >
                    <td className="p-4">
                      <div className="font-medium text-slate-900">{request.submittedBy}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-900">{request.issueSummary}</div>
                      <div className="text-slate-600 text-sm">{request.issueType}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-700">{request.tenantName}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-700 max-w-xs truncate">{request.property}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}