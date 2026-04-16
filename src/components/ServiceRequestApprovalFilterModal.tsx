import { useState, useEffect } from 'react'
import { Filter, X } from 'lucide-react'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog'
import { Badge } from './ui/badge'

interface FilterState {
  status: string
  property: string
  priority: string
  date: string
}

interface ServiceRequestApprovalFilterModalProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onClearFilters: () => void
}

export function ServiceRequestApprovalFilterModal({ 
  filters, 
  onFiltersChange, 
  onClearFilters 
}: ServiceRequestApprovalFilterModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState<FilterState>(filters)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleApplyFilters = () => {
    onFiltersChange(localFilters)
    setIsOpen(false)
  }

  const handleClearAll = () => {
    const clearedFilters = {
      status: 'all',
      property: 'all',
      priority: 'all',
      date: 'all'
    }
    setLocalFilters(clearedFilters)
    onFiltersChange(clearedFilters)
    onClearFilters()
    setIsOpen(false)
  }

  const updateFilter = (key: keyof FilterState, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => value !== 'all').length
  }

  const getFilterLabel = (key: keyof FilterState, value: string) => {
    if (value === 'all') return null
    
    switch (key) {
      case 'status':
        return `Status: ${value.charAt(0).toUpperCase() + value.slice(1)}`
      case 'property':
        return `Property: ${value}`
      case 'priority':
        return `Priority: ${value.charAt(0).toUpperCase() + value.slice(1)}`
      case 'date':
        return `Date: ${value === 'today' ? 'Today' : value === 'week' ? 'This Week' : value === 'month' ? 'This Month' : value}`
      default:
        return null
    }
  }

  const activeFilterCount = getActiveFilterCount()
  const hasActiveFilters = activeFilterCount > 0

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="relative border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
        >
          <Filter className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-orange-500 text-white text-xs p-0 flex items-center justify-center"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filter Service Requests</DialogTitle>
          <DialogDescription>Select filters to narrow down your search</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Status
            </label>
            <Select 
              value={localFilters.status} 
              onValueChange={(value) => updateFilter('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Property Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Property
            </label>
            <Select 
              value={localFilters.property} 
              onValueChange={(value) => updateFilter('property', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Properties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                <SelectItem value="Victoria Gardens">Victoria Gardens</SelectItem>
                <SelectItem value="Lekki Heights">Lekki Heights</SelectItem>
                <SelectItem value="Ikeja Premium">Ikeja Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Priority
            </label>
            <Select 
              value={localFilters.priority} 
              onValueChange={(value) => updateFilter('priority', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Date Range
            </label>
            <Select 
              value={localFilters.date} 
              onValueChange={(value) => updateFilter('date', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Active Filters
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters).map(([key, value]) => {
                  const label = getFilterLabel(key as keyof FilterState, value)
                  if (!label) return null
                  
                  return (
                    <Badge 
                      key={key} 
                      variant="secondary" 
                      className="bg-orange-100 text-orange-700 border-orange-200"
                    >
                      {label}
                      <button
                        onClick={() => updateFilter(key as keyof FilterState, 'all')}
                        className="ml-1 hover:bg-orange-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClearAll}
              className="flex-1"
              disabled={!hasActiveFilters}
            >
              Clear All
            </Button>
            <Button
              onClick={handleApplyFilters}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}