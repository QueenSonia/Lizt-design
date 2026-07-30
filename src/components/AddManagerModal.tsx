/* eslint-disable */
import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { NIGERIAN_BANKS, mockResolveBankAccount } from '@/lib/bankAccount'

interface AddManagerModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (
    name: string,
    phone: string,
    bankName: string,
    accountNumber: string,
    accountName: string,
  ) => Promise<void>
}

export default function AddManagerModal({ isOpen, onClose, onAdd }: AddManagerModalProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [accountStatus, setAccountStatus] = useState<'idle' | 'resolving' | 'resolved' | 'failed'>('idle')
  const [errors, setErrors] = useState({ name: '', phone: '', bank: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!/^\d{10}$/.test(accountNumber) || !bankName) {
      setAccountStatus('idle')
      setAccountName('')
      return
    }
    setAccountStatus('resolving')
    let cancelled = false
    mockResolveBankAccount(accountNumber, bankName).then((result) => {
      if (cancelled) return
      if (result.success) {
        setAccountName(result.accountName)
        setAccountStatus('resolved')
      } else {
        setAccountName('')
        setAccountStatus('failed')
      }
    })
    return () => {
      cancelled = true
    }
  }, [accountNumber, bankName])

  const handleClose = () => {
    setName('')
    setPhone('')
    setBankName('')
    setAccountNumber('')
    setAccountName('')
    setAccountStatus('idle')
    setErrors({ name: '', phone: '', bank: '' })
    onClose()
  }

  const validateForm = () => {
    const newErrors = { name: '', phone: '', bank: '' }
    let isValid = true
    if (!name.trim()) { newErrors.name = 'Name is required'; isValid = false }
    if (!phone.trim()) { newErrors.phone = 'Phone number is required'; isValid = false }
    if (accountStatus !== 'resolved' || !accountName) {
      newErrors.bank = 'Valid bank account details are required'
      isValid = false
    }
    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    try {
      setLoading(true)
      await onAdd(name.trim(), phone.trim(), bankName, accountNumber, accountName)
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

        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-1">
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

          <div className="pt-2 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mt-4 mb-3">Bank Account Details</h3>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="bank-name">Bank Name <span className="text-red-500">*</span></Label>
                <Select
                  value={bankName}
                  onValueChange={(value) => {
                    setBankName(value)
                    if (errors.bank) setErrors({ ...errors, bank: '' })
                  }}
                  disabled={loading}
                >
                  <SelectTrigger id="bank-name">
                    <SelectValue placeholder="Select bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {NIGERIAN_BANKS.map((bank) => (
                      <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-number">Account Number <span className="text-red-500">*</span></Label>
                <Input
                  id="account-number"
                  value={accountNumber}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10)
                    setAccountNumber(digitsOnly)
                    if (errors.bank) setErrors({ ...errors, bank: '' })
                  }}
                  placeholder="Enter 10-digit account number"
                  inputMode="numeric"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label>Account Name</Label>
                <div className="h-9 flex items-center px-3 rounded-md border border-gray-200 bg-gray-50 text-sm">
                  {accountStatus === 'resolving' && (
                    <span className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Verifying account...
                    </span>
                  )}
                  {accountStatus === 'resolved' && (
                    <span className="flex items-center gap-2 text-emerald-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {accountName}
                    </span>
                  )}
                  {accountStatus === 'idle' && (
                    <span className="text-gray-400">Enter account number to verify</span>
                  )}
                  {accountStatus === 'failed' && (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
                {accountStatus === 'failed' && (
                  <p className="text-sm text-red-500">
                    Could not verify this account. Check the account number and bank, then try again.
                  </p>
                )}
                {errors.bank && accountStatus !== 'failed' && (
                  <p className="text-sm text-red-500">{errors.bank}</p>
                )}
              </div>
            </div>
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
