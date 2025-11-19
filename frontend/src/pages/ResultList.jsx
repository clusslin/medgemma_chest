import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { studiesAPI } from '../services/api'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'
import Pagination from '../components/Pagination'
import { ChevronDownIcon, ChevronRightIcon, FunnelIcon, ClockIcon, DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline'
import dayjs from 'dayjs'

export default function ResultList() {
  const [page, setPage] = useState(1)
  const [classificationFilter, setClassificationFilter] = useState('')
  const [expandedStudy, setExpandedStudy] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['results', page, classificationFilter],
    queryFn: () => studiesAPI.getAll({
      page,
      page_size: 20,
      status: 'completed',
      classification: classificationFilter || undefined,
    }).then(res => res.data),
    refetchInterval: 5000,
  })

  const getClassificationBadge = (classification) => {
    const badges = {
      normal: 'badge-normal',
      abnormal: 'badge-abnormal',
      critical: 'badge-critical',
      emergency: 'badge-emergency',
    }
    return badges[classification?.toLowerCase()] || 'badge-normal'
  }

  const toggleExpand = (studyId) => {
    setExpandedStudy(expandedStudy === studyId ? null : studyId)
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
            <h1 className="text-3xl font-bold text-gray-900">Result List</h1>
            <p className="mt-2 text-sm text-gray-600">
              View and analyze completed diagnostic reports
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              className="input w-48"
              value={classificationFilter}
              onChange={(e) => {
                setClassificationFilter(e.target.value)
                setPage(1)
              }}
            >
              <option value="">All Classifications</option>
              <option value="normal">Normal</option>
              <option value="abnormal">Abnormal</option>
              <option value="critical">Critical</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
        </div>
      </div>

      {/* Auto-refresh indicator */}
      <div className="flex items-center justify-end text-sm text-gray-500">
        <ClockIcon className="h-4 w-4 mr-1" />
        Auto-refreshing every 5 seconds
      </div>

      {/* Results */}
      {!data?.studies || data.studies.length === 0 ? (
        <EmptyState
          icon={DocumentMagnifyingGlassIcon}
          title="No results found"
          description="There are no completed studies matching your current filter."
        />
      ) : (
        <div className="space-y-4">
          {data?.studies?.map((study) => (
            <div key={study.id} className="card hover:shadow-lg transition-shadow">
              {/* Header */}
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleExpand(study.id)}
              >
                <div className="flex items-center space-x-4 flex-1">
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    {expandedStudy === study.id ? (
                      <ChevronDownIcon className="h-5 w-5" />
                    ) : (
                      <ChevronRightIcon className="h-5 w-5" />
                    )}
                  </button>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-5 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Patient</div>
                      <div className="font-medium text-gray-900">{study.patient_name || '-'}</div>
                      <div className="text-sm text-gray-500">{study.patient_id || '-'}</div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Study Date</div>
                      <div className="font-medium text-gray-900">
                        {study.study_date ? dayjs(study.study_date, 'YYYYMMDD').format('MMM DD, YYYY') : '-'}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Description</div>
                      <div className="font-medium text-gray-900 truncate">{study.study_description || '-'}</div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Classification</div>
                      <span className={`badge ${getClassificationBadge(study.classification)}`}>
                        {study.classification || 'N/A'}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Confidence</div>
                      <div className="font-medium text-gray-900">
                        {study.confidence_score ? (
                          <span className="inline-flex items-center">
                            {(study.confidence_score * 100).toFixed(1)}%
                            <div className="ml-2 w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary-600 transition-all duration-300"
                                style={{ width: `${study.confidence_score * 100}%` }}
                              />
                            </div>
                          </span>
                        ) : '-'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedStudy === study.id && (
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-6 animate-slideDown">
                  {/* Findings */}
                  {study.findings && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                        Findings
                      </h3>
                      <div className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg leading-relaxed border border-gray-200">
                        {study.findings}
                      </div>
                    </div>
                  )}

                  {/* Impression */}
                  {study.impression && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                        Impression
                      </h3>
                      <div className="text-sm text-gray-900 bg-blue-50 p-4 rounded-lg leading-relaxed border border-blue-100">
                        {study.impression}
                      </div>
                    </div>
                  )}

                  {/* Study Information */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                      Study Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Study UID</p>
                        <p className="text-sm font-mono text-gray-900 truncate">{study.study_instance_uid}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Accession Number</p>
                        <p className="text-sm text-gray-900">{study.accession_number || '-'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Patient Age</p>
                        <p className="text-sm text-gray-900">{study.patient_age ? `${study.patient_age} years` : '-'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Patient Sex</p>
                        <p className="text-sm text-gray-900">{study.patient_sex || '-'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Processed At</p>
                        <p className="text-sm text-gray-900">
                          {study.processed_at ? dayjs(study.processed_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Modality</p>
                        <p className="text-sm text-gray-900">{study.modality || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Pagination */}
          <div className="card">
            <Pagination
              currentPage={page}
              totalPages={Math.ceil((data?.total || 0) / (data?.page_size || 20))}
              totalItems={data?.total || 0}
              pageSize={data?.page_size || 20}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}
    </div>
  )
}
