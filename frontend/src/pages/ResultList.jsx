import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { studiesAPI } from '../services/api'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
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
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Result List</h1>

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

      <div className="space-y-4">
        {data?.studies?.map((study) => (
          <div key={study.id} className="card">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleExpand(study.id)}
            >
              <div className="flex items-center space-x-4 flex-1">
                <button className="text-gray-400">
                  {expandedStudy === study.id ? (
                    <ChevronDownIcon className="h-5 w-5" />
                  ) : (
                    <ChevronRightIcon className="h-5 w-5" />
                  )}
                </button>

                <div className="flex-1 grid grid-cols-5 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Patient</div>
                    <div className="font-medium">{study.patient_name}</div>
                    <div className="text-sm text-gray-500">{study.patient_id}</div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500">Study Date</div>
                    <div className="font-medium">
                      {study.study_date ? dayjs(study.study_date, 'YYYYMMDD').format('YYYY-MM-DD') : '-'}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500">Description</div>
                    <div className="font-medium">{study.study_description}</div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500">Classification</div>
                    <span className={`badge ${getClassificationBadge(study.classification)}`}>
                      {study.classification || 'N/A'}
                    </span>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500">Confidence</div>
                    <div className="font-medium">
                      {study.confidence_score ? `${(study.confidence_score * 100).toFixed(1)}%` : '-'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {expandedStudy === study.id && (
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-1 gap-4">
                  {/* Findings */}
                  {study.findings && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">FINDINGS</h3>
                      <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded">
                        {study.findings}
                      </div>
                    </div>
                  )}

                  {/* Impression */}
                  {study.impression && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">IMPRESSION</h3>
                      <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded">
                        {study.impression}
                      </div>
                    </div>
                  )}

                  {/* Study Information */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">STUDY INFORMATION</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Study UID:</span>
                        <span className="ml-2 font-mono">{study.study_instance_uid}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Accession Number:</span>
                        <span className="ml-2">{study.accession_number || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Patient Age:</span>
                        <span className="ml-2">{study.patient_age || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Patient Sex:</span>
                        <span className="ml-2">{study.patient_sex || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Processed At:</span>
                        <span className="ml-2">
                          {study.processed_at ? dayjs(study.processed_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-6 card">
        <div className="flex items-center justify-between">
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
