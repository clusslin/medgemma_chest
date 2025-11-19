import { useQuery } from '@tanstack/react-query'
import { studiesAPI } from '../services/api'

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['study-stats'],
    queryFn: () => studiesAPI.getStats().then(res => res.data),
    refetchInterval: 5000, // Refresh every 5 seconds
  })

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>
  }

  const statusCards = [
    { name: 'Total Studies', value: stats?.total_studies || 0, color: 'blue' },
    { name: 'Received', value: stats?.received || 0, color: 'indigo' },
    { name: 'Processing', value: stats?.processing || 0, color: 'purple' },
    { name: 'Completed', value: stats?.completed || 0, color: 'green' },
    { name: 'Failed', value: stats?.failed || 0, color: 'red' },
    { name: 'Sent', value: stats?.sent || 0, color: 'gray' },
  ]

  const classificationCards = [
    { name: 'Normal', value: stats?.normal || 0, color: 'green' },
    { name: 'Abnormal', value: stats?.abnormal || 0, color: 'yellow' },
    { name: 'Critical', value: stats?.critical || 0, color: 'orange' },
    { name: 'Emergency', value: stats?.emergency || 0, color: 'red' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Processing Status */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Processing Status</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {statusCards.map((card) => (
            <div key={card.name} className="card">
              <dt className="text-sm font-medium text-gray-500 truncate">{card.name}</dt>
              <dd className={`mt-1 text-3xl font-semibold text-${card.color}-600`}>
                {card.value}
              </dd>
            </div>
          ))}
        </div>
      </div>

      {/* Classification Results */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Classification Results</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {classificationCards.map((card) => (
            <div key={card.name} className="card">
              <dt className="text-sm font-medium text-gray-500 truncate">{card.name}</dt>
              <dd className={`mt-1 text-3xl font-semibold text-${card.color}-600`}>
                {card.value}
              </dd>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
