'use client'

import { useState } from 'react'
import OrbLayout from '@/components/OrbLayout'
import AIDrawer from '@/components/AIDrawer'
import { LayoutIcon, DollarIcon, PlaneIcon, BellIcon, CheckIcon, HeartIcon, FolderIcon, FileTextIcon, CalendarIcon } from '@/components/icons'

interface Props {
  firstName: string
  alertsCount: number
  tasksCount: number
}

export default function HomeClient({ firstName, alertsCount, tasksCount }: Props) {
  const [aiOpen, setAiOpen] = useState(false)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const modules = [
    { href: '/dashboard', icon: <LayoutIcon className="w-6 h-6" />, label: 'Dashboard', color: 'emerald' },
    { href: '/financial', icon: <DollarIcon className="w-6 h-6" />, label: 'Financial', color: 'blue' },
    { href: '/travel', icon: <PlaneIcon className="w-6 h-6" />, label: 'Travel', color: 'purple' },
    { href: '/alerts', icon: <BellIcon className="w-6 h-6" />, label: 'Alerts', color: 'amber', badge: alertsCount },
    { href: '/tasks', icon: <CheckIcon className="w-6 h-6" />, label: 'Tasks', color: 'cyan', badge: tasksCount },
    { href: '/lifestyle', icon: <HeartIcon className="w-6 h-6" />, label: 'Lifestyle', color: 'rose' },
    { href: '/projects', icon: <FolderIcon className="w-6 h-6" />, label: 'Projects', color: 'orange' },
    { href: '/brief', icon: <FileTextIcon className="w-6 h-6" />, label: 'Brief', color: 'teal' },
    { href: '/calendar', icon: <CalendarIcon className="w-6 h-6" />, label: 'Calendar', color: 'pink' },
  ]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative">
      {/* Greeting */}
      <div className="text-center mb-10 animate-fade-in-up">
        <p className="text-lg text-gray-400">
          {greeting}, <span className="text-white font-medium">{firstName}</span>
        </p>
      </div>

      {/* Orb layout */}
      <OrbLayout modules={modules} onCenterClick={() => setAiOpen(true)} />

      {/* AI Drawer */}
      <AIDrawer isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  )
}
