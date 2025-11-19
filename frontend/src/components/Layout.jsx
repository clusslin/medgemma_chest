import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  ServerIcon,
  QueueListIcon,
  ChartBarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'DICOM Settings', href: '/dicom-settings', icon: ServerIcon },
  { name: 'Processing List', href: '/processing', icon: QueueListIcon },
  { name: 'Result List', href: '/results', icon: ChartBarIcon },
  { name: 'Prompt Settings', href: '/prompts', icon: DocumentTextIcon },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Layout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex h-16 items-center px-6 border-b">
          <h1 className="text-xl font-bold text-primary-600">MedGemma Chest</h1>
        </div>

        <nav className="mt-6 px-3">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={classNames(
                  isActive
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-50',
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1'
                )}
              >
                <item.icon
                  className={classNames(
                    isActive ? 'text-primary-600' : 'text-gray-400',
                    'mr-3 h-5 w-5'
                  )}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
