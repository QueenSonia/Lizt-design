import { useState } from 'react'
import { Search, Filter, DollarSign, Calendar, TrendingUp, Download, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

interface LandlordPaymentsProps {
  searchTerm?: string
}

// Mock payment data for landlord's properties
const mockPayments = [
  {
    id: 1,
    tenantName: 'Sarah Johnson',
    property: 'Sunset Apartments Unit 4A',
    amount: 750000,
    dueDate: '2024-11-01',
    paidDate: '2024-11-01',
    status: 'Paid',
    method: 'Bank Transfer',
    reference: 'TXN001234567',
    month: 'November 2024',
    lateFee: 0
  },
  {
    id: 2,
    tenantName: 'Michael Chen',
    property: 'Ocean View Towers Unit 8B',
    amount: 850000,
    dueDate: '2024-11-15',
    paidDate: null,
    status: 'Overdue',
    method: null,
    reference: null,
    month: 'November 2024',
    lateFee: 42500
  },
  {
    id: 3,
    tenantName: 'Amara Okafor',
    property: 'Marina Heights Unit 2B',
    amount: 650000,
    dueDate: '2024-12-05',
    paidDate: null,
    status: 'Upcoming',
    method: null,
    reference: null,
    month: 'December 2024',
    lateFee: 0
  },
  {
    id: 4,
    tenantName: 'David Adebayo',
    property: 'City Centre Plaza Unit 5A',
    amount: 580000,
    dueDate: '2024-11-10',
    paidDate: '2024-11-08',
    status: 'Paid',
    method: 'Cash',
    reference: 'CASH001',
    month: 'November 2024',
    lateFee: 0
  },
  {
    id: 5,
    tenantName: 'Grace Emenike',
    property: 'Sunset Apartments Unit 3C',
    amount: 720000,
    dueDate: '2024-11-01',
    paidDate: '2024-11-03',
    status: 'Paid Late',
    method: 'Bank Transfer',
    reference: 'TXN001234890',
    month: 'November 2024',
    lateFee: 15000
  },
  {
    id: 6,
    tenantName: 'John Okafor',
    property: 'Marina Heights Unit 1A',
    amount: 650000,
    dueDate: '2024-12-05',
    paidDate: null,
    status: 'Upcoming',
    method: null,
    reference: null,
    month: 'December 2024',
    lateFee: 0
  },
  // Previous month payments
  {
    id: 7,
    tenantName: 'Sarah Johnson',
    property: 'Sunset Apartments Unit 4A',
    amount: 750000,
    dueDate: '2024-10-01',
    paidDate: '2024-09-30',
    status: 'Paid',
    method: 'Bank Transfer',
    reference: 'TXN001234500',
    month: 'October 2024',
    lateFee: 0
  },
  {
    id: 8,
    tenantName: 'Michael Chen',
    property: 'Ocean View Towers Unit 8B',
    amount: 850000,
    dueDate: '2024-10-15',
    paidDate: '2024-10-18',
    status: 'Paid Late',
    method: 'Bank Transfer',
    reference: 'TXN001234501',
    month: 'October 2024',
    lateFee: 25500
  }
]

const monthlyRevenue = [
  { month: 'Jul 2024', revenue: 4200000, collected: 4200000 },
  { month: 'Aug 2024', revenue: 4200000, collected: 4050000 },
  { month: 'Sep 2024', revenue: 4200000, collected: 4200000 },
  { month: 'Oct 2024', revenue: 4200000, collected: 4100000 },
  { month: 'Nov 2024', revenue: 4200000, collected: 3180000 },
  { month: 'Dec 2024', revenue: 4200000, collected: 0 }
]

export function LandlordPayments({ searchTerm = '' }: LandlordPaymentsProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [monthFilter, setMonthFilter] = useState('All')
  const [activeTab, setActiveTab] = useState('overview')

  const effectiveSearchTerm = searchTerm || localSearchTerm

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'paid late':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'overdue':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'upcoming':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const filteredPayments = mockPayments.filter(payment => {
    const matchesSearch = effectiveSearchTerm === '' || 
      payment.tenantName.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
      payment.property.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
      (payment.reference && payment.reference.toLowerCase().includes(effectiveSearchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'All' || payment.status === statusFilter
    const matchesMonth = monthFilter === 'All' || payment.month === monthFilter
    
    return matchesSearch && matchesStatus && matchesMonth
  })

  // Calculate statistics
  const totalExpected = mockPayments.filter(p => p.month === 'November 2024').reduce((sum, p) => sum + p.amount, 0)
  const totalCollected = mockPayments.filter(p => p.month === 'November 2024' && p.status !== 'Upcoming' && p.status !== 'Overdue').reduce((sum, p) => sum + p.amount, 0)
  const totalOverdue = mockPayments.filter(p => p.status === 'Overdue').reduce((sum, p) => sum + p.amount + p.lateFee, 0)
  const collectionRate = ((totalCollected / totalExpected) * 100).toFixed(1)

  const overduePayments = mockPayments.filter(p => p.status === 'Overdue').length
  const upcomingPayments = mockPayments.filter(p => p.status === 'Upcoming').length
  const totalLateFees = mockPayments.reduce((sum, p) => sum + p.lateFee, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rent Payments</h1>
          <p className="text-slate-600">Track rent collection and payment history across your portfolio</p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">₦{(totalCollected / 1000000).toFixed(1)}M</p>
                    <p className="text-sm text-slate-600">Collected This Month</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{collectionRate}%</p>
                    <p className="text-sm text-slate-600">Collection Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">₦{(totalOverdue / 1000000).toFixed(1)}M</p>
                    <p className="text-sm text-slate-600">Outstanding</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">₦{(totalLateFees / 1000).toFixed(0)}K</p>
                    <p className="text-sm text-slate-600">Late Fees Collected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Revenue Chart */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <TrendingUp className="w-5 h-5" />
                Monthly Revenue Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyRevenue.map((month, index) => {
                  const collectionPercent = (month.collected / month.revenue) * 100
                  return (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900">{month.month}</p>
                        <p className="text-sm text-slate-600">
                          ₦{(month.collected / 1000000).toFixed(1)}M / ₦{(month.revenue / 1000000).toFixed(1)}M
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-24 bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${collectionPercent}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-slate-900 min-w-[3rem]">
                          {collectionPercent.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Payment Status Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Payment Status Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-700">Overdue Payments</span>
                  </div>
                  <Badge className="bg-red-100 text-red-700 border-red-200">
                    {overduePayments} tenants
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-700">Upcoming Payments</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    {upcomingPayments} tenants
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-700">Paid This Month</span>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    {mockPayments.filter(p => p.month === 'November 2024' && (p.status === 'Paid' || p.status === 'Paid Late')).length} tenants
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" size="sm">
                  Send Rent Reminders
                </Button>
                <Button variant="outline" className="w-full border-slate-200" size="sm">
                  Generate Payment Report
                </Button>
                <Button variant="outline" className="w-full border-slate-200" size="sm">
                  View Outstanding Balances
                </Button>
                <Button variant="outline" className="w-full border-slate-200" size="sm">
                  Export Payment History
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          {/* Filters */}
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search payments..."
                    value={localSearchTerm}
                    onChange={(e) => setLocalSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Statuses</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Paid Late">Paid Late</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                    <SelectItem value="Upcoming">Upcoming</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Months</SelectItem>
                    <SelectItem value="November 2024">November 2024</SelectItem>
                    <SelectItem value="October 2024">October 2024</SelectItem>
                    <SelectItem value="December 2024">December 2024</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline" 
                  className="border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <div className="grid gap-4">
            {filteredPayments.map((payment) => (
              <Card key={payment.id} className="border-slate-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
                    {/* Tenant & Property */}
                    <div className="lg:col-span-2">
                      <h3 className="font-semibold text-slate-900">{payment.tenantName}</h3>
                      <p className="text-sm text-slate-600">{payment.property}</p>
                      <Badge className={getPaymentStatusColor(payment.status)} >
                        {payment.status}
                      </Badge>
                    </div>

                    {/* Amount */}
                    <div>
                      <p className="text-sm text-slate-500">Rent Amount</p>
                      <p className="font-semibold text-slate-900">₦{payment.amount.toLocaleString()}</p>
                      {payment.lateFee > 0 && (
                        <p className="text-sm text-red-600">+ ₦{payment.lateFee.toLocaleString()} late fee</p>
                      )}
                    </div>

                    {/* Dates */}
                    <div>
                      <p className="text-sm text-slate-500">Due Date</p>
                      <p className="font-semibold text-slate-900">{payment.dueDate}</p>
                      {payment.paidDate && (
                        <>
                          <p className="text-sm text-slate-500 mt-1">Paid Date</p>
                          <p className="font-semibold text-slate-900">{payment.paidDate}</p>
                        </>
                      )}
                    </div>

                    {/* Payment Details */}
                    <div>
                      {payment.method && (
                        <>
                          <p className="text-sm text-slate-500">Method</p>
                          <p className="font-semibold text-slate-900">{payment.method}</p>
                        </>
                      )}
                      {payment.reference && (
                        <>
                          <p className="text-sm text-slate-500 mt-1">Reference</p>
                          <p className="font-semibold text-slate-900 text-xs">{payment.reference}</p>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2">
                      <Button size="sm" variant="outline" className="border-slate-200">
                        View Details
                      </Button>
                      {payment.status === 'Overdue' && (
                        <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                          Send Reminder
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPayments.length === 0 && (
            <Card className="border-slate-200">
              <CardContent className="p-12 text-center">
                <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No payments found</h3>
                <p className="text-slate-600">
                  {effectiveSearchTerm ? 'Try adjusting your search or filters.' : 'No payment records match the current filters.'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}