/* eslint-disable */
import { useState } from 'react'
import { Filter, Download, ArrowUpDown, MoreHorizontal, Clock, AlertCircle, CheckCircle, Wrench, Search } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { UniversalFilterModal } from './UniversalFilterModal'
import { useFetchServiceRequest } from '@/services/service-request/query'

// Mock service request data
const mockServiceRequests = [
  {
    id: 1,
    title: "Leaking faucet in kitchen",
    description: "Kitchen faucet has been dripping constantly for the past week",
    tenant: "Sarah Johnson",
    property: "Sunset Apartments Unit 4A",
    category: "Plumbing",
    priority: "Medium",
    status: "In Progress",
    dateSubmitted: "Dec 1, 2024",
    assignedTo: "John Adebayo",
    estimatedCompletion: "Dec 8, 2024"
  },
  {
    id: 2,
    title: "Air conditioning not working",
    description: "AC unit stopped working yesterday, room getting very hot",
    tenant: "Michael Chen",
    property: "Ocean View Towers Unit 12B",
    category: "HVAC",
    priority: "High",
    status: "Open",
    dateSubmitted: "Dec 3, 2024",
    assignedTo: "Mary Okafor",
    estimatedCompletion: "Dec 5, 2024"
  },
  {
    id: 3,
    title: "Broken window lock",
    description: "Security lock on bedroom window is broken and won't close properly",
    tenant: "Emily Rodriguez",
    property: "Downtown Lofts Unit 8C",
    category: "Security",
    priority: "High",
    status: "Completed",
    dateSubmitted: "Nov 28, 2024",
    assignedTo: "Peter Eze",
    estimatedCompletion: "Dec 2, 2024"
  },
  {
    id: 4,
    title: "Light fixture installation",
    description: "Need new light fixture installed in dining room",
    tenant: "David Wilson",
    property: "Garden Heights Unit 3A",
    category: "Electrical",
    priority: "Low",
    status: "Scheduled",
    dateSubmitted: "Dec 2, 2024",
    assignedTo: "Sarah Ibrahim",
    estimatedCompletion: "Dec 10, 2024"
  },
  {
    id: 5,
    title: "Garbage disposal jammed",
    description: "Kitchen garbage disposal is making loud noises and not working",
    tenant: "Lisa Thompson",
    property: "Riverside Condos Unit 6B",
    category: "Appliances",
    priority: "Medium",
    status: "Open",
    dateSubmitted: "Dec 4, 2024",
    assignedTo: "David Oladele",
    estimatedCompletion: "Dec 7, 2024"
  }
]


interface ServiceRequestsProps {
  searchTerm?: string
  userRole?: string
  userPermissions?: {
    canSubmitServiceRequests: boolean
  }
}


export function ServiceRequests({searchTerm = '', 
  userRole = 'Admin', 
  userPermissions = { canSubmitServiceRequests: true }  }: ServiceRequestsProps) {
  const [sortField, setSortField] = useState<string>('dateSubmitted')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({})
  const [localSearchTerm, setLocalSearchTerm] = useState('')

  const [selectedRequest, setSelectedRequest] = useState<any>(null)

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }



  const handleExport = () => {
    console.log('Exporting service requests data...')
  }

  const handleApplyFilters = (filters: Record<string, any>) => {
    setCurrentFilters(filters)
    console.log('Applied filters:', filters)
  }

  const handleClearFilters = () => {
    setCurrentFilters({})
    console.log('Cleared all filters')
  }

  const filterConfig = {
    title: 'Filter Service Requests',
    description: 'Filter service requests by status, priority, and date',
    filters: [
      { type: 'search' as const, label: 'Request Title', key: 'title', placeholder: 'Search by request title...' },
      { type: 'select' as const, label: 'Status', key: 'status', options: [
        { value: 'open', label: 'Open' },
        { value: 'in-progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
        { value: 'scheduled', label: 'Scheduled' }
      ]},
      { type: 'select' as const, label: 'Priority', key: 'priority', options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'critical', label: 'Critical' }
      ]},
      { type: 'date' as const, label: 'Request Date', key: 'request_date' }
    ]
  }



  const handleRequestClick = (request: any) => {
    setSelectedRequest(request)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Scheduled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Low':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Open':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'In Progress':
        return <Clock className="w-4 h-4 text-blue-600" />
      case 'Scheduled':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      default:
        return <Wrench className="w-4 h-4 text-slate-600" />
    }
  }

  const {data: serviceRequests} = useFetchServiceRequest()

  const filteredAndSortedRequests = serviceRequests
    ?.filter((request:any) => {
      const globalSearchMatch = searchTerm === '' || 
        request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.tenant.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.property.toLowerCase().includes(searchTerm.toLowerCase()) 
        // ||
        // request.category.toLowerCase().includes(searchTerm.toLowerCase())
      
      const localSearchMatch = localSearchTerm === '' ||
        request.title.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
        request.tenant.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
        request.property.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
        // request.category.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
        request.status.toLowerCase().includes(localSearchTerm.toLowerCase()) 
        //  || request.assignedTo.toLowerCase().includes(localSearchTerm.toLowerCase())
      
      return globalSearchMatch && localSearchMatch
    })
    .sort((a:any, b:any) => {
      let aValue: any = ''
      let bValue: any = ''
      
      switch (sortField) {
        case 'title':
          aValue = a.title
          bValue = b.title
          break
        case 'tenant':
          aValue = a.tenant
          bValue = b.tenant
          break
        case 'priority':
          const priorityOrder = { 'Low': 1, 'Medium': 2, 'High': 3, 'Critical': 4 }
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder]
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder]
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'dateSubmitted':
          aValue = new Date(a.dateSubmitted).getTime()
          bValue = new Date(b.dateSubmitted).getTime()
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
        case 'category':
          aValue = a.category
          bValue = b.category
          break
        default:
          aValue = a.title
          bValue = b.title
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue)
        return sortDirection === 'asc' ? comparison : -comparison
      }
      
      return 0
    })

  return (
    <div className="p-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">All Service Requests</h2>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFilterModalOpen(true)}
                className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-700 transition-colors"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search service requests by title, tenant, property, category, or status..."
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              className="pl-10 bg-white border-slate-200 focus:border-indigo-300 focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200 bg-slate-50/30">
                <TableHead className="h-12 px-6">
                  <button
                    onClick={() => handleSort('title')}
                    className="flex items-center font-semibold text-slate-700 hover:text-slate-900 transition-colors duration-200 cursor-pointer"
                  >
                    Request
                  </button>
                </TableHead>
                <TableHead className="h-12 px-6">
                  <button
                    onClick={() => handleSort('tenant')}
                    className="flex items-center font-semibold text-slate-700 hover:text-slate-900 transition-colors duration-200 cursor-pointer"
                  >
                    Tenant
                  </button>
                </TableHead>


                <TableHead className="h-12 px-6">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center font-semibold text-slate-700 hover:text-slate-900 transition-colors duration-200 cursor-pointer"
                  >
                    Status
                  </button>
                </TableHead>
                <TableHead className="h-12 px-6">
                  <button
                    onClick={() => handleSort('dateSubmitted')}
                    className="flex items-center font-semibold text-slate-700 hover:text-slate-900 transition-colors duration-200 cursor-pointer"
                  >
                    Date Submitted
                  </button>
                </TableHead>

              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedRequests?.map((request:any, index:number) => (
                <TableRow 
                  key={request.id} 
                  className={`
                    border-b border-slate-100 hover:bg-slate-50/80 cursor-pointer transition-all duration-200 group
                    ${index % 2 === 0 ? 'bg-white' : 'bg-slate-25/30'}
                  `}
                  onClick={() => handleRequestClick(request)}
                >
                  <TableCell className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {request.title}
                      </div>
                      <div className="text-sm text-slate-500">
                        {request.property}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="font-medium text-slate-700">
                      {request.tenant}
                    </div>
                  </TableCell>


                  <TableCell className="px-6 py-4">
                    <Badge className={`${getStatusColor(request.status)} border text-xs`}>
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="font-medium text-slate-700">{request.dateSubmitted}</div>
                    </div>
                  </TableCell>

                </TableRow>
              ))}
              {filteredAndSortedRequests?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="px-6 py-12 text-center">
                    <div className="text-slate-500">
                      {(searchTerm || localSearchTerm) ? 'No service requests found matching your search.' : 'No service requests found.'}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Filter Modal */}
      <UniversalFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        {...filterConfig}
        currentFilters={currentFilters}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
      />

      {/* Service Request Details Modal */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="sr-only">
              <DialogTitle>
                {selectedRequest.title}
              </DialogTitle>
              <DialogDescription>
                View detailed information about this service request including description, assignment details, and current status.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600">{selectedRequest.description}</p>
              </div>

              {/* Request Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Request Details</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-500">Tenant:</span>
                      <div className="text-sm font-medium text-gray-900">{selectedRequest.tenant}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Property:</span>
                      <div className="text-sm text-gray-900">{selectedRequest.property}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Date Submitted:</span>
                      <div className="text-sm text-gray-900">{selectedRequest.dateSubmitted}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Assignment Details</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-500">Assigned To:</span>
                      <div className="text-sm font-medium text-gray-900">{selectedRequest.assignedTo}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Estimated Completion:</span>
                      <div className="text-sm text-gray-900">{selectedRequest.estimatedCompletion}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}