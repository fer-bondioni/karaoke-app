import { createClient } from '@/lib/supabase/client'

/**
 * Generate a shareable invitation link for a session
 */
export function generateInvitationLink(sessionCode: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/join/${sessionCode}`
}

/**
 * Create an invitation in the database
 */
export async function createInvitation(
  sessionId: string,
  invitedBy: string,
  options?: {
    usesRemaining?: number | null
    expiresAt?: Date | null
  }
) {
  const supabase = createClient()
  
  // Generate invitation code using database function
  const { data: codeData, error: codeError } = await supabase.rpc('generate_invitation_code')
  
  if (codeError) {
    throw new Error(`Failed to generate invitation code: ${codeError.message}`)
  }
  
  const invitationCode = codeData as string
  
  // Create invitation record
  const { data, error } = await supabase
    .from('session_invitations')
    .insert({
      session_id: sessionId,
      invited_by: invitedBy,
      invitation_code: invitationCode,
      uses_remaining: options?.usesRemaining || null,
      expires_at: options?.expiresAt?.toISOString() || null,
    })
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to create invitation: ${error.message}`)
  }
  
  return data
}

/**
 * Validate and consume an invitation
 */
export async function validateInvitation(invitationCode: string) {
  const supabase = createClient()
  
  const { data: invitation, error } = await supabase
    .from('session_invitations')
    .select('*, sessions(*)')
    .eq('invitation_code', invitationCode)
    .single()
  
  if (error || !invitation) {
    return { valid: false, error: 'Invalid invitation code' }
  }
  
  // Check if expired
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return { valid: false, error: 'Invitation has expired' }
  }
  
  // Check uses remaining
  if (invitation.uses_remaining !== null && invitation.uses_remaining <= 0) {
    return { valid: false, error: 'Invitation has been fully used' }
  }
  
  // Decrement uses if applicable
  if (invitation.uses_remaining !== null) {
    await supabase
      .from('session_invitations')
      .update({ uses_remaining: invitation.uses_remaining - 1 })
      .eq('id', invitation.id)
  }
  
  return {
    valid: true,
    invitation,
    session: invitation.sessions,
  }
}

/**
 * Copy text to clipboard with fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      try {
        document.execCommand('copy')
        document.body.removeChild(textArea)
        return true
      } catch (err) {
        document.body.removeChild(textArea)
        return false
      }
    }
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
    return false
  }
}
