'use client'

import { Card, CardContent } from '@/components/ui/card'
import React, { FormEvent, JSX, useState } from 'react'
import {
  createOid4vpVerifier,
  updateOid4vpVerifier,
} from '@/app/api/Oid4vcVerification'

import { AlertComponent } from '@/components/AlertComponent'
import { AxiosResponse } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiStatusCodes } from '@/config/CommonConstant'
import { useAppSelector } from '@/lib/hooks'

export interface ExistingVerifier {
  id: string
  verifierId: string
  publicVerifierId?: string
  metadata?: { client_name?: string; logo_uri?: string }
}

interface CreateVerifierProps {
  editVerifier?: ExistingVerifier
  onCancel: () => void
  onSuccess: (message: string) => void
  onFailure: (message: string) => void
}

const CreateVerifier = ({
  editVerifier,
  onCancel,
  onSuccess,
  onFailure,
}: CreateVerifierProps): JSX.Element => {
  const orgId = useAppSelector((state) => state?.organization.orgId)
  const isEditing = Boolean(editVerifier)

  const [verifierId, setVerifierId] = useState(
    editVerifier?.publicVerifierId || '',
  )
  const [clientName, setClientName] = useState(
    editVerifier?.metadata?.client_name || '',
  )
  const [logoUri, setLogoUri] = useState(editVerifier?.metadata?.logo_uri || '')

  const [creating, setCreating] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [failure, setFailure] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setSuccess(null)
    setFailure(null)

    if (!verifierId.trim()) {
      setFailure('Verifier ID is required')
      return
    }
    // The backend requires clientMetadata.client_name and .logo_uri whenever
    // clientMetadata is sent, and crashes if clientMetadata is omitted
    // entirely - confirmed via live testing. So both are mandatory here.
    if (!clientName.trim()) {
      setFailure('Client display name is required')
      return
    }
    if (!logoUri.trim()) {
      setFailure('Logo URI is required')
      return
    }

    setCreating(true)

    const payload: Record<string, unknown> = {
      verifierId: verifierId.trim(),
      clientMetadata: {
        ['client_name']: clientName.trim(),
        ['logo_uri']: logoUri.trim(),
      },
    }

    try {
      const response = isEditing
        ? await updateOid4vpVerifier(orgId || '', editVerifier!.id, payload)
        : await createOid4vpVerifier(orgId || '', payload)
      const { data } = response as AxiosResponse

      if (
        data?.statusCode === apiStatusCodes.API_STATUS_CREATED ||
        data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS
      ) {
        const message =
          (data?.message as string) ||
          (isEditing
            ? 'Verifier updated successfully'
            : 'Verifier created successfully')
        setSuccess(message)
        setTimeout(() => onSuccess(message), 1200)
      } else {
        const errorMessage =
          (data?.message as string) ||
          (isEditing
            ? 'Failed to update verifier'
            : 'Failed to create verifier')
        setFailure(errorMessage)
        onFailure(errorMessage)
      }
    } catch (error) {
      const errorMessage =
        (error as Error)?.message || 'An unexpected error occurred'
      setFailure(errorMessage)
      onFailure(errorMessage)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Card className="border-2">
      <CardContent className="pt-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight">
            {isEditing ? 'Edit OID4VP Verifier' : 'Create OID4VP Verifier'}
          </h2>
          <p className="text-muted-foreground mt-1">
            Register an OpenID4VP verifier for this organization
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="verifierId">Verifier ID *</Label>
            <Input
              id="verifierId"
              placeholder="credebl-verifier"
              value={verifierId}
              onChange={(e) => setVerifierId(e.target.value)}
              disabled={isEditing}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Display Name *</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logoUri">Logo URI *</Label>
              <Input
                id="logoUri"
                value={logoUri}
                onChange={(e) => setLogoUri(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating
                ? 'Saving...'
                : isEditing
                  ? 'Save Changes'
                  : 'Create Verifier'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default CreateVerifier
