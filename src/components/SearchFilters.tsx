/* eslint-disable */
import { useState } from 'react'
import { Search, Plus, User, Building, FileText, UserCog } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

interface SearchFiltersProps {
  activityFilter: string
  setActivityFilter: (filter: string) => void
  onAddNewTenant: () => void
  onAddNewProperty: () => void
  onUploadDocument: () => void
  onAddNewFacilityManager: () => void
}

export function SearchFilters({ 
  activityFilter, 
  setActivityFilter,
  onAddNewTenant,
  onAddNewProperty,
  onUploadDocument,
  onAddNewFacilityManager
}: SearchFiltersProps) {
  const [searchValue, setSearchValue] = useState('')

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        
        {/* Left side - Search (full width on mobile) */}
        <div className="flex-1 max-w-full md:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search activities, tenants, properties..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10 bg-white border-gray-200 focus:border-primary/50 h-10 md:h-11"
            />
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex flex-col space-y-3 md:flex-row md:items-center md:space-y-0">
          
          {/* Add New Dropdown - Full width on mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground w-full md:w-auto justify-center md:justify-start"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Add New</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={onAddNewTenant} className="cursor-pointer">
                <User className="w-4 h-4 mr-3" />
                Add New Tenant
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAddNewProperty} className="cursor-pointer">
                <Building className="w-4 h-4 mr-3" />
                Add New Property
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onUploadDocument} className="cursor-pointer">
                <FileText className="w-4 h-4 mr-3" />
                Upload Document
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAddNewFacilityManager} className="cursor-pointer">
                <UserCog className="w-4 h-4 mr-3" />
                Add Facility Manager
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}