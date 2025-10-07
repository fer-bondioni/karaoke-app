'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { UserPlus, Copy, QrCode, Check } from 'lucide-react'
import { generateInvitationLink, copyToClipboard } from '@/lib/invitations'
import { QRCodeSVG } from 'qrcode.react'

interface InviteParticipantDialogProps {
  sessionCode: string
  sessionName: string
}

export function InviteParticipantDialog({ sessionCode, sessionName }: InviteParticipantDialogProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const invitationLink = generateInvitationLink(sessionCode)
  
  const handleCopyLink = async () => {
    const success = await copyToClipboard(invitationLink)
    
    if (success) {
      setCopied(true)
      toast({
        title: 'Link copied!',
        description: 'Invitation link copied to clipboard',
      })
      
      setTimeout(() => setCopied(false), 2000)
    } else {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the link manually',
        variant: 'destructive',
      })
    }
  }
  
  const handleCopyCode = async () => {
    const success = await copyToClipboard(sessionCode)
    
    if (success) {
      toast({
        title: 'Code copied!',
        description: 'Session code copied to clipboard',
      })
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Participants</DialogTitle>
          <DialogDescription>
            Share this session with friends to sing together!
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link">Link</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="qr">QR Code</TabsTrigger>
          </TabsList>
          
          <TabsContent value="link" className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Share this link with anyone you want to invite:
              </p>
              <div className="flex gap-2">
                <Input
                  value={invitationLink}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Session: {sessionName}</p>
              <p className="text-xs text-muted-foreground">
                Anyone with this link can join the session
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="code" className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Share this code for others to join:
              </p>
              <div className="flex gap-2">
                <Input
                  value={sessionCode}
                  readOnly
                  className="font-mono text-2xl text-center tracking-wider"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyCode}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">How to join:</p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Go to the app homepage</li>
                <li>Click "Join Session"</li>
                <li>Enter this code</li>
              </ol>
            </div>
          </TabsContent>
          
          <TabsContent value="qr" className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Scan this QR code with a mobile device to join:
              </p>
              
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG
                  value={invitationLink}
                  size={200}
                  level="M"
                  includeMargin
                />
              </div>
              
              <div className="text-center">
                <p className="text-sm font-medium">{sessionName}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Code: {sessionCode}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
