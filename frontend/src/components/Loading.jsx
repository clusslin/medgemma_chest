export default function Loading({ fullScreen = false, text = "Loading..." }) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 bg-opacity-90 dark:bg-opacity-90 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="spinner spinner-lg text-primary-600 dark:text-primary-400 mb-4 mx-auto"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{text}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="spinner spinner-lg text-primary-600 dark:text-primary-400 mb-4 mx-auto"></div>
        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{text}</p>
      </div>
    </div>
  )
}
