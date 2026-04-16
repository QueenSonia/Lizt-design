/* eslint-disable */
import { useState } from 'react'
import { Settings, Package, MessageSquare, CreditCard, Wrench, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Switch } from './ui/switch'
import { Separator } from './ui/separator'
import { toast } from 'sonner'
import { LandlordPackage, PACKAGE_DISPLAY_NAMES, canAddPackage, getPackageVariantName } from '@/types/packages'

interface LandlordPackageSelectorProps {
  selectedPackages: LandlordPackage[]
  onPackagesChange: (packages: LandlordPackage[]) => void
  showDebugToggle?: boolean
}

const PACKAGE_DESCRIPTIONS = {
  'rent-reminders': 'Automated WhatsApp rent reminders sent to tenants before due dates',
  'rent-collection': 'Track rent payments and automate follow-ups (requires Rent Reminders)',
  'maintenance-management': 'Manage maintenance requests and service provider coordination'
}

const PACKAGE_ICONS = {
  'rent-reminders': MessageSquare,
  'rent-collection': CreditCard,
  'maintenance-management': Wrench
}

export default function LandlordPackageSelector({
  selectedPackages, 
  onPackagesChange,
  showDebugToggle = false 
}: LandlordPackageSelectorProps) {
  const [showDebugPanel, setShowDebugPanel] = useState(false)

  const handlePackageToggle = (packageType: LandlordPackage) => {
    const isSelected = selectedPackages.includes(packageType)
    
    if (isSelected) {
      // Remove package and any dependents
      let newPackages = selectedPackages.filter(p => p !== packageType)
      
      // If removing rent-reminders, also remove rent-collection
      if (packageType === 'rent-reminders') {
        newPackages = newPackages.filter(p => p !== 'rent-collection')
      }
      
      onPackagesChange(newPackages)
      toast.success(`${PACKAGE_DISPLAY_NAMES[packageType]} disabled`)
    } else {
      // Add package if dependencies are met
      if (canAddPackage(packageType, selectedPackages)) {
        onPackagesChange([...selectedPackages, packageType])
        toast.success(`${PACKAGE_DISPLAY_NAMES[packageType]} enabled`)
      } else {
        toast.error(`Please enable Rent Reminders first to use ${PACKAGE_DISPLAY_NAMES[packageType]}`)
      }
    }
  }

  const debugPresets = [
    { name: 'Base Dashboard', packages: [] as LandlordPackage[] },
    { name: 'Reminders Only', packages: ['rent-reminders'] as LandlordPackage[] },
    { name: 'Reminders + Collection', packages: ['rent-reminders', 'rent-collection'] as LandlordPackage[] },
    { name: 'Maintenance Only', packages: ['maintenance-management'] as LandlordPackage[] },
    { name: 'Full Package', packages: ['rent-reminders', 'rent-collection', 'maintenance-management'] as LandlordPackage[] }
  ]

  return (
    <div className="space-y-6">
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Package className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Service Packages</CardTitle>
                <p className="text-sm text-slate-600 mt-1">
                  Configure your Property Kraft automation services
                </p>
              </div>
            </div>
            {showDebugToggle && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDebugPanel(!showDebugPanel)}
                className="gap-2"
              >
                {showDebugPanel ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                Debug
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Configuration */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-900">Current Configuration</p>
              <p className="text-sm text-slate-600">{getPackageVariantName(selectedPackages)}</p>
            </div>
            <Badge variant={selectedPackages.length > 0 ? "default" : "secondary"} className="bg-orange-100 text-orange-700">
              {selectedPackages.length} package{selectedPackages.length !== 1 ? 's' : ''} active
            </Badge>
          </div>

          <Separator />

          {/* Package Options */}
          <div className="space-y-3">
            {(Object.keys(PACKAGE_DESCRIPTIONS) as LandlordPackage[]).map((packageType) => {
              const Icon = PACKAGE_ICONS[packageType]
              const isSelected = selectedPackages.includes(packageType)
              const canAdd = canAddPackage(packageType, selectedPackages)
              const isDisabled = !isSelected && !canAdd

              return (
                <div
                  key={packageType}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                    isSelected 
                      ? 'border-orange-200 bg-orange-50' 
                      : isDisabled 
                        ? 'border-slate-200 bg-slate-50' 
                        : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${
                      isSelected 
                        ? 'bg-orange-100 text-orange-600' 
                        : isDisabled 
                          ? 'bg-slate-100 text-slate-400'
                          : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`font-medium ${
                        isDisabled ? 'text-slate-400' : 'text-slate-900'
                      }`}>
                        {PACKAGE_DISPLAY_NAMES[packageType]}
                      </p>
                      <p className={`text-sm ${
                        isDisabled ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        {PACKAGE_DESCRIPTIONS[packageType]}
                      </p>
                      {isDisabled && packageType === 'rent-collection' && (
                        <p className="text-xs text-orange-600 mt-1">
                          Requires Rent Reminders to be enabled first
                        </p>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={isSelected}
                    onCheckedChange={() => handlePackageToggle(packageType)}
                    disabled={isDisabled}
                  />
                </div>
              )
            })}
          </div>

          {/* Debug Panel */}
          {showDebugToggle && showDebugPanel && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium text-slate-900">Debug: Quick Package Presets</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {debugPresets.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onPackagesChange(preset.packages)
                        toast.success(`Switched to ${preset.name}`)
                      }}
                      className="justify-start"
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}