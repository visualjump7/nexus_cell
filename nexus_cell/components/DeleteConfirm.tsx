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
    <div className="fixed inset-0 bg-[rgba(8,9,10,.85)] flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="rp-panel w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <h3 className="rp-eyebrow mb-3">Confirm delete</h3>
        <p className="text-sm text-gray-400 mb-6">
          Are you sure you want to delete <span className="text-white font-medium">{itemName}</span>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="rp-btn-ghost flex-1 !min-h-[42px]">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-500 disabled:bg-red-800 disabled:cursor-not-allowed text-white rounded-none min-h-[42px] font-display uppercase tracking-[0.16em] text-[13px] transition-colors">
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
