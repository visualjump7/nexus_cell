'use client'

import { useState } from 'react'
import { RpModal } from '@/components/rp/RpModal'

interface DeleteConfirmProps {
  itemName: string
  onConfirm: () => Promise<void>
  onCancel: () => void
}

/** Destructive confirm on RpModal: ghost Cancel + outlined alert Delete (never a red fill). */
export default function DeleteConfirm({ itemName, onConfirm, onCancel }: DeleteConfirmProps) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await onConfirm()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <RpModal
      open
      onClose={() => { if (!deleting) onCancel() }}
      size="sm"
      eyebrow="Confirm delete"
      title={`Delete ${itemName}?`}
      footer={
        <>
          <button type="button" onClick={onCancel} disabled={deleting} className="rp-btn-ghost">
            Cancel
          </button>
          <button type="button" onClick={handleDelete} disabled={deleting} className="rp-btn-danger">
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </>
      }
    >
      <p className="text-[15px] leading-normal text-rp-muted">This can&apos;t be undone.</p>
    </RpModal>
  )
}
