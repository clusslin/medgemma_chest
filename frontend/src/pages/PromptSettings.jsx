import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { promptsAPI } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { PlusIcon, PencilIcon, TrashIcon, StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid, DocumentTextIcon } from '@heroicons/react/24/solid'

export default function PromptSettings() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    system_prompt: '',
    user_prompt_template: '',
    temperature: 0.7,
    max_tokens: 2048,
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
      temperature: parseFloat(formData.temperature),
      max_tokens: parseInt(formData.max_tokens),
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
      system_prompt: prompt.system_prompt,
      user_prompt_template: prompt.user_prompt_template,
      temperature: prompt.temperature,
      max_tokens: prompt.max_tokens,
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
      system_prompt: '',
      user_prompt_template: '',
      temperature: 0.7,
      max_tokens: 2048,
      is_active: true,
      is_default: false,
    })
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Prompt Settings</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Manage AI prompt templates for medical image analysis
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
              Add Prompt Template
            </button>
          </div>
        </div>
      </div>

      {/* Prompts List */}
      <div className="space-y-4">
        {prompts.map((prompt) => (
          <div key={prompt.id} className="card hover:shadow-xl transition-all duration-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center flex-wrap gap-2 mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{prompt.name}</h3>
                  {prompt.is_default && (
                    <span className="flex items-center text-yellow-600 dark:text-yellow-500 text-sm font-medium">
                      <StarIconSolid className="h-4 w-4 mr-1" />
                      Default
                    </span>
                  )}
                  <span className={`badge ${prompt.is_active ? 'badge-completed' : 'badge-failed'}`}>
                    {prompt.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    T: {prompt.temperature} | Max: {prompt.max_tokens}
                  </span>
                </div>

                {prompt.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{prompt.description}</p>
                )}

                <div className="space-y-3">
                  {/* System Prompt */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        System Prompt
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {prompt.system_prompt.length} characters
                      </span>
                    </div>
                    <div className="text-sm font-mono text-gray-700 dark:text-gray-300 max-h-32 overflow-y-auto whitespace-pre-wrap">
                      {prompt.system_prompt}
                    </div>
                  </div>

                  {/* User Prompt Template */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        User Prompt Template
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {prompt.user_prompt_template.length} characters
                      </span>
                    </div>
                    <div className="text-sm font-mono text-gray-700 dark:text-gray-300 max-h-32 overflow-y-auto whitespace-pre-wrap">
                      {prompt.user_prompt_template}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center space-y-2 ml-4">
                {!prompt.is_default && (
                  <button
                    onClick={() => handleSetDefault(prompt.id)}
                    className="p-2 text-yellow-600 dark:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-lg transition-colors"
                    title="Set as default"
                  >
                    <StarIcon className="h-5 w-5" />
                  </button>
                )}
                <button
                  onClick={() => handleEdit(prompt)}
                  className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                  title="Edit prompt"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(prompt.id)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  title="Delete prompt"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {prompts.length === 0 && (
        <div className="card text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No prompt templates</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating your first AI prompt template.
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
              Add Prompt Template
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto animate-slideUp">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              {editingPrompt ? 'Edit Prompt Template' : 'Add Prompt Template'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      System Prompt
                    </label>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formData.system_prompt.length} characters
                    </span>
                  </div>
                  <textarea
                    className="input font-mono text-sm"
                    rows="6"
                    value={formData.system_prompt}
                    onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                    required
                    placeholder="Enter the system prompt that defines the AI's role and behavior..."
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    The system prompt defines the AI's role, expertise, and behavior context.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      User Prompt Template
                    </label>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formData.user_prompt_template.length} characters
                    </span>
                  </div>
                  <textarea
                    className="input font-mono text-sm"
                    rows="6"
                    value={formData.user_prompt_template}
                    onChange={(e) => setFormData({ ...formData, user_prompt_template: e.target.value })}
                    required
                    placeholder="Enter the user prompt template with variable placeholders..."
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-200 dark:border-blue-800">
                    <span className="font-medium">Available variables:</span> {'{patient_age}'}, {'{patient_sex}'}, {'{study_description}'}, {'{patient_name}'}, {'{patient_id}'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Temperature
                    </label>
                    <input
                      type="number"
                      className="input"
                      min="0"
                      max="2"
                      step="0.1"
                      value={formData.temperature}
                      onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Controls randomness (0-2). Lower is more focused.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Max Tokens
                    </label>
                    <input
                      type="number"
                      className="input"
                      min="1"
                      max="8192"
                      step="1"
                      value={formData.max_tokens}
                      onChange={(e) => setFormData({ ...formData, max_tokens: e.target.value })}
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Maximum response length (1-8192 tokens).
                    </p>
                  </div>
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
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
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
                    <label htmlFor="is_default" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
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
