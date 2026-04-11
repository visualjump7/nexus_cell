'use client'

import { useState } from 'react'

interface DeleteConfirmProps {
  itemName: string
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export default function DeleteConfirm({ itemName, onConfirm, onCancel }: DeleteConfirmProps) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await onConfirm()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-main rounded-xl shadow-2xl shadow-black/40 w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-white mb-2">Confirm Delete</h3>
        <p className="text-sm text-gray-400 mb-6">
          Are you sure you want to delete <span className="text-white font-medium">{itemName}</span>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/15 text-gray-300 rounded-lg text-sm transition-colors">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-500 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm transition-colors">
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
