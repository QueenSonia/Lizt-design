/* eslint-disable */
import { useState } from 'react'
import { ArrowLeft, MoreHorizontal, Mail, Phone, Clock } from 'lucide-react'
import { Button } from './ui/button'
import { Switch } from './ui/switch'
import { Checkbox } from './ui/checkbox'
import { Label } from './ui/label'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { toast } from 'sonner'

interface TeamMember {
  id: number
  name: string
  email: string
  phone: string
  role: string
  status: 'Active' | 'Inactive'
  accessLevel: 'Full Access' | 'Limited Access'
  joinDate: string
  avatar: string
  permissions: {
    canSubmitServiceRequests: boolean
    canViewTenants: boolean
    canEditProperties: boolean
    canManageTeam: boolean
    canViewReports: boolean
  }
}

interface TeamMemberDetailProps {
  memberId: number | null
  onBack: () => void
}

// Mock team data - in a real app this would come from props or an API
const mockTeamData: TeamMember[] = [
  {
    id: 1,
    name: "John Kennedy",
    email: "john@propertykraft.com",
    phone: "+234 901 234 5678",
    role: "Admin",
    status: "Active",
    accessLevel: "Full Access",
    joinDate: "2024-01-15",
    avatar: "JK",
    permissions: {
      canSubmitServiceRequests: true,
      canViewTenants: true,
      canEditProperties: true,
      canManageTeam: true,
      canViewReports: true
    }
  },
  {
    id: 2,
    name: "Sarah Manager",
    email: "sarah@propertykraft.com",
    phone: "+234 902 345 6789",
    role: "Facility Manager",
    status: "Active",
    accessLevel: "Limited Access",
    joinDate: "2024-02-01",
    avatar: "SM",
    permissions: {
      canSubmitServiceRequests: true,
      canViewTenants: true,
      canEditProperties: false,
      canManageTeam: false,
      canViewReports: true
    }
  },
  {
    id: 3,
    name: "Mike Johnson",
    email: "mike@propertykraft.com",
    phone: "+234 903 456 7890",
    role: "Facility Manager",
    status: "Inactive",
    accessLevel: "Limited Access",
    joinDate: "2024-11-25",
    avatar: "MJ",
    permissions: {
      canSubmitServiceRequests: false,
      canViewTenants: true,
      canEditProperties: false,
      canManageTeam: false,
      canViewReports: false
    }
  },
  {
    id: 4,
    name: "Lisa Chen",
    email: "lisa@propertykraft.com",
    phone: "+234 904 567 8901",
    role: "Facility Manager",
    status: "Inactive",
    accessLevel: "Limited Access",
    joinDate: "2024-03-10",
    avatar: "LC",
    permissions: {
      canSubmitServiceRequests: false,
      canViewTenants: false,
      canEditProperties: false,
      canManageTeam: false,
      canViewReports: false
    }
  }
]

// Mock activity data
const mockActivityData = [
  {
    id: 1,
    action: "Submitted service request for Property A",
    timestamp: "2 hours ago",
    type: "service_request"
  },
  {
    id: 2,
    action: "Edited tenancy info for John Doe",
    timestamp: "5 hours ago",
    type: "tenant_edit"
  },
  {
    id: 3,
    action: "Updated property details for Sunset Villa",
    timestamp: "1 day ago",
    type: "property_edit"
  },
  {
    id: 4,
    action: "Viewed tenant profile for Maria Santos",
    timestamp: "2 days ago",
    type: "tenant_view"
  },
  {
    id: 5,
    action: "Generated monthly report",
    timestamp: "3 days ago",
    type: "report_generation"
  }
]

export function TeamMemberDetail({ memberId, onBack }: TeamMemberDetailProps) {
  const [member, setMember] = useState<TeamMember | null>(() => {
    return mockTeamData.find(m => m.id === memberId) || null
  })

  if (!member) {
    return (
      <div className="pl-4 sm:pl-6 pr-4 sm:pr-6 lg:pr-8 py-4 sm:py-6 lg:py-8 max-w-none">
        <div className="text-center py-12">
          <p className="text-slate-600">Member not found</p>
        </div>
      </div>
    )
  }

  const handleStatusChange = (newStatus: 'Active' | 'Inactive') => {
    setMember({ ...member, status: newStatus })
    toast.success(`Member status updated to ${newStatus}`)
  }

  const handleRoleChange = (newRole: string) => {
    setMember({ ...member, role: newRole })
    toast.success(`Role updated to ${newRole}`)
  }

  const handleAccessLevelChange = (newAccessLevel: 'Full Access' | 'Limited Access') => {
    let updatedPermissions = { ...member.permissions }
    
    if (newAccessLevel === 'Full Access') {
      updatedPermissions = {
        canSubmitServiceRequests: true,
        canViewTenants: true,
        canEditProperties: true,
        canManageTeam: true,
        canViewReports: true
      }
    }
    
    setMember({ 
      ...member, 
      accessLevel: newAccessLevel,
      permissions: updatedPermissions
    })
    toast.success(`Access level updated to ${newAccessLevel}`)
  }

  const handlePermissionChange = (permission: keyof typeof member.permissions, checked: boolean) => {
    const updatedPermissions = {
      ...member.permissions,
      [permission]: checked
    }
    
    // If any permission is turned off, switch to Limited Access
    const hasAllPermissions = Object.values(updatedPermissions).every(Boolean)
    const newAccessLevel = hasAllPermissions ? 'Full Access' : 'Limited Access'
    
    setMember({
      ...member,
      accessLevel: newAccessLevel,
      permissions: updatedPermissions
    })
  }

  const handleRemoveMember = () => {
    toast.success('Member removed from team')
    onBack()
  }



  return (
    <div className="pl-4 sm:pl-6 pr-4 sm:pr-6 lg:pr-8 py-4 sm:py-6 lg:py-8 max-w-none">
      <div className="max-w-4xl space-y-6">
        {/* Member Profile & Basic Info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 mb-2">{member.name}</h1>
              <div className="space-y-1">
                <p className="text-slate-600">{member.role}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Edit Role</DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleStatusChange(member.status === 'Active' ? 'Inactive' : 'Active')}
                >
                  {member.status === 'Active' ? 'Deactivate' : 'Activate'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={handleRemoveMember}>
                  Remove from Team
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-slate-400 mt-1" />
                <div>
                  <Label className="text-sm text-slate-500">Email Address</Label>
                  <p className="text-slate-900">{member.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-slate-400 mt-1" />
                <div>
                  <Label className="text-sm text-slate-500">Phone Number</Label>
                  <p className="text-slate-900">{member.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-slate-400 mt-1" />
                <div>
                  <Label className="text-sm text-slate-500">Join Date</Label>
                  <p className="text-slate-900">{new Date(member.joinDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">

          {/* Access & Permissions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Access & Permissions</h2>
            
            {/* Access Level */}
            <div className="mb-6">
              <Label className="text-sm font-medium text-slate-700 mb-3 block">Current Access Level</Label>
              <div className="max-w-sm">
                <Select 
                  value={member.accessLevel} 
                  onValueChange={handleAccessLevelChange}
                  disabled={member.status === 'Inactive'}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full Access">Full Access</SelectItem>
                    <SelectItem value="Limited Access">Limited Access</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-1">
                  {member.accessLevel === 'Full Access' 
                    ? 'Complete access to all features and functions'
                    : 'Restricted access based on custom permissions below'
                  }
                </p>
              </div>
            </div>

            {/* Permissions Checklist */}
            {member.accessLevel === 'Limited Access' && (
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-3 block">Custom Permissions</Label>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 py-2">
                    <Checkbox
                      checked={member.permissions.canSubmitServiceRequests}
                      onCheckedChange={(checked) => handlePermissionChange('canSubmitServiceRequests', !!checked)}
                      disabled={member.status === 'Inactive'}
                      className="mt-1"
                    />
                    <div>
                      <Label className="text-sm font-medium text-slate-700">Can submit service requests manually</Label>
                      <p className="text-xs text-slate-500">Create and submit new service requests</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 py-2 border-t border-slate-100">
                    <Checkbox
                      checked={member.permissions.canViewTenants}
                      onCheckedChange={(checked) => handlePermissionChange('canViewTenants', !!checked)}
                      disabled={member.status === 'Inactive'}
                      className="mt-1"
                    />
                    <div>
                      <Label className="text-sm font-medium text-slate-700">Can view tenant details</Label>
                      <p className="text-xs text-slate-500">Access tenant profiles and information</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 py-2 border-t border-slate-100">
                    <Checkbox
                      checked={member.permissions.canEditProperties}
                      onCheckedChange={(checked) => handlePermissionChange('canEditProperties', !!checked)}
                      disabled={member.status === 'Inactive'}
                      className="mt-1"
                    />
                    <div>
                      <Label className="text-sm font-medium text-slate-700">Can edit property info</Label>
                      <p className="text-xs text-slate-500">Modify property details and settings</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 py-2 border-t border-slate-100">
                    <Checkbox
                      checked={member.permissions.canManageTeam}
                      onCheckedChange={(checked) => handlePermissionChange('canManageTeam', !!checked)}
                      disabled={member.status === 'Inactive' || member.role === 'Facility Manager'}
                      className="mt-1"
                    />
                    <div>
                      <Label className="text-sm font-medium text-slate-700">Can manage team members</Label>
                      <p className="text-xs text-slate-500">Invite and manage other team members</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 py-2 border-t border-slate-100">
                    <Checkbox
                      checked={member.permissions.canViewReports}
                      onCheckedChange={(checked) => handlePermissionChange('canViewReports', !!checked)}
                      disabled={member.status === 'Inactive'}
                      className="mt-1"
                    />
                    <div>
                      <Label className="text-sm font-medium text-slate-700">Can view reports</Label>
                      <p className="text-xs text-slate-500">Access analytics and reports</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {member.status === 'Inactive' && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  This member is inactive. Activate their account to enable permission changes.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Activity Log</h2>
          <div className="space-y-3">
            {mockActivityData.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-b-0">
                <div className="w-2 h-2 bg-slate-400 rounded-full flex-shrink-0 mt-1.5"></div>
                <div className="flex-1">
                  <p className="text-sm text-slate-900">{activity.action}</p>
                  <span className="text-xs text-slate-500 mt-1 block">{activity.timestamp}</span>
                </div>
              </div>
            ))}
            
            {mockActivityData.length === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-500">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}