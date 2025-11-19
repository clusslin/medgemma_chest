export default function DonutChart({ data, size = 120, thickness = 20 }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const centerX = size / 2
  const centerY = size / 2
  const radius = (size - thickness) / 2

  let currentAngle = -90 // Start from top

  const calculatePath = (value) => {
    const percentage = (value / total) * 100
    const angle = (percentage / 100) * 360
    const endAngle = currentAngle + angle

    const startX = centerX + radius * Math.cos((currentAngle * Math.PI) / 180)
    const startY = centerY + radius * Math.sin((currentAngle * Math.PI) / 180)
    const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180)
    const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180)

    const largeArc = angle > 180 ? 1 : 0

    const path = [
      `M ${startX} ${startY}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`
    ].join(' ')

    currentAngle = endAngle
    return path
  }

  return (
    <div className="flex items-center space-x-6">
      <svg width={size} height={size} className="transform -rotate-90">
        {data.map((item, index) => (
          <path
            key={index}
            d={calculatePath(item.value)}
            fill="none"
            stroke={item.color}
            strokeWidth={thickness}
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        ))}
      </svg>

      <div className="flex-1">
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-700">{item.label}</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {item.value} ({((item.value / total) * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
