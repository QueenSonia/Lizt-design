/* eslint-disable */
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { X, ChevronDown, Check } from 'lucide-react'

export const ALL_PROPERTIES = [
  "Lekki Phase 1 Duplex",
  "Victoria Island Apartment",
  "Ikoyi Terrace",
  "Ajah Bungalow",
  "Oniru Estate",
  "Banana Island Villa",
]

interface AddManagerModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (name: string, phone: string, properties: string[]) => Promise<void>
}

export default function AddManagerModal({ isOpen, onClose, onAdd }: AddManagerModalProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [assignedProperties, setAssignedProperties] = useState<string[]>([])
  const [propPopoverOpen, setPropPopoverOpen] = useState(false)
  const [errors, setErrors] = useState({ name: '', phone: '' })
  const [loading, setLoading] = useState(false)

  const handleClose = () => {
    setName('')
    setPhone('')
    setAssignedProperties([])
    setPropPopoverOpen(false)
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

  const toggleProperty = (prop: string) => {
    setAssignedProperties((prev) =>
      prev.includes(prop) ? prev.filter((p) => p !== prop) : [...prev, prop]
    )
  }

  const removeProperty = (prop: string) => {
    setAssignedProperties((prev) => prev.filter((p) => p !== prop))
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    try {
      setLoading(true)
      await onAdd(name.trim(), phone.trim(), assignedProperties)
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

          <div className="space-y-2">
            <Label>Assigned Properties <span className="text-gray-400 text-xs font-normal">(optional)</span></Label>

            <Popover open={propPopoverOpen} onOpenChange={setPropPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={loading}
                  className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md text-sm text-left hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF5000]/20 focus:border-[#FF5000] disabled:opacity-50"
                >
                  <span className={assignedProperties.length === 0 ? "text-gray-400" : "text-gray-900"}>
                    {assignedProperties.length === 0
                      ? "Select properties to assign…"
                      : `${assignedProperties.length} propert${assignedProperties.length === 1 ? "y" : "ies"} selected`}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start" style={{ width: "var(--radix-popover-trigger-width)" }}>
                <ul className="py-1 max-h-48 overflow-y-auto">
                  {ALL_PROPERTIES.map((prop) => {
                    const selected = assignedProperties.includes(prop)
                    return (
                      <li key={prop}>
                        <button
                          type="button"
                          onClick={() => toggleProperty(prop)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors"
                        >
                          <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selected ? "bg-[#FF5000] border-[#FF5000]" : "border-gray-300"}`}>
                            {selected && <Check className="w-2.5 h-2.5 text-white" />}
                          </span>
                          {prop}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </PopoverContent>
            </Popover>

            {/* Selected chips */}
            {assignedProperties.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {assignedProperties.map((prop) => (
                  <span
                    key={prop}
                    className="inline-flex items-center gap-1 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-medium px-2.5 py-1 rounded-full"
                  >
                    {prop}
                    <button
                      type="button"
                      onClick={() => removeProperty(prop)}
                      disabled={loading}
                      className="text-orange-400 hover:text-orange-600 ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
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
