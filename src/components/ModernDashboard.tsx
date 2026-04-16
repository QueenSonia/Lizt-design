/* eslint-disable */
import { useState } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Building, 
  DollarSign, 
  AlertTriangle,
  Calendar,
  ArrowRight,
  Eye,
  Clock,
  CheckCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Progress } from './ui/progress'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const revenueData = [
  { name: 'Jan', value: 12000000 },
  { name: 'Feb', value: 14500000 },
  { name: 'Mar', value: 13200000 },
  { name: 'Apr', value: 15800000 },
  { name: 'May', value: 17200000 },
  { name: 'Jun', value: 19100000 },
]

const occupancyData = [
  { name: 'Properties', value: 85, color: '#6366f1' },
  { name: 'Vacant', value: 15, color: '#e2e8f0' },
]

const recentActivities = [
  {
    id: 1,
    type: 'tenant_added',
    title: 'New tenant onboarded',
    description: 'Sarah Johnson moved into Sunset Apartments 4A',
    timestamp: '2 minutes ago',
    avatar: 'SJ',
    priority: 'normal' as const
  },
  {
    id: 2,
    type: 'maintenance',
    title: 'Maintenance completed',
    description: 'Plumbing repair finished at Ocean View Towers',
    timestamp: '15 minutes ago',
    avatar: 'MR',
    priority: 'normal' as const
  },
  {
    id: 3,
    type: 'payment',
    title: 'Rent payment received',
    description: '₦1,200,000 from Downtown Lofts Unit 8C',
    timestamp: '1 hour ago',
    avatar: 'RP',
    priority: 'normal' as const
  },
  {
    id: 4,
    type: 'urgent',
    title: 'Urgent: Service request',
    description: 'Water leak reported at Garden Heights 3A',
    timestamp: '2 hours ago',
    avatar: 'UR',
    priority: 'high' as const
  }
]

const upcomingTasks = [
  {
    id: 1,
    title: 'Lease renewal reminder',
    property: 'Sunset Apartments 4A',
    due: 'Today',
    priority: 'high'
  },
  {
    id: 2,
    title: 'Property inspection',
    property: 'Ocean View Towers',
    due: 'Tomorrow',
    priority: 'medium'
  },
  {
    id: 3,
    title: 'KYC review pending',
    property: 'Downtown Lofts',
    due: 'Dec 23',
    priority: 'medium'
  },
  {
    id: 4,
    title: 'Maintenance scheduled',
    property: 'Garden Heights',
    due: 'Dec 24',
    priority: 'low'
  }
]

interface ModernDashboardProps {
  onNavigate: (screen: string) => void
  onTenantClick: (tenantId: string) => void
  onPropertyClick: (propertyId: number) => void
  onActivityClick: (activityId: number) => void
  searchTerm: string
}

export function ModernDashboard({ 
  onNavigate, 
  onTenantClick, 
  onPropertyClick, 
  onActivityClick,
  searchTerm 
}: ModernDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('This Month')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  return (
    <div className="page-container space-y-8">
      {/* KPI Cards */}
      <div className="stats-grid">
        <Card className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-900">₦91.8M</p>
                <div className="flex items-center space-x-1 text-sm">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-600 font-medium">+12.3%</span>
                  <span className="text-slate-600">vs last month</span>
                </div>
              </div>
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Active Tenants</p>
                <p className="text-2xl font-bold text-slate-900">127</p>
                <div className="flex items-center space-x-1 text-sm">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-600 font-medium">+5</span>
                  <span className="text-slate-600">this month</span>
                </div>
              </div>
              <div className="w-12 h-12 gradient-secondary rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Properties</p>
                <p className="text-2xl font-bold text-slate-900">24</p>
                <div className="flex items-center space-x-1 text-sm">
                  <span className="text-slate-600">85% occupied</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Urgent Issues</p>
                <p className="text-2xl font-bold text-slate-900">3</p>
                <div className="flex items-center space-x-1 text-sm">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <span className="text-red-600 font-medium">-2</span>
                  <span className="text-slate-600">resolved today</span>
                </div>
              </div>
              <div className="w-12 h-12 gradient-danger rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="content-grid">
        {/* Left Column */}
        <div className="main-content">
          {/* Revenue Chart */}
          <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <CardHeader className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 rounded-t-xl">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-900">Revenue Overview</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" className="text-xs">
                    {selectedPeriod}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickFormatter={(value) => `₦${(value / 1000000).toFixed(0)}M`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                      labelStyle={{ color: '#1e293b' }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#6366f1" 
                      strokeWidth={3}
                      fill="url(#revenueGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <CardHeader className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 rounded-t-xl">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-900">Recent Activity</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onNavigate('dashboard')}
                  className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                >
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div 
                    key={activity.id} 
                    className="flex items-start space-x-4 p-4 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => onActivityClick(activity.id)}
                  >
                    <Avatar className="w-10 h-10 border-2 border-slate-200">
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs">
                        {activity.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-slate-900">{activity.title}</h4>
                          <p className="text-sm text-slate-600">{activity.description}</p>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span className="text-xs text-slate-500">{activity.timestamp}</span>
                          </div>
                        </div>
                        {activity.priority === 'high' && (
                          <Badge className="bg-red-100 text-red-700 border-red-200">
                            Urgent
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="sidebar-content">
          {/* Occupancy Chart */}
          <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <CardHeader className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 rounded-t-xl">
              <CardTitle className="text-lg font-semibold text-slate-900">Occupancy Rate</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-900">85%</div>
                  <div className="text-sm text-slate-600">Overall Occupancy</div>
                </div>
                
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={occupancyData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {occupancyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                      <span className="text-sm text-slate-600">Occupied</span>
                    </div>
                    <span className="text-sm font-medium text-slate-900">85%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                      <span className="text-sm text-slate-600">Vacant</span>
                    </div>
                    <span className="text-sm font-medium text-slate-900">15%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Tasks */}
          <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <CardHeader className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 rounded-t-xl">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-900">Upcoming Tasks</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-medium text-slate-900">{task.title}</h4>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{task.property}</p>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-slate-500">Due {task.due}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <CardHeader className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 rounded-t-xl">
              <CardTitle className="text-lg font-semibold text-slate-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="h-20 flex-col space-y-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"
                  onClick={() => onNavigate('tenants')}
                >
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span className="text-xs">Add Tenant</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex-col space-y-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"
                  onClick={() => onNavigate('properties')}
                >
                  <Building className="w-5 h-5 text-indigo-600" />
                  <span className="text-xs">Add Property</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex-col space-y-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"
                  onClick={() => onNavigate('service')}
                >
                  <Eye className="w-5 h-5 text-indigo-600" />
                  <span className="text-xs">View Requests</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex-col space-y-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"
                  onClick={() => onNavigate('reports')}
                >
                  <CheckCircle className="w-5 h-5 text-indigo-600" />
                  <span className="text-xs">Reports</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}