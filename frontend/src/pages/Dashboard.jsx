import { useState, useEffect } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { studiesAPI } from '../services/api'
import Loading from '../components/Loading'
import StatCard from '../components/StatCard'
import DonutChart from '../components/DonutChart'
import ProgressBar from '../components/ProgressBar'
import {
  DocumentTextIcon,
  InboxArrowDownIcon,
  CogIcon,
  CheckCircleIcon,
  XCircleIcon,
  PaperAirplaneIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  BoltIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

// Animated number component for smooth value transitions
function AnimatedNumber({ value, className = '' }) {
  const [displayValue, setDisplayValue] = useState(value)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (displayValue !== value) {
      setIsUpdating(true)
      const timer = setTimeout(() => {
        setDisplayValue(value)
        setTimeout(() => setIsUpdating(false), 300)
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [value, displayValue])

  return (
    <span className={`${className} transition-all duration-300 ${isUpdating ? 'scale-105' : ''}`}>
      {displayValue}
    </span>
  )
}

export default function Dashboard() {
  const { data: stats, isLoading, isFetching } = useQuery({
    queryKey: ['study-stats'],
    queryFn: () => studiesAPI.getStats().then(res => res.data),
    refetchInterval: 15000,
    staleTime: 10000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData, // Keep previous data while fetching new data
  })

  // Only show loading on initial load, not on background refetch
  if (isLoading) {
    return <Loading />
  }

  const statusCards = [
    {
      label: 'Total Studies',
      value: stats?.total_studies || 0,
      color: 'blue',
      icon: DocumentTextIcon
    },
    {
      label: 'Received',
      value: stats?.received || 0,
      color: 'indigo',
      icon: InboxArrowDownIcon
    },
    {
      label: 'Processing',
      value: stats?.processing || 0,
      color: 'purple',
      icon: CogIcon
    },
    {
      label: 'Completed',
      value: stats?.completed || 0,
      color: 'green',
      icon: CheckCircleIcon
    },
    {
      label: 'Failed',
      value: stats?.failed || 0,
      color: 'red',
      icon: XCircleIcon
    },
    {
      label: 'Sent',
      value: stats?.sent || 0,
      color: 'gray',
      icon: PaperAirplaneIcon
    },
  ]

  const classificationCards = [
    {
      label: 'Normal',
      value: stats?.normal || 0,
      color: 'green',
      icon: HeartIcon
    },
    {
      label: 'Abnormal',
      value: stats?.abnormal || 0,
      color: 'yellow',
      icon: ExclamationTriangleIcon
    },
    {
      label: 'Critical',
      value: stats?.critical || 0,
      color: 'red',
      icon: ShieldExclamationIcon
    },
    {
      label: 'Emergency',
      value: stats?.emergency || 0,
      color: 'red',
      icon: BoltIcon
    },
  ]

  // Calculate completion rate
  const totalProcessed = (stats?.completed || 0) + (stats?.failed || 0)
  const completionRate = totalProcessed > 0
    ? ((stats?.completed || 0) / totalProcessed * 100).toFixed(1)
    : 0

  // Prepare chart data
  const classificationData = [
    { label: 'Normal', value: stats?.normal || 0, color: 'bg-green-500' },
    { label: 'Abnormal', value: stats?.abnormal || 0, color: 'bg-yellow-500' },
    { label: 'Critical', value: stats?.critical || 0, color: 'bg-orange-500' },
    { label: 'Emergency', value: stats?.emergency || 0, color: 'bg-red-500' }
  ]

  const statusData = [
    { label: 'Received', value: stats?.received || 0, color: 'bg-indigo-500' },
    { label: 'Processing', value: stats?.processing || 0, color: 'bg-purple-500' },
    { label: 'Completed', value: stats?.completed || 0, color: 'bg-green-500' },
    { label: 'Failed', value: stats?.failed || 0, color: 'bg-red-500' },
    { label: 'Sent', value: stats?.sent || 0, color: 'bg-gray-500' }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Real-time overview of your chest X-ray analysis system
            </p>
          </div>
          {isFetching && (
            <div className="flex items-center text-sm text-gray-400 dark:text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
              Updating...
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-gray-800">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Success Rate
            </p>
            <p className="mt-2 text-4xl font-bold text-primary-600 dark:text-primary-400">
              <AnimatedNumber value={completionRate} />%
            </p>
            <div className="mt-3">
              <ProgressBar value={parseFloat(completionRate)} max={100} color="primary" />
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              <AnimatedNumber value={stats?.completed || 0} /> of <AnimatedNumber value={totalProcessed} /> processed successfully
            </p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-gray-800">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Normal Cases
            </p>
            <p className="mt-2 text-4xl font-bold text-green-600 dark:text-green-400">
              <AnimatedNumber value={stats?.normal || 0} />
            </p>
            <div className="mt-3">
              <ProgressBar
                value={stats?.normal || 0}
                max={stats?.total_studies || 1}
                color="green"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              No significant abnormalities detected
            </p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-gray-800">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Urgent Cases
            </p>
            <p className="mt-2 text-4xl font-bold text-red-600 dark:text-red-400">
              <AnimatedNumber value={(stats?.critical || 0) + (stats?.emergency || 0)} />
            </p>
            <div className="mt-3">
              <ProgressBar
                value={(stats?.critical || 0) + (stats?.emergency || 0)}
                max={stats?.total_studies || 1}
                color="red"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Requiring immediate attention
            </p>
          </div>
        </div>
      </div>

      {/* Processing Status with Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Processing Status</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Current system processing statistics</p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {statusCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Status Distribution
          </h3>
          <div className="flex justify-center">
            <DonutChart data={statusData} size={180} thickness={25} />
          </div>
          <div className="mt-4 space-y-2">
            {statusData.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${item.color} mr-2`}></div>
                  <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  <AnimatedNumber value={item.value} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Classification Results with Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Classification Results</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered diagnostic classifications</p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {classificationCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Classification Distribution
          </h3>
          <div className="flex justify-center">
            <DonutChart data={classificationData} size={180} thickness={25} />
          </div>
          <div className="mt-4 space-y-2">
            {classificationData.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${item.color} mr-2`}></div>
                  <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  <AnimatedNumber value={item.value} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="card bg-gray-50 dark:bg-gray-900/50">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              <AnimatedNumber value={stats?.total_studies || 0} />
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              <AnimatedNumber value={stats?.processing || 0} />
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">Active</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              <AnimatedNumber value={stats?.completed || 0} />
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">Done</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              <AnimatedNumber value={stats?.failed || 0} />
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">Failed</p>
          </div>
        </div>
      </div>
    </div>
  )
}
