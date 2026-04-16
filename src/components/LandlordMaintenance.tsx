/* eslint-disable */
import { useState } from 'react'
import { MessageSquare, CheckCircle, Phone, Calendar, X, Image, Video, Mic } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Separator } from './ui/separator'

interface LandlordMaintenanceProps {
  searchTerm?: string
}

// Mock service requests data
const mockServiceRequests = [
  {
    id: 1,
    tenantName: "Sarah Johnson",
    tenantInitials: "SJ",
    tenantAvatar: null,
    tenantContact: "+234 801 234 5678",
    propertyName: "Sunset View Apartments",
    messagePreview: "Hi, there's a leak under the kitchen sink that's been dripping for 2 days. Water is pooling in the cabinet...",
    fullMessage: "Hi, there's a leak under the kitchen sink that's been dripping for 2 days. Water is pooling in the cabinet and I'm concerned about water damage. It seems to be coming from the pipe connection. This needs urgent attention as it's getting worse.",
    timestamp: "2h ago",
    dateReported: "2024-12-08T14:30:00",
    status: "Open" as "Open" | "Acknowledged" | "Resolved",
    attachments: [
      { type: "image", name: "kitchen_leak.jpg", url: "#" },
      { type: "video", name: "leak_video.mp4", url: "#" }
    ]
  },
  {
    id: 2,
    tenantName: "Michael Chen",
    tenantInitials: "MC", 
    tenantAvatar: null,
    tenantContact: "+234 802 345 6789",
    propertyName: "Ocean View Towers",
    messagePreview: "The AC in the living room stopped working yesterday. It's not cooling at all and makes a strange noise...",
    fullMessage: "The AC in the living room stopped working yesterday. It's not cooling at all and makes a strange noise when I try to turn it on. I checked the power and it's getting electricity, but no cold air is coming out. The weather is really hot and I need this fixed urgently please.",
    timestamp: "1d ago",
    dateReported: "2024-12-07T09:15:00",
    status: "Acknowledged" as "Open" | "Acknowledged" | "Resolved",
    attachments: [
      { type: "audio", name: "ac_noise.mp3", url: "#" }
    ]
  },
  {
    id: 3,
    tenantName: "Lisa Thompson",
    tenantInitials: "LT",
    tenantAvatar: null,
    tenantContact: "+234 803 456 7890",
    propertyName: "Garden Estate Homes", 
    messagePreview: "Good morning! The bathroom light bulb needs to be replaced. It's been flickering for a week...",
    fullMessage: "Good morning! The bathroom light bulb needs to be replaced. It's been flickering for a week and now it's completely out. I can't see properly in the bathroom, especially at night. Could you please send someone to replace it? Thank you!",
    timestamp: "3d ago",
    dateReported: "2024-12-05T08:45:00",
    status: "Resolved" as "Open" | "Acknowledged" | "Resolved",
    attachments: []
  },
  {
    id: 4,
    tenantName: "David Wilson",
    tenantInitials: "DW",
    tenantAvatar: null,
    tenantContact: "+234 804 567 8901",
    propertyName: "City Centre Plaza",
    messagePreview: "There's very low water pressure in the bathroom shower and sink. It started yesterday...",
    fullMessage: "There's very low water pressure in the bathroom shower and sink. It started yesterday morning and it's getting worse. I can barely get enough water for a proper shower. This might be a pipe issue that needs checking urgently.",
    timestamp: "4d ago",
    dateReported: "2024-12-04T16:20:00",
    status: "Open" as "Open" | "Acknowledged" | "Resolved",
    attachments: [
      { type: "image", name: "low_pressure.jpg", url: "#" }
    ]
  },
  {
    id: 5,
    tenantName: "Jennifer Adams",
    tenantInitials: "JA",
    tenantAvatar: null,
    tenantContact: "+234 805 678 9012",
    propertyName: "Marina Heights",
    messagePreview: "The door handle on the main entrance is completely broken and I can't secure the apartment properly...",
    fullMessage: "The door handle on the main entrance is completely broken and I can't secure the apartment properly. It fell off yesterday evening and now I can't lock the door from the outside. This is a security issue that needs immediate attention please.",
    timestamp: "5d ago",
    dateReported: "2024-12-03T19:45:00",
    status: "Acknowledged" as "Open" | "Acknowledged" | "Resolved",
    attachments: [
      { type: "image", name: "broken_handle.jpg", url: "#" },
      { type: "image", name: "door_damage.jpg", url: "#" }
    ]
  }
]

export default function LandlordMaintenance({ searchTerm = '' }: LandlordMaintenanceProps) {
  const [selectedServiceRequest, setSelectedServiceRequest] = useState<number | null>(null)
  const [serviceRequests, setServiceRequests] = useState(mockServiceRequests)

  // Filter data based on search term
  const filteredRequests = serviceRequests.filter(request => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      request.tenantName.toLowerCase().includes(searchLower) ||
      request.propertyName.toLowerCase().includes(searchLower) ||
      request.messagePreview.toLowerCase().includes(searchLower) ||
      request.fullMessage.toLowerCase().includes(searchLower)
    )
  })

  const getServiceRequestStatusBadge = (status: string) => {
    switch (status) {
      case 'Open':
        return null
      case 'Acknowledged':
        return null
      case 'Resolved':
        return null
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleServiceRequestClick = (requestId: number) => {
    setSelectedServiceRequest(requestId)
  }

  const handleUpdateStatus = (requestId: number, newStatus: string) => {
    setServiceRequests(prev => 
      prev.map(request => 
        request.id === requestId 
          ? { ...request, status: newStatus as "Open" | "Acknowledged" | "Resolved" }
          : request
      )
    )
  }

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="w-4 h-4" />
      case 'video':
        return <Video className="w-4 h-4" />
      case 'audio':
        return <Mic className="w-4 h-4" />
      default:
        return <MessageSquare className="w-4 h-4" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const selectedRequest = serviceRequests.find(req => req.id === selectedServiceRequest)

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-slate-900">Service Requests</h2>
        <p className="text-sm text-slate-600">Requests reported by tenants through Lizt.</p>
      </div>

      {/* Service Requests Feed */}
      <Card className="border-slate-200">
        <CardContent className="p-0">
          {filteredRequests.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-6 hover:bg-slate-50 cursor-pointer transition-all duration-200 border-l-4 border-l-transparent hover:border-l-orange-400 hover:shadow-sm"
                  onClick={() => handleServiceRequestClick(request.id)}
                >
                  <div className="flex items-start">
                    {/* Request Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-slate-900">{request.tenantName}</h4>
                          <span className="text-sm text-slate-500">•</span>
                          <span className="text-sm text-slate-500">{request.propertyName}</span>
                        </div>
                        <div className="flex items-center space-x-3 flex-shrink-0">
                          {getServiceRequestStatusBadge(request.status)}
                          <span className="text-sm text-slate-500 whitespace-nowrap">{request.timestamp}</span>

                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-700 line-clamp-2 mb-2">
                        {request.messagePreview}
                      </p>

                      {/* Attachments indicator */}
                      {request.attachments.length > 0 && (
                        <div className="flex items-center space-x-2 text-xs text-slate-500">
                          <MessageSquare className="w-3 h-3" />
                          <span>{request.attachments.length} attachment{request.attachments.length > 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No service requests yet</h3>
              <p className="text-slate-600">No service requests have been submitted yet for this property.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Request Detail Dialog */}
      <Dialog open={selectedServiceRequest !== null} onOpenChange={() => setSelectedServiceRequest(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Service Request Details</DialogTitle>
                <DialogDescription>
                  Service request information and details
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Tenant Information */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900">{selectedRequest.tenantName}</h3>
                    <div className="flex items-center space-x-4 text-sm text-slate-600 mt-1">
                      <div className="flex items-center space-x-1">
                        <Phone className="w-3 h-3" />
                        <span>{selectedRequest.tenantContact}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatTimestamp(selectedRequest.dateReported)}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    {getServiceRequestStatusBadge(selectedRequest.status)}
                  </div>
                </div>

                <Separator />

                {/* Full Message */}
                <div>
                  <h4 className="font-medium text-slate-900 mb-3">Description</h4>
                  <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <p className="text-slate-700 leading-relaxed">{selectedRequest.fullMessage}</p>
                  </div>
                </div>

                {/* Attachments */}
                {selectedRequest.attachments.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-3">Attachments</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedRequest.attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                        >
                          <div className="p-2 bg-slate-100 rounded">
                            {getAttachmentIcon(attachment.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {attachment.name}
                            </p>
                            <p className="text-xs text-slate-500 capitalize">{attachment.type}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {selectedRequest.status === 'Open' && (
                    <Button
                      onClick={() => {
                        handleUpdateStatus(selectedRequest.id, 'Acknowledged')
                        setSelectedServiceRequest(null)
                      }}
                      className="gradient-primary text-white flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Acknowledged
                    </Button>
                  )}
                  
                  {selectedRequest.status === 'Acknowledged' && (
                    <Button
                      onClick={() => {
                        handleUpdateStatus(selectedRequest.id, 'Resolved')
                        setSelectedServiceRequest(null)
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Resolved
                    </Button>
                  )}

                  {selectedRequest.status === 'Resolved' && (
                    <div className="flex items-center justify-center p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <span className="text-green-700 font-medium">This request has been resolved</span>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => setSelectedServiceRequest(null)}
                    className="flex-1 sm:flex-none"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}