/* eslint-disable */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, MessageSquare, Send, Search, Users, CheckSquare, Square } from 'lucide-react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Input } from './ui/input'
import { Label } from './ui/label'

import { toast } from 'sonner'

// Mock tenant data - in a real app, this would come from props or API
const mockTenants = [
  { id: 1, name: "Sarah Johnson", phone: "+234 802 345 6789", property: "Sunset Apartments Unit 4A" },
  { id: 2, name: "Michael Chen", phone: "+234 803 456 7890", property: "Ocean View Towers Unit 12B" },
  { id: 3, name: "Emily Rodriguez", phone: "+234 807 567 8901", property: "Downtown Lofts Unit 8C" },
  { id: 4, name: "David Wilson", phone: "+234 809 678 9012", property: "Garden Heights Unit 3A" },
  { id: 5, name: "Lisa Thompson", phone: "+234 810 789 0123", property: "Riverside Condos Unit 6B" },
  { id: 6, name: "James Martinez", phone: "+234 815 890 1234", property: "Metro Plaza Unit 15A" },
  { id: 7, name: "Amina Adebayo", phone: "+234 817 901 2345", property: "Victoria Court Unit 7C" },
  { id: 8, name: "Robert Kim", phone: "+234 818 012 3456", property: "Skyline Residences Unit 22B" }
]



interface WhatsAppBroadcastModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WhatsAppBroadcastModal({ isOpen, onClose }: WhatsAppBroadcastModalProps) {
  const [selectedTenants, setSelectedTenants] = useState<number[]>([])
  const [message, setMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const [isAllSelected, setIsAllSelected] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedTenants([])
      setMessage('')
      setSearchTerm('')
      setIsAllSelected(false)
      setIsSending(false)
    }
  }, [isOpen])

  // Update isAllSelected based on selectedTenants
  useEffect(() => {
    const filteredTenants = mockTenants.filter(tenant =>
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.phone.includes(searchTerm)
    )
    setIsAllSelected(filteredTenants.length > 0 && filteredTenants.every(tenant => selectedTenants.includes(tenant.id)))
  }, [selectedTenants, searchTerm])

  if (!isOpen) return null

  const filteredTenants = mockTenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.phone.includes(searchTerm)
  )

  const handleTenantToggle = (tenantId: number) => {
    setSelectedTenants(prev =>
      prev.includes(tenantId)
        ? prev.filter(id => id !== tenantId)
        : [...prev, tenantId]
    )
  }

  const handleSelectAll = () => {
    if (isAllSelected) {
      // Deselect all filtered tenants
      setSelectedTenants(prev => prev.filter(id => !filteredTenants.some(tenant => tenant.id === id)))
    } else {
      // Select all filtered tenants
      const newSelections = filteredTenants.map(tenant => tenant.id)
      setSelectedTenants(prev => [...new Set([...prev, ...newSelections])])
    }
  }

  const handleSelectAllTenants = () => {
    setSelectedTenants(mockTenants.map(tenant => tenant.id))
    setSearchTerm('')
  }



  const formatPhoneForWhatsApp = (phone: string) => {
    let formattedPhone = phone.replace(/\D/g, '')
    
    if (!formattedPhone.startsWith('234') && formattedPhone.length === 11) {
      formattedPhone = '234' + formattedPhone.substring(1)
    } else if (!formattedPhone.startsWith('234') && formattedPhone.length === 10) {
      formattedPhone = '234' + formattedPhone
    }
    
    return formattedPhone
  }

  const handleSendBroadcast = async () => {
    if (selectedTenants.length === 0) {
      toast.error('Please select at least one tenant to send the message.')
      return
    }

    if (!message.trim()) {
      toast.error('Please enter a message before sending.')
      return
    }

    setIsSending(true)

    try {
      const selectedTenantData = mockTenants.filter(tenant => selectedTenants.includes(tenant.id))
      let successCount = 0
      let failureCount = 0

      // Simulate sending messages with delay
      for (const tenant of selectedTenantData) {
        try {
          // Format phone number for WhatsApp
          const formattedPhone = formatPhoneForWhatsApp(tenant.phone)
          
          // Personalize message (basic template replacement)
          const personalizedMessage = message
            .replace(/\[TENANT_NAME\]/g, tenant.name)
            .replace(/\[PROPERTY\]/g, tenant.property)
          
          // Create WhatsApp URL and open in new tab
          const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(personalizedMessage)}`
          window.open(whatsappUrl, '_blank')
          
          successCount++
          
          // Add small delay between messages to prevent overwhelming
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (error) {
          console.error(`Failed to send message to ${tenant.name}:`, error)
          failureCount++
        }
      }

      // Show result notification
      if (failureCount === 0) {
        toast.success(`Broadcast message sent successfully to ${successCount} tenant${successCount !== 1 ? 's' : ''}!`)
      } else {
        toast.warning(`Message sent to ${successCount} tenant${successCount !== 1 ? 's' : ''}. ${failureCount} message${failureCount !== 1 ? 's' : ''} failed to send.`)
      }

      // Reset form and close modal
      setSelectedTenants([])
      setMessage('')
      setSearchTerm('')
      onClose()
    } catch (error) {
      console.error('Broadcast sending error:', error)
      toast.error('Failed to send broadcast message. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      {/* Backdrop */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 99999
        }}
        onClick={onClose}
      />
      
      {/* Modal Panel */}
      <div 
        style={{
          position: 'relative',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          zIndex: 100000
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '80vh' }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '24px', 
            borderBottom: '1px solid #e2e8f0' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                backgroundColor: '#dcfce7', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: '#1e293b', 
                  margin: 0, 
                  lineHeight: '1.4' 
                }}>
                  Send WhatsApp Broadcast
                </h2>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#64748b', 
                  margin: 0, 
                  lineHeight: '1.4' 
                }}>
                  Send messages to multiple tenants at once
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div style={{ flex: '1', overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>


            {/* Message Composition */}
            <div>
              <Label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '8px' }}>
                Message
              </Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your broadcast message here... Use [TENANT_NAME] and [PROPERTY] for personalization."
                className="min-h-[120px] resize-none border-slate-300 focus:border-[#FF5000] focus:ring-[#FF5000]"
                rows={5}
              />
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', margin: '8px 0 0 0' }}>
                {message.length} characters • Use [TENANT_NAME] and [PROPERTY] for personalization
              </p>
            </div>

            {/* Tenant Selection */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <Label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Select Recipients ({selectedTenants.length} selected)
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllTenants}
                  className="border-[#FF5000] text-[#FF5000] hover:bg-[#FF5000] hover:text-white transition-colors text-xs"
                >
                  <Users className="h-3 w-3 mr-1" />
                  Select All Tenants
                </Button>
              </div>

              {/* Search */}
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search tenants by name, property, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-slate-300 focus:border-[#FF5000] focus:ring-[#FF5000]"
                />
              </div>

              {/* Select All Filtered */}
              {filteredTenants.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    className="text-slate-600 hover:text-slate-800 p-0 h-auto"
                  >
                    {isAllSelected ? (
                      <CheckSquare className="h-4 w-4 mr-2 text-[#FF5000]" />
                    ) : (
                      <Square className="h-4 w-4 mr-2" />
                    )}
                    {isAllSelected ? 'Deselect All' : 'Select All'} ({filteredTenants.length})
                  </Button>
                </div>
              )}

              {/* Tenant List */}
              <div style={{ 
                border: '1px solid #e2e8f0', 
                borderRadius: '6px', 
                maxHeight: '200px', 
                overflowY: 'auto',
                backgroundColor: '#fafafa'
              }}>
                {filteredTenants.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                    No tenants found matching your search.
                  </div>
                ) : (
                  filteredTenants.map((tenant) => (
                    <div
                      key={tenant.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px',
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        backgroundColor: selectedTenants.includes(tenant.id) ? '#fef7f0' : 'transparent'
                      }}
                      onClick={() => handleTenantToggle(tenant.id)}
                    >
                      {selectedTenants.includes(tenant.id) ? (
                        <CheckSquare className="h-4 w-4 mr-3 text-[#FF5000] flex-shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 mr-3 text-slate-400 flex-shrink-0" />
                      )}
                      <div style={{ flex: '1', minWidth: 0 }}>
                        <div style={{ fontWeight: '500', color: '#1e293b', fontSize: '14px' }}>
                          {tenant.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          {tenant.property} • {tenant.phone}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ 
            padding: '24px', 
            borderTop: '1px solid #e2e8f0', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px' 
          }}>
            <Button
              onClick={handleSendBroadcast}
              disabled={selectedTenants.length === 0 || !message.trim() || isSending}
              className="w-full bg-[#FF5000] hover:bg-[#E54800] text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSending ? 'Sending...' : `Send to ${selectedTenants.length} tenant${selectedTenants.length !== 1 ? 's' : ''}`}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSending}
              className="w-full border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  // Use createPortal to render the modal at document.body level
  return createPortal(modalContent, document.body)
}