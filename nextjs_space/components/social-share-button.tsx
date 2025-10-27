
"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Share2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface SocialShareButtonProps {
  productId: string
  productName: string
}

export function SocialShareButton({ productId, productName }: SocialShareButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  
  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/admin/social/post-product')
      const data = await response.json()
      setAccounts(data.accounts || [])
      
      // Pre-select all configured accounts
      const configured = data.accounts
        ?.filter((acc: any) => acc.configured)
        .map((acc: any) => acc.name) || []
      setSelectedAccounts(configured)
    } catch (error) {
      console.error('Error fetching accounts:', error)
      toast.error('Failed to load social media accounts')
    }
  }
  
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      fetchAccounts()
    }
  }
  
  const handlePost = async () => {
    if (selectedAccounts.length === 0) {
      toast.error('Please select at least one account')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch('/api/admin/social/post-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          accounts: selectedAccounts,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(`Posted to ${data.posted} account(s)!`)
        setOpen(false)
      } else {
        toast.error(data.message || 'Failed to post to social media')
      }
    } catch (error) {
      console.error('Error posting to social media:', error)
      toast.error('Failed to post to social media')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share to Social
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Post to Social Media</DialogTitle>
          <DialogDescription>
            Share "{productName}" on your social media accounts
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {accounts.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>No social media accounts configured</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <Label>Select accounts to post to:</Label>
                {accounts.map((account) => (
                  <div key={account.name} className="flex items-center space-x-2">
                    <Checkbox
                      id={account.name}
                      checked={selectedAccounts.includes(account.name)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedAccounts([...selectedAccounts, account.name])
                        } else {
                          setSelectedAccounts(selectedAccounts.filter(a => a !== account.name))
                        }
                      }}
                      disabled={!account.configured}
                    />
                    <Label
                      htmlFor={account.name}
                      className={`cursor-pointer ${!account.configured ? 'text-muted-foreground' : ''}`}
                    >
                      {account.name}
                      {!account.configured && ' (Not configured)'}
                    </Label>
                  </div>
                ))}
              </div>
              
              <Button
                onClick={handlePost}
                disabled={loading || selectedAccounts.length === 0}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" />
                    Post to {selectedAccounts.length} account(s)
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
