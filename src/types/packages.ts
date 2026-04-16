// Package management types for Property Kraft landlord dashboard

export type LandlordPackage = 'rent-reminders' | 'rent-collection' | 'maintenance-management'

export interface LandlordPackageState {
  selectedPackages: LandlordPackage[]
  hasRentReminders: boolean
  hasRentCollection: boolean  
  hasMaintenanceManagement: boolean
}

export const PACKAGE_DEPENDENCIES = {
  'rent-collection': ['rent-reminders'], // Rent Collection requires Rent Reminders
  'rent-reminders': [], // Rent Reminders has no dependencies
  'maintenance-management': [] // Maintenance Management is independent
}

export const PACKAGE_DISPLAY_NAMES = {
  'rent-reminders': 'Rent Reminders',
  'rent-collection': 'Rent Collection', 
  'maintenance-management': 'Maintenance Management'
}

export function getAvailablePackages(currentPackages: LandlordPackage[]): LandlordPackage[] {
  const available: LandlordPackage[] = []
  
  // Always available
  if (!currentPackages.includes('rent-reminders')) {
    available.push('rent-reminders')
  }
  
  if (!currentPackages.includes('maintenance-management')) {
    available.push('maintenance-management')
  }
  
  // Only available if rent-reminders is selected
  if (currentPackages.includes('rent-reminders') && !currentPackages.includes('rent-collection')) {
    available.push('rent-collection')
  }
  
  return available
}

export function canAddPackage(packageToAdd: LandlordPackage, currentPackages: LandlordPackage[]): boolean {
  const dependencies = PACKAGE_DEPENDENCIES[packageToAdd]
  return dependencies.every(dep => currentPackages.includes(dep as LandlordPackage))
}

export function getPackageVariantName(packages: LandlordPackage[]): string {
  if (packages.length === 0) return 'Landlord Dashboard – Base'
  
  const hasReminders = packages.includes('rent-reminders')
  const hasCollection = packages.includes('rent-collection')  
  const hasMaintenance = packages.includes('maintenance-management')
  
  if (hasReminders && hasCollection && hasMaintenance) {
    return 'Landlord Dashboard – Full Access'
  }
  
  if (hasReminders && hasCollection) {
    return 'Landlord Dashboard – Reminders + Collection'
  }
  
  if (hasReminders && !hasCollection && !hasMaintenance) {
    return 'Landlord Dashboard – Reminders Only'
  }
  
  if (hasMaintenance && !hasReminders) {
    return 'Landlord Dashboard – Maintenance Only'
  }
  
  return 'Landlord Dashboard – Base'
}