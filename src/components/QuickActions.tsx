import { Plus, User, Building, FileText, UserCog } from 'lucide-react'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

interface QuickActionsProps {
  onAddNewTenant: () => void
  onAddNewProperty: () => void
  onUploadDocument: () => void
  onAddNewFacilityManager: () => void
}

export function QuickActions({ 
  onAddNewTenant,
  onAddNewProperty,
  onUploadDocument,
  onAddNewFacilityManager
}: QuickActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white h-14 w-14 p-0 rounded-full shadow-lg hover:shadow-xl active:shadow-md transition-all duration-200 border-0 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 mb-2 z-[70]">
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
  )
}