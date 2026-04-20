/* eslint-disable */
import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Users, MapPin, Calendar, DollarSign, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from './ui/button'

// Mock tenant data with enhanced information
const mockTenants = [
  {
    id: 1,
    name: 'Sarah Chen',
    email: 'sarah.chen@email.com',
    phone: '+234 901 234 5678',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b9ba05a9?w=100',
    property: 'Block B, Apt 2B',
    rent: 800000,
    outstandingBalance: 0,
    rentExpiryDate: new Date('2025-08-01'),
    status: 'active',
    paymentStatus: 'paid',
    joinDate: new Date('2024-08-01')
  },
  {
    id: 2,
    name: 'Michael Rodriguez',
    email: 'michael.rodriguez@email.com',
    phone: '+234 806 123 4567',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    property: 'Block A, Apt 7A',
    rent: 1200000,
    outstandingBalance: 1200000,
    rentExpiryDate: new Date('2025-12-15'),
    status: 'active',
    paymentStatus: 'overdue',
    joinDate: new Date('2024-06-15')
  },
  {
    id: 3,
    name: 'Emily Johnson',
    email: 'emily.johnson@email.com',
    phone: '+234 701 987 6543',
    avatar: null,
    property: 'Block C, Apt 12C',
    rent: 950000,
    outstandingBalance: 950000,
    rentExpiryDate: new Date('2024-06-30'),
    status: 'expired',
    paymentStatus: 'paid',
    joinDate: new Date('2023-06-30')
  },
  {
    id: 4,
    name: 'David Kim',
    email: 'david.kim@email.com',
    phone: '+234 802 345 6789',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    property: 'Garden Heights - Unit 5B',
    rent: 750000,
    outstandingBalance: 0,
    rentExpiryDate: new Date('2025-09-20'),
    status: 'active',
    paymentStatus: 'paid',
    joinDate: new Date('2024-09-20')
  },
  {
    id: 5,
    name: 'Lisa Thompson',
    email: 'lisa.thompson@email.com',
    phone: '+234 809 876 5432',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    property: 'Sunset Towers - Unit 8A',
    rent: 850000,
    outstandingBalance: 425000,
    rentExpiryDate: new Date('2025-11-10'),
    status: 'active',
    paymentStatus: 'pending',
    joinDate: new Date('2024-11-10')
  },
  {
    id: 6,
    name: 'James Wilson',
    email: 'james.wilson@email.com',
    phone: '+234 805 123 4567',
    avatar: null,
    property: 'Ocean View Apartments - Unit 3C',
    rent: 1100000,
    outstandingBalance: 0,
    rentExpiryDate: new Date('2025-07-25'),
    status: 'active',
    paymentStatus: 'paid',
    joinDate: new Date('2024-07-25')
  },
  {
    id: 7,
    name: 'Maria Garcia',
    email: 'maria.garcia@email.com',
    phone: '+234 807 234 5678',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
    property: 'City Center Complex - Unit 6A',
    rent: 980000,
    outstandingBalance: 0,
    rentExpiryDate: new Date('2025-10-05'),
    status: 'active',
    paymentStatus: 'paid',
    joinDate: new Date('2024-10-05')
  }
]

interface TenantsTableProps {
  searchQuery: string
  statusFilter: string
  paymentFilter: string
  sortBy: string
  onTenantClick: (tenantId: string) => void
}

type SortField = 'name' | 'property' | 'rent' | 'rentExpiryDate' | 'joinDate'
type SortDirection = 'asc' | 'desc'

export function TenantsTable({ 
  searchQuery, 
  statusFilter, 
  paymentFilter, 
  sortBy, 
  onTenantClick 
}: TenantsTableProps) {
  const [sortField, setSortField] = useState<SortField>((sortBy as SortField) || 'name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Filter tenants based on search and filters
  const filteredTenants = mockTenants.filter(tenant => {
    const matchesSearch = searchQuery === '' || 
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.property.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter
    const matchesPayment = paymentFilter === 'all' || tenant.paymentStatus === paymentFilter
    
    return matchesSearch && matchesStatus && matchesPayment
  })

  // Sort tenants
  const sortedTenants = [...filteredTenants].sort((a, b) => {
    let aValue: any = a[sortField]
    let bValue: any = b[sortField]

    // Handle different data types
    if (sortField === 'name' || sortField === 'property') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    } else if (sortField === 'rentExpiryDate' || sortField === 'joinDate') {
      aValue = aValue.getTime()
      bValue = bValue.getTime()
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
      case 'expired':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Expired</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Paid</Badge>
      case 'overdue':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Overdue</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Pending</Badge>
      default:
        return <Badge variant="outline">{paymentStatus}</Badge>
    }
  }

  const SortButton = ({ field, children, icon }: { 
    field: SortField
    children: React.ReactNode
    icon?: React.ReactNode
  }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(field)}
      className="h-auto p-0 justify-start hover:bg-transparent font-medium text-gray-900 hover:text-primary transition-colors group"
    >
      <div className="flex items-center space-x-2">
        {icon && <span className="text-gray-500 group-hover:text-primary transition-colors">{icon}</span>}
        <span>{children}</span>
        <div className="flex flex-col ml-1">
          <ChevronUp 
            className={`w-3 h-3 transition-colors ${
              sortField === field && sortDirection === 'asc' 
                ? 'text-primary' 
                : 'text-gray-300'
            }`} 
          />
          <ChevronDown 
            className={`w-3 h-3 -mt-1 transition-colors ${
              sortField === field && sortDirection === 'desc' 
                ? 'text-primary' 
                : 'text-gray-300'
            }`} 
          />
        </div>
      </div>
    </Button>
  )

  if (sortedTenants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No tenants found</h3>
        <p className="text-gray-500 max-w-md">
          {searchQuery || statusFilter !== 'all' || paymentFilter !== 'all'
            ? 'No tenants match your current filters. Try adjusting your search criteria.'
            : 'No tenants onboarded yet. Once a tenant is added, they\'ll appear here.'}
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-gray-200 bg-gray-50/50 hover:bg-gray-50/50">
            <TableHead className="py-4 px-6">
              <SortButton field="name" icon={<Users className="w-4 h-4" />}>
                Tenant
              </SortButton>
            </TableHead>
            <TableHead className="py-4 px-6">
              <SortButton field="property" icon={<MapPin className="w-4 h-4" />}>
                Property
              </SortButton>
            </TableHead>
            <TableHead className="py-4 px-6">
              <SortButton field="rent" icon={<DollarSign className="w-4 h-4" />}>
                Rent Amount
              </SortButton>
            </TableHead>
            <TableHead className="py-4 px-6">
              Outstanding Balance
            </TableHead>
            <TableHead className="py-4 px-6">
              Status
            </TableHead>
            <TableHead className="py-4 px-6">
              Payment
            </TableHead>
            <TableHead className="py-4 px-6">
              <SortButton field="rentExpiryDate" icon={<Calendar className="w-4 h-4" />}>
                Rent Expiry
              </SortButton>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTenants.map((tenant) => (
            <TableRow 
              key={tenant.id} 
              className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors cursor-pointer group"
              onClick={() => onTenantClick(tenant.id.toString())}
            >
              <TableCell className="py-4 px-6">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={tenant.avatar ?? undefined} alt={tenant.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {tenant.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors truncate">
                      {tenant.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{tenant.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-4 px-6">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                  <span className="text-sm text-gray-900 truncate">{tenant.property}</span>
                </div>
              </TableCell>
              <TableCell className="py-4 px-6">
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(tenant.rent)}
                </span>
              </TableCell>
              <TableCell className="py-4 px-6">
                {tenant.outstandingBalance > 0 ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); onTenantClick(tenant.id.toString()); }}
                    className="text-sm font-semibold text-red-600 hover:text-red-700 hover:underline transition-colors"
                  >
                    {formatCurrency(tenant.outstandingBalance)}
                  </button>
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </TableCell>
              <TableCell className="py-4 px-6">
                {getStatusBadge(tenant.status)}
              </TableCell>
              <TableCell className="py-4 px-6">
                {getPaymentBadge(tenant.paymentStatus)}
              </TableCell>
              <TableCell className="py-4 px-6">
                <div className="text-sm text-gray-600">
                  <span className="block">{formatDate(tenant.rentExpiryDate)}</span>
                  <span className="text-xs text-gray-500">
                    {tenant.rentExpiryDate > new Date() ? 'Active' : 'Expired'}
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}