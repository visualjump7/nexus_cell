'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/admin', label: 'Overview', match: (p: string) => p === '/admin' },
  { href: '/admin/users', label: 'Users', match: (p: string) => p.startsWith('/admin/users') },
  { href: '/admin/principals', label: 'Owners', match: (p: string) => p.startsWith('/admin/principals') },
  { href: '/admin/executive-views', label: 'Owner views', match: (p: string) => p.startsWith('/admin/executive-views') },
  { href: '/admin/calendars', label: 'Calendars', match: (p: string) => p.startsWith('/admin/calendars') },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  return (
    <nav className="-mx-2">
      <ul className="m-0 p-0 list-none space-y-0.5">
        {NAV.map((item, i) => {
          const active = item.match(pathname || '')
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-baseline gap-3 px-3 py-2.5 border-l-2 text-sm transition-colors ${
                  active
                    ? 'border-[#CDA14B] bg-[#141618] text-white'
                    : 'border-transparent text-[#9AA0A4] hover:text-white hover:bg-[#141618]'
                }`}
              >
                <span className={`rp-num ${active ? '!text-[#CDA14B]' : ''}`}>{String(i + 1).padStart(2, '0')}</span>
                <span className="font-display uppercase tracking-[0.12em] text-[13px]">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
