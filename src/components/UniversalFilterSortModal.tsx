/* eslint-disable */
import { useState } from 'react'
import { X, Calendar, Building2, Users, FileCheck, Wrench, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Checkbox } from './ui/checkbox'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

interface FilterConfig {
  type: 'search' | 'select' | 'checkbox' | 'date'
  label: string
  key: string
  options?: { value: string; label: string }[]
  placeholder?: string
}

interface SortConfig {
  key: string
  label: string
}

interface UniversalFilterSortModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  filters: FilterConfig[]
  sortOptions: SortConfig[]
  currentFilters: Record<string, any>
  currentSort: { key: string; direction: 'asc' | 'desc' } | null
  onApplyFilters: (filters: Record<string, any>) => void
  onApplySort: (sort: { key: string; direction: 'asc' | 'desc' } | null) => void
  onClearFilters: () => void
}

export function UniversalFilterSortModal({
  isOpen,
  onClose,
  title,
  description,
  filters,
  sortOptions,
  currentFilters,
  currentSort,
  onApplyFilters,
  onApplySort,
  onClearFilters
}: UniversalFilterSortModalProps) {
  const [tempFilters, setTempFilters] = useState<Record<string, any>>(currentFilters)
  const [tempSort, setTempSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(currentSort)

  const handleFilterChange = (key: string, value: any) => {
    setTempFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSortChange = (key: string, direction: 'asc' | 'desc') => {
    setTempSort({ key, direction })
  }

  const handleClearSort = () => {
    setTempSort(null)
  }

  const handleApply = () => {
    onApplyFilters(tempFilters)
    onApplySort(tempSort)
    onClose()
  }

  const handleClear = () => {
    const clearedFilters = Object.keys(tempFilters).reduce((acc, key) => {
      acc[key] = ''
      return acc
    }, {} as Record<string, any>)
    setTempFilters(clearedFilters)
    setTempSort(null)
    onClearFilters()
    onClose()
  }

  const getActiveFilterCount = () => {
    return Object.values(tempFilters).filter(value => value && value !== '').length
  }

  const renderFilter = (filter: FilterConfig) => {
    switch (filter.type) {
      case 'search':
        return (
          <Input
            placeholder={filter.placeholder || `Search ${filter.label.toLowerCase()}...`}
            value={tempFilters[filter.key] || ''}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            className="border-slate-200"
          />
        )

      case 'select':
        return (
          <Select
            value={tempFilters[filter.key] || undefined}
            onValueChange={(value) => handleFilterChange(filter.key, value === 'all' ? '' : value)}
          >
            <SelectTrigger className="border-slate-200">
              <SelectValue placeholder={`Select ${filter.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {filter.label}</SelectItem>
              {filter.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'checkbox':
        return (
          <div className="space-y-3">
            {filter.options?.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${filter.key}-${option.value}`}
                  checked={tempFilters[filter.key]?.includes(option.value) || false}
                  onCheckedChange={(checked) => {
                    const currentValues = tempFilters[filter.key] || []
                    if (checked) {
                      handleFilterChange(filter.key, [...currentValues, option.value])
                    } else {
                      handleFilterChange(filter.key, currentValues.filter((v: string) => v !== option.value))
                    }
                  }}
                />
                <label 
                  htmlFor={`${filter.key}-${option.value}`}
                  className="text-sm font-medium text-slate-700 cursor-pointer"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        )

      case 'date':
        return (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">From</label>
              <Input
                type="date"
                value={tempFilters[`${filter.key}_from`] || ''}
                onChange={(e) => handleFilterChange(`${filter.key}_from`, e.target.value)}
                className="border-slate-200"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">To</label>
              <Input
                type="date"
                value={tempFilters[`${filter.key}_to`] || ''}
                onChange={(e) => handleFilterChange(`${filter.key}_to`, e.target.value)}
                className="border-slate-200"
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Filter className="w-5 h-5 text-indigo-600" />
            {title}
            {(getActiveFilterCount() > 0 || tempSort) && (
              <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
                {getActiveFilterCount() + (tempSort ? 1 : 0)} active
              </Badge>
            )}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-slate-600">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <Tabs defaultValue="filters" className="py-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="filters" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
              {getActiveFilterCount() > 0 && (
                <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-xs">
                  {getActiveFilterCount()}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sort" className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4" />
              Sort
              {tempSort && (
                <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-xs">
                  1
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="filters" className="space-y-6 mt-6">
            {filters.map((filter) => (
              <div key={filter.key} className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  {filter.key === 'property' && <Building2 className="w-4 h-4" />}
                  {filter.key === 'tenant' && <Users className="w-4 h-4" />}
                  {filter.key === 'status' && <FileCheck className="w-4 h-4" />}
                  {filter.key === 'priority' && <Wrench className="w-4 h-4" />}
                  {filter.key === 'date' && <Calendar className="w-4 h-4" />}
                  {filter.label}
                </label>
                {renderFilter(filter)}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="sort" className="space-y-4 mt-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">Sort by</label>
              <div className="space-y-2">
                {sortOptions.map((option) => (
                  <div key={option.key} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <span className="text-sm font-medium text-slate-700">{option.label}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={tempSort?.key === option.key && tempSort?.direction === 'asc' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSortChange(option.key, 'asc')}
                        className={`h-8 w-8 p-0 ${
                          tempSort?.key === option.key && tempSort?.direction === 'asc' 
                            ? 'gradient-primary text-white' 
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={tempSort?.key === option.key && tempSort?.direction === 'desc' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSortChange(option.key, 'desc')}
                        className={`h-8 w-8 p-0 ${
                          tempSort?.key === option.key && tempSort?.direction === 'desc' 
                            ? 'gradient-primary text-white' 
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {tempSort && (
                <div className="pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-indigo-700">
                        Sorting by: {sortOptions.find(opt => opt.key === tempSort.key)?.label}
                      </span>
                      {tempSort.direction === 'asc' ? (
                        <ArrowUp className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-indigo-600" />
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearSort}
                      className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-6 border-t border-slate-200">
          <Button
            variant="outline"
            onClick={handleClear}
            className="border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Clear All
          </Button>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              className="gradient-primary text-white"
            >
              Apply Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}