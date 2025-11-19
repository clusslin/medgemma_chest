import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  ServerIcon,
  QueueListIcon,
  ChartBarIcon,
  DocumentTextIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline'
import { useTheme } from '../contexts/ThemeContext'

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
  const { isDark, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">MedGemma Chest</h1>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <SunIcon className="h-5 w-5 text-gray-400 dark:text-gray-300" />
            ) : (
              <MoonIcon className="h-5 w-5 text-gray-600" />
            )}
          </button>
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
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1 transition-colors duration-150'
                )}
              >
                <item.icon
                  className={classNames(
                    isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500',
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
