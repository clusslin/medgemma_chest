import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { studiesAPI } from '../services/api'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'
import Pagination from '../components/Pagination'
import { FunnelIcon, ClockIcon } from '@heroicons/react/24/outline'
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
      queued: 'badge-queued',
      processing: 'badge-processing',
      completed: 'badge-completed',
      failed: 'badge-failed',
      sent: 'badge-sent',
    }
    return badges[status] || 'badge-received'
  }

  if (isLoading) {
    return <Loading />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Processing List</h1>
            <p className="mt-2 text-sm text-gray-600">
              Monitor the processing status of all studies
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
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
        </div>
      </div>

      {/* Auto-refresh indicator */}
      <div className="flex items-center justify-end text-sm text-gray-500">
        <ClockIcon className="h-4 w-4 mr-1" />
        Auto-refreshing every 3 seconds
      </div>

      {/* Table */}
      {!data?.studies || data.studies.length === 0 ? (
        <EmptyState
          title="No studies found"
          description="There are no studies matching your current filter."
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Study UID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Study Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Received At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.studies?.map((study) => (
                  <tr key={study.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-mono text-gray-900 truncate max-w-xs">
                        {study.study_instance_uid}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{study.patient_name || '-'}</div>
                      <div className="text-xs text-gray-500">{study.patient_id || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {study.study_date ? dayjs(study.study_date, 'YYYYMMDD').format('YYYY-MM-DD') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {study.study_description || '-'}
                      </div>
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
          <Pagination
            currentPage={page}
            totalPages={Math.ceil((data?.total || 0) / (data?.page_size || 20))}
            totalItems={data?.total || 0}
            pageSize={data?.page_size || 20}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  )
}
