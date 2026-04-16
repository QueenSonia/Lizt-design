import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, MessageSquare, Paperclip, Send, Users } from 'lucide-react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { toast } from 'sonner'

interface Tenant {
  id: number
  name: string
  phone: string
}

interface WhatsAppModalProps {
  isOpen: boolean
  onClose: () => void
  tenant: Tenant | null
  onBroadcastClick?: () => void
}

export function WhatsAppModal({ isOpen, onClose, tenant, onBroadcastClick }: WhatsAppModalProps) {
  const [message, setMessage] = useState('')
  const [hasAttachment, setHasAttachment] = useState(false)

  if (!isOpen || !tenant) return null

  const handleSendMessage = () => {
    if (!message.trim()) {
      toast.error('Please enter a message before sending.')
      return
    }

    // Format phone number for WhatsApp (remove any non-digits and add country code if needed)
    let formattedPhone = tenant.phone.replace(/\D/g, '')
    
    // If phone doesn't start with country code, assume it's a local number and add default country code
    if (!formattedPhone.startsWith('234') && formattedPhone.length === 11) {
      formattedPhone = '234' + formattedPhone.substring(1)
    } else if (!formattedPhone.startsWith('234') && formattedPhone.length === 10) {
      formattedPhone = '234' + formattedPhone
    }

    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank')
    
    // Show success message
    toast.success(`WhatsApp message sent to ${tenant.name}`)
    
    // Reset form and close modal
    setMessage('')
    setHasAttachment(false)
    onClose()
  }

  const handleFileAttach = () => {
    setHasAttachment(!hasAttachment)
    toast.info('File attachment feature coming soon!')
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
          maxWidth: '448px',
          maxHeight: '90vh',
          zIndex: 100000
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '600px' }}>
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
                <MessageSquare className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: '#1e293b', 
                  margin: 0, 
                  lineHeight: '1.4' 
                }}>
                  Send WhatsApp Message
                </h2>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#64748b', 
                  margin: 0, 
                  lineHeight: '1.4' 
                }}>
                  Compose your message below
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

          {/* Tenant Information */}
          <div style={{ 
            padding: '24px', 
            borderBottom: '1px solid #f1f5f9', 
            backgroundColor: '#f8fafc' 
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#64748b', 
                  display: 'block', 
                  marginBottom: '4px' 
                }}>
                  Recipient
                </label>
                <p style={{ 
                  color: '#1e293b', 
                  fontWeight: '500', 
                  margin: 0, 
                  fontSize: '14px' 
                }}>
                  {tenant.name}
                </p>
              </div>
              <div>
                <label style={{ 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#64748b', 
                  display: 'block', 
                  marginBottom: '4px' 
                }}>
                  Phone Number
                </label>
                <p style={{ 
                  color: '#374151', 
                  margin: 0, 
                  fontSize: '14px' 
                }}>
                  {tenant.phone}
                </p>
              </div>
            </div>
          </div>

          {/* Message Composition */}
          <div style={{ 
            flex: '1', 
            padding: '24px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px', 
            overflowY: 'auto' 
          }}>
            <div>
              <label style={{ 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151', 
                display: 'block', 
                marginBottom: '8px' 
              }}>
                Message
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                className="min-h-[120px] resize-none border-slate-300 focus:border-[#FF5000] focus:ring-[#FF5000]"
                rows={5}
              />
              <p style={{ 
                fontSize: '12px', 
                color: '#64748b', 
                marginTop: '8px', 
                margin: '8px 0 0 0' 
              }}>
                {message.length} characters
              </p>
            </div>

            {/* File Attachment */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFileAttach}
                className={`border-slate-200 hover:bg-slate-50 ${hasAttachment ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}`}
              >
                <Paperclip className="h-4 w-4 mr-2" />
                {hasAttachment ? 'File Attached' : 'Attach File'}
              </Button>
              {hasAttachment && (
                <span style={{ fontSize: '12px', color: '#2563eb' }}>
                  Media attachment (Coming Soon)
                </span>
              )}
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
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className="w-full bg-[#FF5000] hover:bg-[#E54800] text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
            
            {onBroadcastClick && (
              <Button
                variant="outline"
                onClick={() => {
                  onBroadcastClick()
                  onClose()
                }}
                className="w-full border-[#FF5000] text-[#FF5000] hover:bg-[#FF5000] hover:text-white"
              >
                <Users className="h-4 w-4 mr-2" />
                Send Broadcast to Multiple Tenants
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={onClose}
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