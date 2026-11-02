'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash2 } from 'lucide-react'
import React, { FormEvent, JSX, useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { AlertComponent } from '@/components/AlertComponent'
import { AxiosResponse } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiStatusCodes } from '@/config/CommonConstant'
import { createOid4vcIssuer } from '@/app/api/Oid4vcIssuance'
import { getEcosystemsForLead } from '@/app/api/ecosystem'
import { useAppSelector } from '@/lib/hooks'

interface EcosystemOption {
  id: string
  name: string
}

interface DisplayEntry {
  locale: string
  name: string
  description: string
  logoUri: string
}

interface CreateIssuerProps {
  onCancel: () => void
  onSuccess: (message: string) => void
  onFailure: (message: string) => void
}

const emptyDisplay = (): DisplayEntry => ({
  locale: 'en',
  name: '',
  description: '',
  logoUri: '',
})

const CreateIssuer = ({
  onCancel,
  onSuccess,
  onFailure,
}: CreateIssuerProps): JSX.Element => {
  const orgId = useAppSelector((state) => state?.organization.orgId)

  const [issuerId, setIssuerId] = useState('')
  const [authorizationServerUrl, setAuthorizationServerUrl] = useState(
    process.env.NEXT_PUBLIC_BASE_URL || '',
  )
  const [batchCredentialIssuanceSize, setBatchCredentialIssuanceSize] =
    useState('')
  const [displays, setDisplays] = useState<DisplayEntry[]>([emptyDisplay()])

  const [useExternalAuthServer, setUseExternalAuthServer] = useState(false)
  const [asIssuer, setAsIssuer] = useState('')
  const [asClientId, setAsClientId] = useState('')
  const [asClientSecret, setAsClientSecret] = useState('')

  const [ecosystems, setEcosystems] = useState<EcosystemOption[]>([])
  const [ecosystemId, setEcosystemId] = useState<string>('')

  const [creating, setCreating] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [failure, setFailure] = useState<string | null>(null)

  // Trust-registry linking is opt-in: only orgs that are an ACTIVE member/lead
  // of an ecosystem can link an issuer to it (backend validates this too).
  // If this org isn't in any ecosystem, the list is simply empty and the
  // selector is skipped entirely — nothing to link, nothing shown.
  useEffect(() => {
    const fetchEcosystems = async (): Promise<void> => {
      if (!orgId) {
        return
      }
      const response = await getEcosystemsForLead(orgId, {
        pageNumber: 0,
        pageSize: 50,
        searchTerm: '',
      })
      const { data } = response as AxiosResponse
      const rows = data?.data?.data as
        | { id: string; name: string }[]
        | undefined
      if (rows) {
        setEcosystems(rows.map((r) => ({ id: r.id, name: r.name })))
      }
    }
    fetchEcosystems()
  }, [orgId])

  const updateDisplay = (
    index: number,
    field: keyof DisplayEntry,
    value: string,
  ): void => {
    setDisplays((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)),
    )
  }

  const addDisplay = (): void =>
    setDisplays((prev) => [...prev, emptyDisplay()])

  const removeDisplay = (index: number): void =>
    setDisplays((prev) => prev.filter((_, i) => i !== index))

  const resetForm = (): void => {
    setIssuerId('')
    setAuthorizationServerUrl(process.env.NEXT_PUBLIC_BASE_URL || '')
    setBatchCredentialIssuanceSize('')
    setDisplays([emptyDisplay()])
    setUseExternalAuthServer(false)
    setAsIssuer('')
    setAsClientId('')
    setAsClientSecret('')
    setEcosystemId('')
  }

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setSuccess(null)
    setFailure(null)

    if (!issuerId.trim()) {
      setFailure('Issuer ID is required')
      return
    }
    if (!authorizationServerUrl.trim()) {
      setFailure('Authorization server URL is required')
      return
    }
    if (displays.some((d) => !d.name.trim() || !d.locale.trim())) {
      setFailure('Each display entry needs a locale and a name')
      return
    }

    setCreating(true)

    const payload: Record<string, unknown> = {
      issuerId: issuerId.trim(),
      authorizationServerUrl: authorizationServerUrl.trim(),
      display: displays.map((d) => ({
        locale: d.locale.trim(),
        name: d.name.trim(),
        ...(d.description.trim() ? { description: d.description.trim() } : {}),
        ...(d.logoUri.trim()
          ? { logo: { uri: d.logoUri.trim(), ['alt_text']: d.name.trim() } }
          : {}),
      })),
    }

    if (batchCredentialIssuanceSize.trim()) {
      payload.batchCredentialIssuanceSize = Number(batchCredentialIssuanceSize)
    }

    if (ecosystemId) {
      payload.ecosystemId = ecosystemId
    }

    if (useExternalAuthServer) {
      payload.authorizationServerConfigs = {
        issuer: asIssuer.trim(),
        clientAuthentication: {
          clientId: asClientId.trim(),
          clientSecret: asClientSecret.trim(),
        },
      }
    }

    try {
      const response = await createOid4vcIssuer(orgId || '', payload)
      const { data } = response as AxiosResponse

      if (
        data?.statusCode === apiStatusCodes.API_STATUS_CREATED ||
        data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS
      ) {
        const message =
          (data?.message as string) || 'Issuer created successfully'
        setSuccess(message)
        resetForm()
        setTimeout(() => onSuccess(message), 1200)
      } else {
        const errorMessage =
          (data?.message as string) || 'Failed to create issuer'
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
            Create OID4VC Issuer
          </h2>
          <p className="text-muted-foreground mt-1">
            Register an OpenID4VCI issuer for this organization
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
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="issuerId">Issuer ID *</Label>
              <Input
                id="issuerId"
                placeholder="credebl-university"
                value={issuerId}
                onChange={(e) => setIssuerId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="authorizationServerUrl">
                Authorization Server URL *
              </Label>
              <Input
                id="authorizationServerUrl"
                placeholder="https://issuer.example.io"
                value={authorizationServerUrl}
                onChange={(e) => setAuthorizationServerUrl(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">
                Must be publicly reachable by wallets (e.g. your devtunnel URL
                for the API Gateway).
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="batchSize">
              Batch Credential Issuance Size (optional)
            </Label>
            <Input
              id="batchSize"
              type="number"
              min={1}
              placeholder="100"
              value={batchCredentialIssuanceSize}
              onChange={(e) => setBatchCredentialIssuanceSize(e.target.value)}
              className="max-w-xs"
            />
          </div>

          {ecosystems.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="ecosystemId">
                Link to Ecosystem (optional, for trust registry)
              </Label>
              <Select
                value={ecosystemId || 'none'}
                onValueChange={(v) => setEcosystemId(v === 'none' ? '' : v)}
              >
                <SelectTrigger id="ecosystemId" className="max-w-md">
                  <SelectValue placeholder="Not linked to any ecosystem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    Not linked to any ecosystem
                  </SelectItem>
                  {ecosystems.map((eco) => (
                    <SelectItem key={eco.id} value={eco.id}>
                      {eco.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                Linking makes this issuer&apos;s DID discoverable via the public
                trust registry as long as this org stays an active member of the
                ecosystem — deactivating membership revokes trust immediately.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Display Information *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addDisplay}
              >
                <Plus className="h-4 w-4" /> Add locale
              </Button>
            </div>

            {displays.map((d, index) => (
              <Card key={index} className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-muted-foreground text-sm font-medium">
                    Locale #{index + 1}
                  </span>
                  {displays.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDisplay(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    placeholder="Locale (e.g. en)"
                    value={d.locale}
                    onChange={(e) =>
                      updateDisplay(index, 'locale', e.target.value)
                    }
                  />
                  <Input
                    placeholder="Display name"
                    value={d.name}
                    onChange={(e) =>
                      updateDisplay(index, 'name', e.target.value)
                    }
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={d.description}
                    onChange={(e) =>
                      updateDisplay(index, 'description', e.target.value)
                    }
                  />
                  <Input
                    placeholder="Logo URI (optional)"
                    value={d.logoUri}
                    onChange={(e) =>
                      updateDisplay(index, 'logoUri', e.target.value)
                    }
                  />
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useExternalAuthServer}
                onChange={(e) => setUseExternalAuthServer(e.target.checked)}
              />
              Use an external Authorization Server (authorizationCodeFlow)
            </label>

            {useExternalAuthServer && (
              <Card className="space-y-3 p-4">
                <Input
                  placeholder="AS issuer URL (e.g. https://id.example.com/realms/issuer)"
                  value={asIssuer}
                  onChange={(e) => setAsIssuer(e.target.value)}
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    placeholder="Client ID"
                    value={asClientId}
                    onChange={(e) => setAsClientId(e.target.value)}
                  />
                  <Input
                    placeholder="Client Secret"
                    value={asClientSecret}
                    onChange={(e) => setAsClientSecret(e.target.value)}
                  />
                </div>
              </Card>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? 'Creating...' : 'Create Issuer'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default CreateIssuer
