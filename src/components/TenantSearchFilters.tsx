import { Search, Plus } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

interface TenantSearchFiltersProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  propertyFilter: string
  setPropertyFilter: (filter: string) => void
  onAddNewTenant?: () => void
}

export function TenantSearchFilters({
  searchQuery,
  setSearchQuery,
  propertyFilter,
  setPropertyFilter,
  onAddNewTenant
}: TenantSearchFiltersProps) {
  return (
    <div className="p-6 space-y-4">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-gray-900">Tenants</h1>
        <Button 
          onClick={onAddNewTenant}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Tenant
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search by name or property"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
          />
        </div>

        {/* Property Filter */}
        <div className="flex gap-3">
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger className="w-48 bg-white border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <SelectValue placeholder="Filter by Property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              <SelectItem value="sunset-towers">Sunset Towers</SelectItem>
              <SelectItem value="ocean-view">Ocean View Apartments</SelectItem>
              <SelectItem value="city-center">City Center Complex</SelectItem>
              <SelectItem value="garden-heights">Garden Heights</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}