import { Clock } from 'lucide-react'

interface Activity {
  id: number
  type: string
  icon: string
  description: string
  timestamp: string
  role: string
  priority?: string
  status?: string
}

interface ActivityItemProps {
  activity: Activity
}

export function ActivityItem({ activity }: ActivityItemProps) {
  return (
    <div className="flex items-start space-x-4">
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium text-gray-900 leading-6 mb-3">
              {activity.description}
            </p>
            
            {/* Metadata - Only timestamp now */}
            <div className="flex items-center space-x-3 text-sm text-gray-500">
              <div className="flex items-center space-x-1.5">
                <Clock className="w-4 h-4" />
                <span>{activity.timestamp}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}