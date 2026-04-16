import { ArrowLeft, Phone, Mail, Calendar, DollarSign, Clock, Send, AlertCircle, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'

interface LandlordRentDetailProps {
  rentId: number | null
  onBack: () => void
}

// Mock rent collection data (same as in LandlordRentCollection)
const mockRentData = [
  {
    id: 1,
    tenantName: 'Sarah Johnson',
    property: 'Sunset Apartments Unit 4A',
    rentAmount: 750000,
    dueDate: '2024-12-01',
    status: 'Paid',
    paymentDate: '2024-11-28',
    tenantPhone: '+234 802 123 4567',
    email: 'sarah.johnson@email.com'
  },
  {
    id: 2,
    tenantName: 'Michael Chen',
    property: 'Ocean View Towers Unit 8B',
    rentAmount: 850000,
    dueDate: '2024-12-15',
    status: 'Pending',
    paymentDate: null,
    tenantPhone: '+234 803 234 5678',
    email: 'michael.chen@email.com'
  },
  {
    id: 3,
    tenantName: 'Amara Okafor',
    property: 'Marina Heights Unit 2B',
    rentAmount: 650000,
    dueDate: '2024-11-20',
    status: 'Overdue',
    paymentDate: null,
    tenantPhone: '+234 804 345 6789',
    email: 'amara.okafor@email.com'
  },
  {
    id: 4,
    tenantName: 'David Adebayo',
    property: 'City Centre Plaza Unit 5A',
    rentAmount: 580000,
    dueDate: '2024-12-05',
    status: 'Paid',
    paymentDate: '2024-12-03',
    tenantPhone: '+234 805 456 7890',
    email: 'david.adebayo@email.com'
  },
  {
    id: 5,
    tenantName: 'Grace Emenike',
    property: 'Sunset Apartments Unit 3C',
    rentAmount: 720000,
    dueDate: '2024-11-25',
    status: 'Overdue',
    paymentDate: null,
    tenantPhone: '+234 806 567 8901',
    email: 'grace.emenike@email.com'
  },
  {
    id: 6,
    tenantName: 'John Okafor',
    property: 'Marina Heights Unit 1A',
    rentAmount: 650000,
    dueDate: '2024-12-10',
    status: 'Pending',
    paymentDate: null,
    tenantPhone: '+234 807 678 9012',
    email: 'john.okafor@email.com'
  }
]

export default function LandlordRentDetail({ rentId, onBack }: LandlordRentDetailProps) {
  const rent = mockRentData.find(r => r.id === rentId)

  if (!rent) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600">Rent record not found</p>
        <Button onClick={onBack} className="mt-4" variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Rent Collection
        </Button>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'overdue':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <CheckCircle className="w-4 h-4" />
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'overdue':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const handleSendReminder = () => {
    // Handle send reminder logic
    console.log('Sending reminder to:', rent.tenantName)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rent Details</h1>
          <p className="text-slate-600">{rent.tenantName} - {rent.property}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Rent Information */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-orange-500" />
                Rent Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Rent Amount</label>
                  <p className="text-2xl font-bold text-slate-900">₦{rent.rentAmount.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Due Date</label>
                  <p className="text-lg text-slate-900">{new Date(rent.dueDate).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Status</label>
                  <div className="mt-1">
                    <Badge className={`${getStatusColor(rent.status)} flex items-center gap-1 w-fit`}>
                      {getStatusIcon(rent.status)}
                      {rent.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Payment Date</label>
                  <p className="text-lg text-slate-900">
                    {rent.paymentDate ? new Date(rent.paymentDate).toLocaleDateString() : 'Not paid yet'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-500" />
                Property Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="text-sm font-medium text-slate-700">Property</label>
                <p className="text-lg text-slate-900">{rent.property}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Tenant Contact & Actions */}
        <div className="space-y-6">
          {/* Tenant Contact */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Tenant Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Name</label>
                <p className="text-lg font-semibold text-slate-900">{rent.tenantName}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700">Phone</label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <p className="text-slate-900">{rent.tenantPhone}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700">Email</label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <p className="text-slate-900">{rent.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => window.open(`tel:${rent.tenantPhone}`)}
              >
                <Phone className="w-4 h-4 mr-2" />
                Call Tenant
              </Button>
              
              {rent.status !== 'Paid' && (
                <Button 
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={handleSendReminder}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Reminder
                </Button>
              )}
              
              <Button 
                variant="outline" 
                className="w-full border-slate-200"
                onClick={() => window.open(`mailto:${rent.email}`)}
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}