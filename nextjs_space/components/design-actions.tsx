
"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, Trash2, Loader2 } from 'lucide-react'

interface DesignActionsProps {
  designId: string
  currentStatus: string
}

export function DesignActions({ designId, currentStatus }: DesignActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const handleStatusChange = async (status: string) => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/admin/designs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ designId, status }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update status')
      }
      
      toast.success(`Design ${status.toLowerCase()}`)
      router.refresh()
    } catch (error) {
      console.error('Status update error:', error)
      toast.error('Failed to update design status')
    } finally {
      setLoading(false)
    }
  }
  
  const handleDelete = async () => {
    setLoading(true)
    
    try {
      const response = await fetch(`/api/admin/designs?id=${designId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete design')
      }
      
      toast.success('Design deleted successfully')
      router.refresh()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete design')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="flex gap-2">
      {currentStatus !== 'APPROVED' && (
        <Button
          size="sm"
          variant="default"
          onClick={() => handleStatusChange('APPROVED')}
          disabled={loading}
          className="flex-1"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="mr-1 h-4 w-4" />
              Approve
            </>
          )}
        </Button>
      )}
      
      {currentStatus !== 'REJECTED' && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleStatusChange('REJECTED')}
          disabled={loading}
          className="flex-1"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <XCircle className="mr-1 h-4 w-4" />
              Reject
            </>
          )}
        </Button>
      )}
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            variant="destructive"
            disabled={loading}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the design and all associated products.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
