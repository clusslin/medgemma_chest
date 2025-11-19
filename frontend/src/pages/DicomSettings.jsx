import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dicomNodesAPI } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SignalIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ServerIcon
} from '@heroicons/react/24/outline'

export default function DicomSettings() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNode, setEditingNode] = useState(null)
  const [testingNodeId, setTestingNodeId] = useState(null)
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

  const testConnectionMutation = useMutation({
    mutationFn: dicomNodesAPI.testConnection,
    onSuccess: () => {
      setTestingNodeId(null)
      toast.success('Connection test successful')
    },
    onError: (error) => {
      setTestingNodeId(null)
      toast.error(`Connection test failed: ${error.response?.data?.detail || error.message}`)
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

  const handleTestConnection = (id) => {
    setTestingNodeId(id)
    testConnectionMutation.mutate(id)
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
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">DICOM Settings</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Manage DICOM nodes for receiving and sending medical images
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => {
                resetForm()
                setIsModalOpen(true)
              }}
              className="btn btn-primary flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add DICOM Node
            </button>
          </div>
        </div>
      </div>

      {/* DICOM Nodes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {nodes.map((node) => (
          <div key={node.id} className="card hover:shadow-xl transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {node.ae_title}
                  </h3>
                  <span className={`badge ${getNodeTypeBadge(node.node_type)}`}>
                    {node.node_type}
                  </span>
                  <span className={`badge ${node.is_active ? 'badge-completed' : 'badge-failed'}`}>
                    {node.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {node.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{node.description}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">IP Address</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{node.ip_address}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Port</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{node.port}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handleTestConnection(node.id)}
                disabled={testingNodeId === node.id}
                className="btn btn-sm btn-secondary flex items-center space-x-2"
              >
                {testingNodeId === node.id ? (
                  <>
                    <div className="spinner text-primary-600"></div>
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <SignalIcon className="h-4 w-4" />
                    <span>Test Connection</span>
                  </>
                )}
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEdit(node)}
                  className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                  title="Edit node"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(node.id)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  title="Delete node"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {nodes.length === 0 && (
        <div className="card text-center py-12">
          <ServerIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No DICOM nodes</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by adding your first DICOM node.
          </p>
          <div className="mt-6">
            <button
              onClick={() => {
                resetForm()
                setIsModalOpen(true)
              }}
              className="btn btn-primary inline-flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add DICOM Node
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 animate-slideUp">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
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
