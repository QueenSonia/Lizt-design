/* eslint-disable */
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'

interface AddManagerModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (name: string, phone: string) => Promise<void>
}

export default function AddManagerModal({ isOpen, onClose, onAdd }: AddManagerModalProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState({ name: '', phone: '' })
  const [loading, setLoading] = useState(false)

  const handleClose = () => {
    setName('')
    setPhone('')
    setErrors({ name: '', phone: '' })
    onClose()
  }

  const validateForm = () => {
    const newErrors = { name: '', phone: '' }
    let isValid = true
    if (!name.trim()) { newErrors.name = 'Name is required'; isValid = false }
    if (!phone.trim()) { newErrors.phone = 'Phone number is required'; isValid = false }
    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    try {
      setLoading(true)
      await onAdd(name.trim(), phone.trim())
      handleClose()
    } catch (error) {
      console.error('Error in modal:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Facility Manager</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: '' }) }}
              placeholder="Enter full name"
              className={errors.name ? 'border-red-500' : ''}
              disabled={loading}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); if (errors.phone) setErrors({ ...errors, phone: '' }) }}
              placeholder="Enter phone number"
              className={errors.phone ? 'border-red-500' : ''}
              disabled={loading}
            />
            {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
          </div>

          <p className="text-xs text-gray-500">
            Facility managers are assigned to individual maintenance requests, not properties.
            New tasks will be visible to this manager once assigned.
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            className="bg-[#FF5000] hover:bg-[#E64500] text-white"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Manager'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
