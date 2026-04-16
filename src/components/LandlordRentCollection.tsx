/* eslint-disable */
import { useState } from 'react'
import { DollarSign, Users, TrendingUp, AlertTriangle, CheckCircle, Clock, Filter, Download, Calendar, Building, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Separator } from './ui/separator'

interface LandlordRentCollectionProps {
  searchTerm?: string
}

// Mock rent collection data
const mockRentData = [
  {
    id: 1,
    tenantName: 'Sarah Johnson',
    property: 'Sunset Apartments',
    unit: '4A',
    rentAmount: 750000,
    dueDate: '2024-12-01',
    status: 'paid',
    paymentDate: '2024-11-28',
    remindersSent: 1,
    daysOverdue: 0
  },
  {
    id: 2,
    tenantName: 'Michael Chen',
    property: 'Ocean View Towers',
    unit: '2C',
    rentAmount: 850000,
    dueDate: '2024-12-01',
    status: 'paid',
    paymentDate: '2024-11-30',
    remindersSent: 2,
    daysOverdue: 0
  },
  {
    id: 3,
    tenantName: 'Lisa Thompson',
    property: 'Garden Estate Homes',
    unit: '1C',
    rentAmount: 600000,
    dueDate: '2024-12-01',
    status: 'overdue',
    paymentDate: null,
    remindersSent: 3,
    daysOverdue: 4
  },
  {
    id: 4,
    tenantName: 'David Wilson',
    property: 'City Centre Plaza',
    unit: '3B',
    rentAmount: 580000,
    dueDate: '2024-12-01',
    status: 'pending',
    paymentDate: null,
    remindersSent: 1,
    daysOverdue: 0
  },
  {
    id: 5,
    tenantName: 'Jennifer Adams',
    property: 'Marina Heights',
    unit: '2A',
    rentAmount: 650000,
    dueDate: '2024-12-01',
    status: 'pending',
    paymentDate: null,
    remindersSent: 0,
    daysOverdue: 0
  }
]

const getStatusBadge = (status: string, daysOverdue: number) => {
  switch (status) {
    case 'paid':
      return <Badge className="bg-green-100 text-green-700 border-green-200">Paid</Badge>
    case 'overdue':
      return <Badge className="bg-red-100 text-red-700 border-red-200">{daysOverdue} days overdue</Badge>
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Due soon</Badge>
    default:
      return <Badge variant="secondary">Unknown</Badge>
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'paid': return CheckCircle
    case 'overdue': return AlertTriangle
    case 'pending': return Clock
    default: return Clock
  }
}

export default function LandlordRentCollection({ searchTerm = '' }: LandlordRentCollectionProps) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [propertyFilter, setPropertyFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // Filter data
  const filteredData = mockRentData.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.unit.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    const matchesProperty = propertyFilter === 'all' || item.property === propertyFilter

    return matchesSearch && matchesStatus && matchesProperty
  })

  // Calculate statistics
  const totalRent = mockRentData.reduce((sum, item) => sum + item.rentAmount, 0)
  const paidRent = mockRentData.filter(item => item.status === 'paid').reduce((sum, item) => sum + item.rentAmount, 0)
  const overdueRent = mockRentData.filter(item => item.status === 'overdue').reduce((sum, item) => sum + item.rentAmount, 0)
  const overdueCount = mockRentData.filter(item => item.status === 'overdue').length
  const collectionRate = ((paidRent / totalRent) * 100)

  const properties = [...new Set(mockRentData.map(item => item.property))]

  return (
    <div className="space-y-6">
      {/* Statistics Grid */}


      {/* Filters and Actions */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>
              Rent Collection Tracking
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Collapsible Filter Controls */}
          {showFilters && (
            <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="sm:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Due Soon</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                  <SelectTrigger className="sm:w-48">
                    <SelectValue placeholder="Filter by property" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Properties</SelectItem>
                    {properties.map(property => (
                      <SelectItem key={property} value={property}>{property}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  This Month
                </Button>
              </div>
            </div>
          )}

          {/* Rent Collection Table */}
          <div className="space-y-3">
            {filteredData.map((item) => {
              const StatusIcon = getStatusIcon(item.status)
              
              return (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-slate-100 flex-shrink-0">
                      <StatusIcon className={`w-5 h-5 ${
                        item.status === 'paid' ? 'text-green-600' :
                        item.status === 'overdue' ? 'text-red-600' : 'text-yellow-600'
                      }`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-semibold text-slate-900">{item.tenantName}</h4>
                        {getStatusBadge(item.status, item.daysOverdue)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          {item.property} - Unit {item.unit}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Due: {item.dueDate}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-slate-900 mb-1">
                      ₦{item.rentAmount.toLocaleString()}
                    </p>
                    <div className="text-xs text-slate-500">
                      {item.remindersSent > 0 && (
                        <span>{item.remindersSent} reminder{item.remindersSent > 1 ? 's' : ''} sent</span>
                      )}
                      {item.paymentDate && (
                        <div>Paid: {item.paymentDate}</div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredData.length === 0 && (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No rent records found</h3>
              <p className="text-slate-600">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Automated Features Info */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-orange-100 flex-shrink-0">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                Automated Rent Collection Features
              </h3>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Automatic rent reminders sent via WhatsApp before due dates
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Follow-up messages for overdue payments (escalating reminders)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Real-time payment tracking and confirmation messages
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Monthly collection reports and analytics
                </li>
              </ul>
              <p className="text-xs text-slate-600 mt-3">
                All communications are handled automatically by Property Kraft. No manual messaging required.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}