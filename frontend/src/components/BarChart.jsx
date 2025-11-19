export default function BarChart({ data, height = 200, showValues = true }) {
  const maxValue = Math.max(...data.map(item => item.value))

  return (
    <div className="space-y-4">
      {data.map((item, index) => {
        const percentage = (item.value / maxValue) * 100

        return (
          <div key={index} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
              {showValues && (
                <span className="text-sm font-bold text-gray-900">{item.value}</span>
              )}
            </div>
            <div className="relative w-full bg-gray-200 rounded-full h-8 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out flex items-center px-3"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: item.color || '#3b82f6'
                }}
              >
                <span className="text-xs font-medium text-white">
                  {percentage.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
