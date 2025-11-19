import { InboxIcon } from '@heroicons/react/24/outline'

export default function EmptyState({
  icon: Icon = InboxIcon,
  title = "No data",
  description = "Get started by adding a new item.",
  action
}) {
  return (
    <div className="text-center py-12">
      <Icon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-4 text-sm font-medium text-gray-900">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-gray-500">{description}</p>
      )}
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  )
}
