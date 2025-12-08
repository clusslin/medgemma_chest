import { useEffect, useState } from 'react'

export default function StatCard({ label, value, icon: Icon, color = 'blue', trend }) {
  const [displayValue, setDisplayValue] = useState(value)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (displayValue !== value) {
      setIsUpdating(true)
      // Smooth number transition
      const timer = setTimeout(() => {
        setDisplayValue(value)
        setIsUpdating(false)
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [value, displayValue])

  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
    green: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
    yellow: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30',
    red: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
    purple: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30',
    indigo: 'text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30',
    gray: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30',
  }

  return (
    <div className="card">
      <div className="flex items-center">
        {Icon && (
          <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
        <div className={Icon ? 'ml-4' : ''}>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
          <div className="flex items-baseline">
            <p
              className={`text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1 transition-all duration-300 ${
                isUpdating ? 'scale-105 text-primary-600 dark:text-primary-400' : ''
              }`}
            >
              {displayValue}
            </p>
            {trend && (
              <span className={`ml-2 text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
