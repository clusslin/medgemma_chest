import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { studiesAPI } from '../services/api'
import dayjs from 'dayjs'

export default function ProcessingList() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['studies', page, statusFilter],
    queryFn: () => studiesAPI.getAll({
      page,
      page_size: 20,
      status: statusFilter || undefined,
    }).then(res => res.data),
    refetchInterval: 3000, // Refresh every 3 seconds
  })

  const getStatusBadge = (status) => {
    const badges = {
      received: 'badge-received',
      queued: 'badge-received',
      processing: 'badge-processing',
      completed: 'badge-completed',
      failed: 'badge-failed',
      sent: 'badge-completed',
    }
    return badges[status] || 'badge-received'
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Processing List</h1>

        <select
          className="input w-48"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
        >
          <option value="">All Status</option>
          <option value="received">Received</option>
          <option value="queued">Queued</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="sent">Sent</option>
        </select>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Study UID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Study Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Received At
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.studies?.map((study) => (
                <tr key={study.id}>
                  <td className="px-6 py-4 text-sm font-mono text-gray-900">
                    {study.study_instance_uid.substring(0, 20)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{study.patient_name}</div>
                    <div className="text-sm text-gray-500">{study.patient_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {study.study_date ? dayjs(study.study_date, 'YYYYMMDD').format('YYYY-MM-DD') : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {study.study_description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${getStatusBadge(study.status)}`}>
                      {study.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {study.received_at ? dayjs(study.received_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 flex items-center justify-between border-t">
          <div className="text-sm text-gray-700">
            Showing page {data?.page} of {Math.ceil(data?.total / data?.page_size)}
            {' '}(Total: {data?.total})
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-secondary disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!data?.studies || data.studies.length < data?.page_size}
              className="btn btn-secondary disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
