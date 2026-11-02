'use client'

import { Card, CardContent } from '@/components/ui/card'
import React, { FormEvent, JSX, useState } from 'react'

import { AlertComponent } from '@/components/AlertComponent'
import { AxiosResponse } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiStatusCodes } from '@/config/CommonConstant'
import { inviteUserToCreateEcosystem } from '@/app/api/platformAdmin'

// Platform-admin-only screen. There is no client-side role gate here —
// the backend enforces @Roles(OrgRoles.PLATFORM_ADMIN) and returns a 403
// for anyone else, which is surfaced below via the normal failure alert.
const InviteEcosystemCreator = (): JSX.Element => {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [failure, setFailure] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setSuccess(null)
    setFailure(null)

    const trimmed = email.trim()
    if (!trimmed) {
      setFailure('Enter an email address')
      return
    }

    setSending(true)
    try {
      const response = await inviteUserToCreateEcosystem(trimmed)
      const { data } = response as AxiosResponse

      if (
        data?.statusCode === apiStatusCodes.API_STATUS_CREATED ||
        data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS
      ) {
        setSuccess(
          (data?.message as string) ||
            `Invitation sent to ${trimmed}. They can now create an ecosystem.`,
        )
        setEmail('')
      } else {
        setFailure((data?.message as string) || 'Failed to send invitation')
      }
    } catch (error) {
      setFailure((error as Error)?.message || 'An unexpected error occurred')
    } finally {
      setSending(false)
    }
  }

  return (
    <Card className="max-w-xl">
      <CardContent className="pt-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">
            Invite Ecosystem Creator
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Only a platform admin can authorize who is allowed to create an
            ecosystem. Invite a user by email — once they accept, they can
            create an ecosystem from their own org and become its Lead.
          </p>
        </div>

        {success && (
          <div className="mb-4">
            <AlertComponent
              message={success}
              type="success"
              onAlertClose={() => setSuccess(null)}
            />
          </div>
        )}
        {failure && (
          <div className="mb-4">
            <AlertComponent
              message={failure}
              type="failure"
              onAlertClose={() => setFailure(null)}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <div className="flex-1 space-y-2">
            <Label htmlFor="inviteEmail">Email address</Label>
            <Input
              id="inviteEmail"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={sending}>
            {sending ? 'Sending...' : 'Send Invite'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default InviteEcosystemCreator
