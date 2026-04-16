import { useState } from 'react'
import { Search, Filter, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { ActivityItem } from './ActivityItem'

// Mock activity data
const mockActivities = [
  {
    id: 1,
    type: 'tenant_added',
    icon: 'user-plus',
    title: 'New tenant added',
    description: 'John Adebayo has been added to Flat 2B, Maple Court',
    timestamp: '2 minutes ago',
    role: 'admin',
    relatedEntity: { type: 'tenant', id: 1, name: 'John Adebayo' },
    priority: 'normal' as const
  },
  {
    id: 2,
    type: 'service_request',
    icon: 'wrench',
    title: 'Service request submitted',
    description: 'Plumbing issue reported for Studio 1A, Urban Residences',
    timestamp: '15 minutes ago',
    role: 'tenant',
    relatedEntity: { type: 'property', id: 2, name: 'Studio 1A, Urban Residences' },
    priority: 'high' as const
  },
  {
    id: 3,
    type: 'kyc_approved',
    icon: 'check-circle',
    title: 'KYC Application approved',
    description: 'Sarah Johnson\'s KYC application has been approved',
    timestamp: '1 hour ago',
    role: 'admin',
    relatedEntity: { type: 'kyc', id: 3, name: 'Sarah Johnson' },
    priority: 'normal' as const
  },
  {
    id: 4,
    type: 'rent_due',
    icon: 'calendar',
    title: 'Rent payment is due',
    description: 'Rent payment due for Apartment 3C, Garden View',
    timestamp: '2 hours ago',
    role: 'system',
    relatedEntity: { type: 'property', id: 4, name: 'Apartment 3C, Garden View' },
    priority: 'high' as const
  },
  {
    id: 5,
    type: 'document_uploaded',
    icon: 'file-text',
    title: 'Document uploaded',
    description: 'Lease agreement uploaded for Penthouse 5A',
    timestamp: '3 hours ago',
    role: 'admin',
    relatedEntity: { type: 'property', id: 5, name: 'Penthouse 5A, Skyline Towers' },
    priority: 'normal' as const
  },
  {
    id: 6,
    type: 'facility_assigned',
    icon: 'user-check',
    title: 'Facility manager assigned',
    description: 'Mike Wilson assigned to Riverside Estate complex',
    timestamp: '4 hours ago',
    role: 'admin',
    relatedEntity: { type: 'facility', id: 6, name: 'Mike Wilson' },
    priority: 'normal' as const
  }
]

interface ActivityFeedProps {
  activityFilter: string
  onActivityClick: (activityId: number) => void
}

export function ActivityFeed({ activityFilter, onActivityClick }: ActivityFeedProps) {
  const [localFilter, setLocalFilter] = useState('')
  // const [timeFilter, setTimeFilter] = useState('all')

  const filteredActivities = mockActivities
    .filter(activity => {
      // Apply search filter from parent component
      if (activityFilter && !activity.title.toLowerCase().includes(activityFilter.toLowerCase()) && 
          !activity.description.toLowerCase().includes(activityFilter.toLowerCase())) {
        return false
      }

      // Apply local search filter
      if (localFilter && !activity.title.toLowerCase().includes(localFilter.toLowerCase()) && 
          !activity.description.toLowerCase().includes(localFilter.toLowerCase())) {
        return false
      }
      
      return true
    })

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="border-b border-gray-200 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="font-medium text-gray-900">
            Live Activity Feed
          </CardTitle>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search activities..."
                value={localFilter}
                onChange={(e) => setLocalFilter(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Today
            </Button>
            
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              All Types
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filteredActivities.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredActivities.map((activity) => (
              <div 
                key={activity.id} 
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors border-l-4 border-transparent hover:border-blue-500"
                onClick={() => onActivityClick(activity.id)}
              >
                <ActivityItem activity={activity} />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Filter className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
            <p className="text-gray-600 max-w-sm mx-auto">
              {activityFilter || localFilter
                ? 'Try adjusting your filters to see more activities.'
                : 'Activity will appear here as things happen with your properties.'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}