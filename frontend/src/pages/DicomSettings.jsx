import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dicomNodesAPI } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

export default function DicomSettings() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNode, setEditingNode] = useState(null)
  const [formData, setFormData] = useState({
    ae_title: '',
    ip_address: '',
    port: '',
    node_type: 'source',
    description: '',
    is_active: true,
  })

  const { data: nodes = [], isLoading } = useQuery({
    queryKey: ['dicom-nodes'],
    queryFn: () => dicomNodesAPI.getAll().then(res => res.data),
  })

  const createMutation = useMutation({
    mutationFn: dicomNodesAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['dicom-nodes'])
      setIsModalOpen(false)
      resetForm()
      toast.success('DICOM node created successfully')
    },
    onError: (error) => {
      toast.error(`Failed to create DICOM node: ${error.message}`)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => dicomNodesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['dicom-nodes'])
      setIsModalOpen(false)
      resetForm()
      toast.success('DICOM node updated successfully')
    },
    onError: (error) => {
      toast.error(`Failed to update DICOM node: ${error.message}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: dicomNodesAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['dicom-nodes'])
      toast.success('DICOM node deleted successfully')
    },
    onError: (error) => {
      toast.error(`Failed to delete DICOM node: ${error.message}`)
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      ...formData,
      port: parseInt(formData.port),
    }

    if (editingNode) {
      updateMutation.mutate({ id: editingNode.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleEdit = (node) => {
    setEditingNode(node)
    setFormData({
      ae_title: node.ae_title,
      ip_address: node.ip_address,
      port: node.port.toString(),
      node_type: node.node_type,
      description: node.description || '',
      is_active: node.is_active,
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this DICOM node?')) {
      deleteMutation.mutate(id)
    }
  }

  const resetForm = () => {
    setEditingNode(null)
    setFormData({
      ae_title: '',
      ip_address: '',
      port: '',
      node_type: 'source',
      description: '',
      is_active: true,
    })
  }

  const getNodeTypeBadge = (type) => {
    const colors = {
      local: 'bg-blue-100 text-blue-800',
      source: 'bg-green-100 text-green-800',
      destination: 'bg-purple-100 text-purple-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">DICOM Settings</h1>
        <button
          onClick={() => {
            resetForm()
            setIsModalOpen(true)
          }}
          className="btn btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Node
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  AE Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Port
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {nodes.map((node) => (
                <tr key={node.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {node.ae_title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {node.ip_address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {node.port}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${getNodeTypeBadge(node.node_type)}`}>
                      {node.node_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${node.is_active ? 'badge-completed' : 'badge-failed'}`}>
                      {node.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleEdit(node)}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(node.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingNode ? 'Edit DICOM Node' : 'Add DICOM Node'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    AE Title
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.ae_title}
                    onChange={(e) => setFormData({ ...formData, ae_title: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IP Address
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.ip_address}
                    onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Port
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Node Type
                  </label>
                  <select
                    className="input"
                    value={formData.node_type}
                    onChange={(e) => setFormData({ ...formData, node_type: e.target.value })}
                  >
                    <option value="local">Local</option>
                    <option value="source">Source (Receive From)</option>
                    <option value="destination">Destination (Send To)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="input"
                    rows="2"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    resetForm()
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingNode ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
