import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Plus, Users } from 'lucide-react'
import { LandlordTopNav } from './LandlordTopNav'
import AddManagerModal from './AddManagerModal'
import EditManagerModal from './EditManagerModal'
import axios from '@/services/axios-instance'
import { toast } from 'sonner'

interface LandlordFacilityManagersProps {
  onBack?: () => void
  onMenuClick?: () => void
  isMobile?: boolean
}

interface FacilityManager {
  id: string
  name: string
  phone_number: string
  email: string
  role: string
  date: string
}

export default function LandlordFacilityManagers({
  onBack,
  onMenuClick,
  isMobile = false
}: LandlordFacilityManagersProps) {
  const [managers, setManagers] = useState<FacilityManager[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedManager, setSelectedManager] = useState<FacilityManager | null>(null)
  const [loading, setLoading] = useState(true)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const fetchManagers = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/users/team-members', {
        withCredentials: true
      })
      // Ensure we have an array, handle different response structures
      const data = Array.isArray(response.data) ? response.data : []
      console.log('Team members response:', response.data)
      setManagers(data)
    } catch (error) {
      console.error('Error fetching team members:', error)
      toast.error('Failed to load facility managers')
      setManagers([]) // Ensure managers is an empty array on error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchManagers()
  }, [])

  const handleAddManager = async (name: string, phone: string) => {
    try {
      const [first_name, last_name] = name.split(' ')
      await axios.post('/users/assign-collaborator', {
        first_name: first_name || name,
        last_name: last_name || '',
        phone_number: phone,
        email: `fm_${Date.now()}@temp.facility`,
        role: 'facility_manager',
        permissions: []
      }, {
        withCredentials: true
      })
      toast.success('Facility manager added successfully')
      fetchManagers()
    } catch (error: unknown) {
      console.error('Error adding manager:', error)
      const message = error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data ? String(error.response.data.message) : 'Failed to add facility manager'
      toast.error(message)
    }
  }

  const handleEditManager = async (id: string, name: string, phone: string) => {
    try {
      await axios.put(`/users/team-members/${id}`, {
        name,
        phone
      }, {
        withCredentials: true
      })
      toast.success('Facility manager updated successfully')
      fetchManagers()
    } catch (error: unknown) {
      console.error('Error updating manager:', error)
      const message = error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data ? String(error.response.data.message) : 'Failed to update facility manager'
      toast.error(message)
    }
  }

  const handleDeleteManager = async (id: string) => {
    try {
      await axios.delete(`/users/team-members/${id}`, {
        withCredentials: true
      })
      toast.success('Facility manager deleted successfully')
      fetchManagers()
    } catch (error: unknown) {
      console.error('Error deleting manager:', error)
      const message = error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data ? String(error.response.data.message) : 'Failed to delete facility manager'
      toast.error(message)
    }
  }

  const handleRowClick = (manager: FacilityManager) => {
    setSelectedManager(manager)
    setShowEditModal(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <LandlordTopNav
        title="Facility Managers"
        onBack={onBack}
        onAddFacilityManager={() => setShowAddModal(true)}
        onMenuClick={onMenuClick}
        isMobile={isMobile}
      />

      {/* Main Content */}
      <div className="pt-[73px] lg:pt-[81px] px-6 py-6">
        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-xl p-12 shadow-sm text-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : managers.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-xl p-12 shadow-sm text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg text-gray-900 mb-2">No facility managers added yet.</h3>
            <p className="text-gray-500 mb-6">Add your first facility manager to get started.</p>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-[#FF5000] hover:bg-[#E64500] text-white rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Manager
            </Button>
          </div>
        ) : (
          /* Table */
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-4 px-6 text-sm text-gray-600">Name</th>
                  <th className="text-left py-4 px-6 text-sm text-gray-600">Phone Number</th>
                  <th className="text-left py-4 px-6 text-sm text-gray-600">Date Added</th>
                </tr>
              </thead>
              <tbody>
                {managers.map((manager) => (
                  <tr
                    key={manager.id}
                    onClick={() => handleRowClick(manager)}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="py-4 px-6 text-gray-900">{manager.name}</td>
                    <td className="py-4 px-6 text-gray-900">{manager.phone_number}</td>
                    <td className="py-4 px-6 text-gray-600">{formatDate(manager.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddManagerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddManager}
      />

      {selectedManager && (
        <EditManagerModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedManager(null)
          }}
          manager={selectedManager}
          onEdit={handleEditManager}
          onDelete={handleDeleteManager}
        />
      )}
    </div>
  )
}
