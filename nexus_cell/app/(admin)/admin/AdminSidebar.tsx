'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/admin', label: 'Overview', match: (p: string) => p === '/admin' },
  { href: '/admin/users', label: 'Users', match: (p: string) => p.startsWith('/admin/users') },
  { href: '/admin/principals', label: 'Principals', match: (p: string) => p.startsWith('/admin/principals') },
  { href: '/admin/executive-views', label: 'Executive views', match: (p: string) => p.startsWith('/admin/executive-views') },
  { href: '/admin/calendars', label: 'Calendars', match: (p: string) => p.startsWith('/admin/calendars') },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  return (
    <nav className="px-2 py-1">
      <ul className="m-0 p-0 list-none space-y-0.5">
        {NAV.map(item => {
          const active = item.match(pathname || '')
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? 'bg-emerald-500/[0.08] text-emerald-400'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
