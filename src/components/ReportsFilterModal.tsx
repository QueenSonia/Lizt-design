/* eslint-disable */
import { useState } from 'react'
import { Calendar, MapPin, Building2, Users, X } from 'lucide-react'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Separator } from './ui/separator'

interface FilterOptions {
  dateRange: string
  propertyFilter: string
  landlordFilter: string
  locationFilter: string
}

interface ReportsFilterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  onExport: () => void
  isExporting: boolean
}

export function ReportsFilterModal({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  onExport,
  isExporting
}: ReportsFilterModalProps) {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters)

  const handleApply = () => {
    onFiltersChange(localFilters)
    onOpenChange(false)
  }

  const handleReset = () => {
    const resetFilters: FilterOptions = {
      dateRange: 'this-month',
      propertyFilter: 'all',
      landlordFilter: 'all',
      locationFilter: 'all'
    }
    setLocalFilters(resetFilters)
    onFiltersChange(resetFilters)
  }

  const updateFilter = (key: keyof FilterOptions, value: string) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-slate-900">Filters & Export</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-slate-500">
            Filter your data by time period, property type, landlord type, or location, and export reports.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Range Filter */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Time Period</span>
            </div>
            <Select value={localFilters.dateRange} onValueChange={(value) => updateFilter('dateRange', value)}>
              <SelectTrigger className="w-full bg-white border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="this-month">Monthly</SelectItem>
                <SelectItem value="ytd">Year to Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Property Filter */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Property Type</span>
            </div>
            <Select value={localFilters.propertyFilter} onValueChange={(value) => updateFilter('propertyFilter', value)}>
              <SelectTrigger className="w-full bg-white border-slate-200">
                <SelectValue placeholder="All Properties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                <SelectItem value="residential">Residential</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Landlord Filter */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Landlord Type</span>
            </div>
            <Select value={localFilters.landlordFilter} onValueChange={(value) => updateFilter('landlordFilter', value)}>
              <SelectTrigger className="w-full bg-white border-slate-200">
                <SelectValue placeholder="All Landlords" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Landlords</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location Filter */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Location</span>
            </div>
            <Select value={localFilters.locationFilter} onValueChange={(value) => updateFilter('locationFilter', value)}>
              <SelectTrigger className="w-full bg-white border-slate-200">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="lagos">Lagos</SelectItem>
                <SelectItem value="abuja">Abuja</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Export Section */}
          <div className="space-y-3">
            <span className="text-sm font-medium text-slate-700">Export Data</span>
            <Button
              onClick={onExport}
              disabled={isExporting}
              variant="outline"
              className="w-full bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              {isExporting ? 'Exporting...' : 'Download Report'}
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-200">
          <Button 
            variant="ghost" 
            onClick={handleReset}
            className="text-slate-600 hover:text-slate-900"
          >
            Reset All
          </Button>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleApply}
              className="gradient-primary text-white"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}