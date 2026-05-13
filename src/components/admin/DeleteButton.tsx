'use client'

import React, { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface DeleteButtonProps {
  id: number
  entity: 'news' | 'advertise' | 'galleries' | 'videos' | 'polls'
  onSuccess?: () => void
}

export function DeleteButton({ id, entity, onSuccess }: DeleteButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setLoading(true)
    console.log('[DeleteButton] Starting fetch DELETE for:', `/api/admin/${entity}/${id}`)
    
    const promise = fetch(`/api/admin/${entity}/${id}`, {
      method: 'DELETE',
    }).then(async (res) => {
      console.log('[DeleteButton] Response status:', res.status)
      if (!res.ok) {
        const data = await res.json()
        console.error('[DeleteButton] Error data:', data)
        throw new Error(data.error || 'Delete failed')
      }
      return res.json()
    })

    toast.promise(promise, {
      loading: 'Deleting...',
      success: () => {
        router.refresh()
        onSuccess?.()
        return `${entity === 'news' ? 'Article' : 'Campaign'} deleted successfully`
      },
      error: (err: any) => {
        console.error('Delete error details:', err)
        alert(`Delete Failed!\nID: ${id}\nError: ${err.message}`)
        return `Error: ${err.message}`
      }
    })

    try {
      await promise
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-200">
        <button 
          onClick={() => setShowConfirm(false)}
          className="px-2 py-1 text-[10px] font-black uppercase tracking-tighter text-slate-400 hover:text-slate-600 transition-colors"
        >
          Cancel
        </button>
        <button 
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleDelete()
          }}
          disabled={loading}
          className="px-3 py-1 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95"
        >
          {loading ? '...' : 'Confirm'}
        </button>
      </div>
    )
  }

  return (
    <button 
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setShowConfirm(true)
      }}
      disabled={loading}
      className="p-2.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all disabled:opacity-50"
      title="Delete"
    >
      <Trash2 className={`h-5 w-5 ${loading ? 'animate-pulse' : ''}`} />
    </button>
  )
}
