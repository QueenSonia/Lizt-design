/* eslint-disable */
import { useState } from 'react'
import { ArrowLeft, ChevronDown, ChevronUp, FileText, Phone, Mail, MapPin, User, Calendar, Building, DollarSign, Shield, Users, FileCheck } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible'

// Mock KYC data for tenants
const mockKYCData = {
  1: {
    id: 1,
    tenantName: 'Sarah Chen',
    dateSubmitted: '2024-11-15',
    personalInfo: {
      fullName: 'Sarah Chen',
      phone: '+1 (555) 123-4567',
      email: 'sarah.chen@email.com',
      dateOfBirth: '1992-03-15',
      nationality: 'American',
      stateOfOrigin: 'California',
      lga: 'Los Angeles County',
      religion: 'Christian',
      maritalStatus: 'Single',
      numberOfChildren: 0,
      spouseContact: null,
      nextOfKinName: 'Michael Chen',
      nextOfKinContact: '+1 (555) 987-6543',
      idUpload: 'drivers_license.pdf'
    },
    employment: {
      occupation: 'Software Engineer',
      employerName: 'Tech Solutions Inc.',
      jobTitle: 'Senior Frontend Developer',
      employerAddress: '123 Tech Street, San Francisco, CA 94105',
      employerPhone: '+1 (555) 456-7890',
      monthlyNetIncome: 8500,
      otherIncome: 'Freelance consulting - $2,000/month',
      proofOfEmployment: 'employment_letter.pdf'
    },
    residence: {
      currentAddress: '456 Oak Avenue, Apartment 3B, Los Angeles, CA 90210',
      durationOfStay: '2 years',
      reasonForLeaving: 'Relocation for new job opportunity',
      previousLandlordName: 'John Smith',
      previousLandlordContact: '+1 (555) 321-0987',
      spaceType: 'Residential'
    },
    references: {
      reference1: {
        name: 'Emily Johnson',
        relationship: 'Colleague',
        address: '789 Pine Street, San Francisco, CA 94102',
        phone: '+1 (555) 234-5678'
      },
      reference2: {
        name: 'David Rodriguez',
        relationship: 'Friend',
        address: '321 Maple Drive, Los Angeles, CA 90211',
        phone: '+1 (555) 345-6789'
      }
    },
    declaration: {
      understands: true,
      signature: 'signature_sarah_chen.png',
      dateSubmitted: '2024-11-15'
    }
  },
  3: {
    id: 3,
    tenantName: 'Emily Johnson',
    dateSubmitted: '2024-10-20',
    personalInfo: {
      fullName: 'Emily Johnson',
      phone: '+1 (555) 456-7890',
      email: 'emily.johnson@email.com',
      dateOfBirth: '1988-07-22',
      nationality: 'Canadian',
      stateOfOrigin: 'Ontario',
      lga: 'Toronto',
      religion: 'Catholic',
      maritalStatus: 'Married',
      numberOfChildren: 2,
      spouseContact: '+1 (555) 678-9012',
      nextOfKinName: 'Robert Johnson',
      nextOfKinContact: '+1 (555) 789-0123',
      idUpload: 'passport.pdf'
    },
    employment: {
      occupation: 'Marketing Manager',
      employerName: 'Global Marketing Ltd.',
      jobTitle: 'Senior Marketing Manager',
      employerAddress: '555 Business Ave, Toronto, ON M5V 3A8',
      employerPhone: '+1 (555) 890-1234',
      monthlyNetIncome: 6800,
      otherIncome: 'Investment dividends - $500/month',
      proofOfEmployment: 'employment_contract.pdf'
    },
    residence: {
      currentAddress: '123 Elm Street, Unit 7A, Toronto, ON M4W 1A1',
      durationOfStay: '3 years',
      reasonForLeaving: 'Family expansion, need more space',
      previousLandlordName: 'Maria Garcia',
      previousLandlordContact: '+1 (555) 012-3456',
      spaceType: 'Residential'
    },
    references: {
      reference1: {
        name: 'James Wilson',
        relationship: 'Supervisor',
        address: '777 Corporate Blvd, Toronto, ON M5H 2M7',
        phone: '+1 (555) 123-4567'
      },
      reference2: {
        name: 'Lisa Thompson',
        relationship: 'Neighbor',
        address: '125 Elm Street, Toronto, ON M4W 1A1',
        phone: '+1 (555) 234-5678'
      }
    },
    declaration: {
      understands: true,
      signature: 'signature_emily_johnson.png',
      dateSubmitted: '2024-10-20'
    }
  }
}

interface KYCDetailsProps {
  tenantId: string | null
  onBack: () => void
}

export function KYCDetails({ tenantId, onBack }: KYCDetailsProps) {
  const [openSections, setOpenSections] = useState<string[]>(['personal', 'employment', 'residence', 'references', 'declaration'])

  if (!tenantId || !mockKYCData[tenantId as unknown as keyof typeof mockKYCData]) {
    return (
      <div className="p-6">
        <Button onClick={onBack} variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tenant Details
        </Button>
        <div className="text-center text-gray-500">KYC details not found</div>
      </div>
    )
  }

  const kycData = mockKYCData[tenantId as unknown as keyof typeof mockKYCData]

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Button onClick={onBack} variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tenant Details
            </Button>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
              <FileCheck className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-gray-900 mb-2">KYC Form Details</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Tenant: {kycData.tenantName}</span>
                <span>•</span>
                <span>Submitted: {formatDate(kycData.dateSubmitted)}</span>
                <Badge className="bg-green-100 text-green-800">Verified</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Personal Information */}
        <Card>
          <Collapsible open={openSections.includes('personal')} onOpenChange={() => toggleSection('personal')}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-blue-600" />
                    <CardTitle>Personal Information</CardTitle>
                  </div>
                  {openSections.includes('personal') ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="text-gray-500">Full Name</label>
                    <p className="text-gray-900">{kycData.personalInfo.fullName}</p>
                  </div>
                  <div>
                    <label className="text-gray-500">Phone</label>
                    <p className="text-gray-900 flex items-center">
                      <Phone className="w-4 h-4 mr-1" />
                      {kycData.personalInfo.phone}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-500">Email</label>
                    <p className="text-gray-900 flex items-center">
                      <Mail className="w-4 h-4 mr-1" />
                      {kycData.personalInfo.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-500">Date of Birth</label>
                    <p className="text-gray-900 flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(kycData.personalInfo.dateOfBirth)}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-500">Nationality</label>
                    <p className="text-gray-900">{kycData.personalInfo.nationality}</p>
                  </div>
                  <div>
                    <label className="text-gray-500">State of Origin</label>
                    <p className="text-gray-900">{kycData.personalInfo.stateOfOrigin}</p>
                  </div>
                  <div>
                    <label className="text-gray-500">LGA</label>
                    <p className="text-gray-900">{kycData.personalInfo.lga}</p>
                  </div>
                  <div>
                    <label className="text-gray-500">Religion</label>
                    <p className="text-gray-900">{kycData.personalInfo.religion}</p>
                  </div>
                  <div>
                    <label className="text-gray-500">Marital Status</label>
                    <p className="text-gray-900">{kycData.personalInfo.maritalStatus}</p>
                  </div>
                  <div>
                    <label className="text-gray-500">Number of Children</label>
                    <p className="text-gray-900">{kycData.personalInfo.numberOfChildren}</p>
                  </div>
                  {kycData.personalInfo.spouseContact && (
                    <div>
                      <label className="text-gray-500">Spouse's Contact</label>
                      <p className="text-gray-900">{kycData.personalInfo.spouseContact}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-gray-500">Next of Kin Name</label>
                    <p className="text-gray-900">{kycData.personalInfo.nextOfKinName}</p>
                  </div>
                  <div>
                    <label className="text-gray-500">Next of Kin Contact</label>
                    <p className="text-gray-900">{kycData.personalInfo.nextOfKinContact}</p>
                  </div>
                  <div>
                    <label className="text-gray-500">Means of ID</label>
                    <Button variant="outline" size="sm" className="mt-1">
                      <FileText className="w-4 h-4 mr-2" />
                      View {kycData.personalInfo.idUpload}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Employment & Income */}
        <Card>
          <Collapsible open={openSections.includes('employment')} onOpenChange={() => toggleSection('employment')}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Building className="w-5 h-5 text-purple-600" />
                    <CardTitle>Employment &amp; Income</CardTitle>
                  </div>
                  {openSections.includes('employment') ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-gray-500">Occupation</label>
                    <p className="text-gray-900">{kycData.employment.occupation}</p>
                  </div>
                  <div>
                    <label className="text-gray-500">Employer Name</label>
                    <p className="text-gray-900">{kycData.employment.employerName}</p>
                  </div>
                  <div>
                    <label className="text-gray-500">Job Title</label>
                    <p className="text-gray-900">{kycData.employment.jobTitle}</p>
                  </div>
                  <div>
                    <label className="text-gray-500">Monthly Net Income</label>
                    <p className="text-gray-900 flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      {formatCurrency(kycData.employment.monthlyNetIncome)}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-gray-500">Employer Address</label>
                    <p className="text-gray-900 flex items-center">
                      <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                      {kycData.employment.employerAddress}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-500">Employer Phone</label>
                    <p className="text-gray-900 flex items-center">
                      <Phone className="w-4 h-4 mr-1" />
                      {kycData.employment.employerPhone}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-500">Other Sources of Income</label>
                    <p className="text-gray-900">{kycData.employment.otherIncome}</p>
                  </div>
                  <div>
                    <label className="text-gray-500">Proof of Employment</label>
                    <Button variant="outline" size="sm" className="mt-1">
                      <FileText className="w-4 h-4 mr-2" />
                      View {kycData.employment.proofOfEmployment}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Current and Previous Residence */}
        <Card>
          <Collapsible open={openSections.includes('residence')} onOpenChange={() => toggleSection('residence')}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-green-600" />
                    <CardTitle>Current and Previous Residence</CardTitle>
                  </div>
                  {openSections.includes('residence') ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-gray-500">Current Address</label>
                    <p className="text-gray-900">{kycData.residence.currentAddress}</p>
                  </div>
                  <div>
                    <label className="text-gray-500">Duration of Stay</label>
                    <p className="text-gray-900">{kycData.residence.durationOfStay}</p>
                  </div>
                  <div>
                    <label className="text-gray-500">Space Type</label>
                    <div className="mt-1">
                      <Badge className="bg-blue-100 text-blue-800">{kycData.residence.spaceType}</Badge>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-gray-500">Reason for Leaving</label>
                    <p className="text-gray-900">{kycData.residence.reasonForLeaving}</p>
                  </div>
                  <div>
                    <label className="text-gray-500">Previous Landlord Name</label>
                    <p className="text-gray-900">{kycData.residence.previousLandlordName}</p>
                  </div>
                  <div>
                    <label className="text-gray-500">Previous Landlord Contact</label>
                    <p className="text-gray-900 flex items-center">
                      <Phone className="w-4 h-4 mr-1" />
                      {kycData.residence.previousLandlordContact}
                    </p>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* References / Guarantors */}
        <Card>
          <Collapsible open={openSections.includes('references')} onOpenChange={() => toggleSection('references')}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-orange-600" />
                    <CardTitle>References / Guarantors</CardTitle>
                  </div>
                  {openSections.includes('references') ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-8">
                  {/* Reference 1 */}
                  <div>
                    <h4 className="text-gray-900 mb-4">Reference 1</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-gray-500">Name</label>
                        <p className="text-gray-900">{kycData.references.reference1.name}</p>
                      </div>
                      <div>
                        <label className="text-gray-500">Relationship</label>
                        <p className="text-gray-900">{kycData.references.reference1.relationship}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-gray-500">Address</label>
                        <p className="text-gray-900">{kycData.references.reference1.address}</p>
                      </div>
                      <div>
                        <label className="text-gray-500">Phone</label>
                        <p className="text-gray-900 flex items-center">
                          <Phone className="w-4 h-4 mr-1" />
                          {kycData.references.reference1.phone}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Reference 2 */}
                  <div>
                    <h4 className="text-gray-900 mb-4">Reference 2</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-gray-500">Name</label>
                        <p className="text-gray-900">{kycData.references.reference2.name}</p>
                      </div>
                      <div>
                        <label className="text-gray-500">Relationship</label>
                        <p className="text-gray-900">{kycData.references.reference2.relationship}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-gray-500">Address</label>
                        <p className="text-gray-900">{kycData.references.reference2.address}</p>
                      </div>
                      <div>
                        <label className="text-gray-500">Phone</label>
                        <p className="text-gray-900 flex items-center">
                          <Phone className="w-4 h-4 mr-1" />
                          {kycData.references.reference2.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Declaration */}
        <Card>
          <Collapsible open={openSections.includes('declaration')} onOpenChange={() => toggleSection('declaration')}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-red-600" />
                    <CardTitle>Declaration</CardTitle>
                  </div>
                  {openSections.includes('declaration') ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-900 leading-relaxed">
                      I understand that the submission of this KYC form and all supporting documents does not guarantee automatic approval of my tenancy application. The property management company reserves the right to verify all information provided and may request additional documentation or clarification as needed. I confirm that all information provided is accurate and complete to the best of my knowledge.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-gray-500">Digital Signature</label>
                      <div className="mt-2 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-600">{kycData.declaration.signature}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-gray-500">Date Submitted</label>
                      <p className="text-gray-900 mt-2 flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(kycData.declaration.dateSubmitted)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>
    </div>
  )
}