import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { promptsAPI } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { PlusIcon, PencilIcon, TrashIcon, StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

export default function PromptSettings() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template_type: 'system',
    prompt_text: '',
    display_order: 0,
    is_active: true,
    is_default: false,
  })

  const { data: prompts = [], isLoading } = useQuery({
    queryKey: ['prompts'],
    queryFn: () => promptsAPI.getAll().then(res => res.data),
  })

  const createMutation = useMutation({
    mutationFn: promptsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['prompts'])
      setIsModalOpen(false)
      resetForm()
      toast.success('Prompt template created successfully')
    },
    onError: (error) => {
      toast.error(`Failed to create prompt template: ${error.message}`)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => promptsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['prompts'])
      setIsModalOpen(false)
      resetForm()
      toast.success('Prompt template updated successfully')
    },
    onError: (error) => {
      toast.error(`Failed to update prompt template: ${error.message}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: promptsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['prompts'])
      toast.success('Prompt template deleted successfully')
    },
    onError: (error) => {
      toast.error(`Failed to delete prompt template: ${error.message}`)
    },
  })

  const setDefaultMutation = useMutation({
    mutationFn: promptsAPI.setDefault,
    onSuccess: () => {
      queryClient.invalidateQueries(['prompts'])
      toast.success('Default prompt template updated')
    },
    onError: (error) => {
      toast.error(`Failed to set default prompt template: ${error.message}`)
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      ...formData,
      display_order: parseInt(formData.display_order),
    }

    if (editingPrompt) {
      updateMutation.mutate({ id: editingPrompt.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleEdit = (prompt) => {
    setEditingPrompt(prompt)
    setFormData({
      name: prompt.name,
      description: prompt.description || '',
      template_type: prompt.template_type,
      prompt_text: prompt.prompt_text,
      display_order: prompt.display_order,
      is_active: prompt.is_active,
      is_default: prompt.is_default,
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this prompt template?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleSetDefault = (id) => {
    setDefaultMutation.mutate(id)
  }

  const resetForm = () => {
    setEditingPrompt(null)
    setFormData({
      name: '',
      description: '',
      template_type: 'system',
      prompt_text: '',
      display_order: 0,
      is_active: true,
      is_default: false,
    })
  }

  const getTypeBadge = (type) => {
    const colors = {
      system: 'bg-blue-100 text-blue-800',
      findings: 'bg-green-100 text-green-800',
      impression: 'bg-purple-100 text-purple-800',
      classification: 'bg-orange-100 text-orange-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Prompt Settings</h1>
        <button
          onClick={() => {
            resetForm()
            setIsModalOpen(true)
          }}
          className="btn btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Prompt
        </button>
      </div>

      <div className="space-y-4">
        {prompts.map((prompt) => (
          <div key={prompt.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{prompt.name}</h3>
                  <span className={`badge ${getTypeBadge(prompt.template_type)}`}>
                    {prompt.template_type}
                  </span>
                  {prompt.is_default && (
                    <span className="flex items-center text-yellow-600 text-sm">
                      <StarIconSolid className="h-4 w-4 mr-1" />
                      Default
                    </span>
                  )}
                  <span className={`badge ${prompt.is_active ? 'badge-completed' : 'badge-failed'}`}>
                    {prompt.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {prompt.description && (
                  <p className="text-sm text-gray-600 mb-3">{prompt.description}</p>
                )}

                <div className="bg-gray-50 p-4 rounded text-sm font-mono text-gray-700 max-h-32 overflow-y-auto">
                  {prompt.prompt_text}
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                {!prompt.is_default && (
                  <button
                    onClick={() => handleSetDefault(prompt.id)}
                    className="text-yellow-600 hover:text-yellow-900"
                    title="Set as default"
                  >
                    <StarIcon className="h-5 w-5" />
                  </button>
                )}
                <button
                  onClick={() => handleEdit(prompt)}
                  className="text-primary-600 hover:text-primary-900"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(prompt.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              {editingPrompt ? 'Edit Prompt Template' : 'Add Prompt Template'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Type
                  </label>
                  <select
                    className="input"
                    value={formData.template_type}
                    onChange={(e) => setFormData({ ...formData, template_type: e.target.value })}
                  >
                    <option value="system">System</option>
                    <option value="findings">Findings</option>
                    <option value="impression">Impression</option>
                    <option value="classification">Classification</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prompt Text
                  </label>
                  <textarea
                    className="input font-mono text-sm"
                    rows="10"
                    value={formData.prompt_text}
                    onChange={(e) => setFormData({ ...formData, prompt_text: e.target.value })}
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Use variables like {'{patient_age}'}, {'{patient_sex}'}, {'{study_description}'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                  />
                </div>

                <div className="flex items-center space-x-4">
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

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_default"
                      checked={formData.is_default}
                      onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_default" className="ml-2 block text-sm text-gray-900">
                      Set as Default
                    </label>
                  </div>
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
                  {editingPrompt ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
