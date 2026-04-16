/* eslint-disable */
import { useState } from 'react'
import { Filter, X } from 'lucide-react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Label } from './ui/label'

interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
  filters: { [key: string]: string }
  onFiltersChange: (filters: { [key: string]: string }) => void
  filterOptions: { [key: string]: string[] }
  title: string
}

export function FilterModal({ 
  isOpen, 
  onClose, 
  filters,
  onFiltersChange,
  filterOptions,
  title
}: FilterModalProps) {
  const [localFilters, setLocalFilters] = useState(filters || {})

  const handleSubmit = () => {
    onFiltersChange(localFilters)
    onClose()
  }

  const handleReset = () => {
    const resetFilters = Object.keys(filterOptions || {}).reduce((acc, key) => {
      acc[key] = ''
      return acc
    }, {} as { [key: string]: string })
    
    setLocalFilters(resetFilters)
    onFiltersChange(resetFilters)
    onClose()
  }

  const handleClose = () => {
    setLocalFilters(filters || {}) // Reset to original values
    onClose()
  }

  const handleFilterChange = (key: string, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // Safety check to ensure filterOptions exists
  if (!filterOptions) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription>
            Apply filters to refine your search results and find exactly what you're looking for.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {Object.keys(filterOptions).map((filterKey) => (
            <div key={filterKey} className="space-y-2">
              <Label className="capitalize">
                {filterKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </Label>
              <Select 
                value={localFilters[filterKey] || ''} 
                onValueChange={(value) => handleFilterChange(filterKey, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${filterKey}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All {filterKey}</SelectItem>
                  {filterOptions[filterKey]?.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <DialogFooter className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="w-full sm:w-auto text-gray-600"
          >
            Reset
          </Button>
          <div className="flex space-x-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handleClose} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="flex-1 sm:flex-none">
              Apply Filters
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Legacy FilterModal for components that still use the old interface
interface LegacyFilterModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (filters: any) => void
  onReset: () => void
  initialFilters: any
  filterType: string
}

export function LegacyFilterModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onReset, 
  initialFilters, 
  filterType 
}: LegacyFilterModalProps) {
  const [filters, setFilters] = useState(initialFilters || {})

  const handleSubmit = () => {
    // Convert "all" values back to empty strings for filtering logic
    const processedFilters = Object.keys(filters || {}).reduce((acc, key) => {
      acc[key] = filters[key] === 'all' ? '' : filters[key]
      return acc
    }, {} as any)
    onSubmit(processedFilters)
  }

  const handleReset = () => {
    setFilters(getEmptyFilters(filterType))
    onReset()
  }

  const handleClose = () => {
    setFilters(initialFilters || {}) // Reset to initial values
    onClose()
  }

  const getEmptyFilters = (type: string) => {
    switch (type) {
      case 'activity':
        return { type: 'all', priority: 'all', dateRange: 'all' }
      case 'tenants':
        return { status: 'all', kycStatus: 'all', propertyType: 'all' }
      case 'properties':
        return { status: 'all', type: 'all', bedrooms: 'all' }
      case 'service':
        return { status: 'all', priority: 'all', category: 'all', dateRange: 'all' }
      case 'kyc':
        return { status: 'all', dateRange: 'all', applicationType: 'all' }
      case 'facility':
        return { status: 'all', propertyAssignment: 'all', experience: 'all' }
      case 'documents':
        return { type: 'all', tenant: 'all', property: 'all', dateRange: 'all' }
      default:
        return {}
    }
  }

  const getFilterTitle = (type: string) => {
    switch (type) {
      case 'activity': return 'Filter Activities'
      case 'tenants': return 'Filter Tenants'
      case 'properties': return 'Filter Properties'
      case 'service': return 'Filter Service Requests'
      case 'kyc': return 'Filter KYC Applications'
      case 'facility': return 'Filter Facility Managers'
      case 'documents': return 'Filter Documents'
      default: return 'Filter Items'
    }
  }

  // Convert empty strings to "all" for display
  const displayFilters = Object.keys(filters || {}).reduce((acc, key) => {
    acc[key] = filters[key] === '' ? 'all' : filters[key]
    return acc
  }, {} as any)

  const renderFilters = () => {
    switch (filterType) {
      case 'activity':
        return (
          <>
            <div className="space-y-2">
              <Label>Activity Type</Label>
              <Select value={displayFilters.type || 'all'} onValueChange={(value) => setFilters({...filters, type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select activity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="tenant_added">Tenant Added</SelectItem>
                  <SelectItem value="service_request">Service Request</SelectItem>
                  <SelectItem value="kyc_approved">KYC Approved</SelectItem>
                  <SelectItem value="rent_due">Rent Due</SelectItem>
                  <SelectItem value="document_uploaded">Document Uploaded</SelectItem>
                  <SelectItem value="facility_assigned">Facility Assigned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={displayFilters.priority || 'all'} onValueChange={(value) => setFilters({...filters, priority: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select value={displayFilters.dateRange || 'all'} onValueChange={(value) => setFilters({...filters, dateRange: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )
      default:
        return <div>No filters available</div>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>{getFilterTitle(filterType)}</span>
          </DialogTitle>
          <DialogDescription>
            Apply filters to refine your search results and find exactly what you're looking for.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {renderFilters()}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleReset}
            className="text-gray-600"
          >
            Reset
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Apply Filters
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook for components that need the old useFilterModal interface
export function useFilterModal(filterType: string) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState(() => {
    switch (filterType) {
      case 'activity':
        return { type: '', priority: '', dateRange: '' }
      case 'tenants':
        return { status: '', kycStatus: '', propertyType: '' }
      case 'properties':
        return { status: '', type: '', bedrooms: '' }
      case 'service':
        return { status: '', priority: '', category: '', dateRange: '' }
      case 'kyc':
        return { status: '', dateRange: '', applicationType: '' }
      case 'facility':
        return { status: '', propertyAssignment: '', experience: '' }
      case 'documents':
        return { type: '', tenant: '', property: '', dateRange: '' }
      default:
        return {}
    }
  })

  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)

  const handleSubmit = (newFilters: any) => {
    setFilters(newFilters)
    setIsOpen(false)
  }

  const handleReset = () => {
    switch (filterType) {
      case 'activity':
        setFilters({ type: '', priority: '', dateRange: '' })
        break
      case 'tenants':
        setFilters({ status: '', kycStatus: '', propertyType: '' })
        break
      case 'properties':
        setFilters({ status: '', type: '', bedrooms: '' })
        break
      case 'service':
        setFilters({ status: '', priority: '', category: '', dateRange: '' })
        break
      case 'kyc':
        setFilters({ status: '', dateRange: '', applicationType: '' })
        break
      case 'facility':
        setFilters({ status: '', propertyAssignment: '', experience: '' })
        break
      case 'documents':
        setFilters({ type: '', tenant: '', property: '', dateRange: '' })
        break
      default:
        setFilters({})
    }
    setIsOpen(false)
  }

  const activeFiltersCount = Object.values(filters || {}).filter(value => value && value !== '').length

  return {
    isOpen,
    filters,
    activeFiltersCount,
    openModal,
    closeModal,
    handleSubmit,
    handleReset,
    FilterModal: (
      <LegacyFilterModal
        isOpen={isOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onReset={handleReset}
        initialFilters={filters}
        filterType={filterType}
      />
    )
  }
}