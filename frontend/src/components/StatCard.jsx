export default function StatCard({ label, value, icon: Icon, color = 'blue', trend }) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    red: 'text-red-600 bg-red-100',
    purple: 'text-purple-600 bg-purple-100',
    indigo: 'text-indigo-600 bg-indigo-100',
    gray: 'text-gray-600 bg-gray-100',
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
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <div className="flex items-baseline">
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
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
