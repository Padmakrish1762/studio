'use client'

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import React, { JSX, useMemo, useState } from 'react'

import { AlertComponent } from '@/components/AlertComponent'
import { AxiosResponse } from 'axios'
import { Button } from '@/components/ui/button'
import CustomQRCode from '@/features/wallet/CustomQRCode'
import { ExistingTemplate } from './CreateTemplate'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { apiStatusCodes } from '@/config/CommonConstant'
import { createOid4vcOffer } from '@/app/api/Oid4vcIssuance'
import { useAppSelector } from '@/lib/hooks'

interface CreateOfferDialogProps {
  issuerId: string
  template: ExistingTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onOfferCreated: () => void
}

// Confirmed via live API test: POST .../create-offer returns
// { credentialOffer: "openid-credential-offer://?credential_offer_uri=...", issuanceSession: {...} }
// Keep the fallback candidates in case the agent version changes this shape.
const extractOfferUri = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object') {
    return null
  }
  const obj = payload as Record<string, unknown>
  const candidates = [
    'credentialOffer',
    'credential_offer_uri',
    'credentialOfferUri',
    'offerUri',
    'offer_uri',
    'deepLinkUri',
    'deepLink',
    'uri',
    'qrCode',
    'qrCodeText',
  ]
  for (const key of candidates) {
    const value = obj[key]
    if (typeof value === 'string' && value.length > 0) {
      return value
    }
  }
  // Nested under `response` or `data`
  for (const key of ['response', 'data', 'result']) {
    const nested = obj[key]
    if (nested && typeof nested === 'object') {
      const found = extractOfferUri(nested)
      if (found) {
        return found
      }
    }
  }
  return null
}

// Confirmed via live testing: preAuthorizedCodeFlow offers always require a
// tx_code (a short PIN) that the wallet prompts for during redemption. The
// agent returns the generated PIN as issuanceSession.userPin - without
// surfacing it here, the user has no way to know what to type into their
// wallet and redemption fails with "a valid transaction code must be present".
const extractUserPin = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object') {
    return null
  }
  const obj = payload as Record<string, unknown>
  const direct = obj.userPin
  if (typeof direct === 'string' && direct.length > 0) {
    return direct
  }
  for (const key of ['issuanceSession', 'response', 'data', 'result']) {
    const nested = obj[key]
    if (nested && typeof nested === 'object') {
      const found = extractUserPin(nested)
      if (found) {
        return found
      }
    }
  }
  return null
}

const attributeKeys = (template: ExistingTemplate | null): string[] => {
  if (!template) {
    return []
  }
  return (
    template.attributes?.attributes?.map((a) => a.key) ||
    template.attributes?.namespaces?.[0]?.attributes?.map((a) => a.key) ||
    []
  )
}

const CreateOfferDialog = ({
  issuerId,
  template,
  open,
  onOpenChange,
  onOfferCreated,
}: CreateOfferDialogProps): JSX.Element => {
  const orgId = useAppSelector((state) => state?.organization.orgId)

  const keys = useMemo(() => attributeKeys(template), [template])
  const [claimValues, setClaimValues] = useState<Record<string, string>>({})
  const [isRevocable, setIsRevocable] = useState(false)
  const [noticeUrl, setNoticeUrl] = useState('')

  const [creating, setCreating] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [offerResult, setOfferResult] = useState<Record<
    string,
    unknown
  > | null>(null)

  const reset = (): void => {
    setClaimValues({})
    setIsRevocable(false)
    setNoticeUrl('')
    setFailure(null)
    setOfferResult(null)
  }

  const handleClose = (): void => {
    reset()
    onOpenChange(false)
  }

  const handleSubmit = async (): Promise<void> => {
    if (!template) {
      return
    }
    setFailure(null)

    if (keys.some((k) => !claimValues[k]?.trim())) {
      setFailure('Please provide a value for every attribute')
      return
    }

    setCreating(true)

    // Only preAuthorizedCodeFlow works end-to-end today (see docs/ecosystem-oid4vci-jwt-vc-runbook.md):
    // authorizationCodeFlow's redemption step hits an upstream credo-ts bug, and
    // noAuth isn't a real OID4VCI grant type at all. The backend now defaults to
    // preAuthorizedCodeFlow when authorizationType is omitted, so there's nothing
    // to send or choose here.
    const payload: Record<string, unknown> = {
      credentials: [
        {
          templateId: template.id,
          payload: { ...claimValues },
        },
      ],
      isRevocable,
      ...(noticeUrl.trim() ? { noticeUrl: noticeUrl.trim() } : {}),
    }

    try {
      const response = await createOid4vcOffer(orgId || '', issuerId, payload)
      const { data } = response as AxiosResponse

      if (
        data?.statusCode === apiStatusCodes.API_STATUS_CREATED ||
        data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS
      ) {
        setOfferResult(data?.data || {})
        onOfferCreated()
      } else {
        setFailure(
          (data?.message as string) || 'Failed to create credential offer',
        )
      }
    } catch (error) {
      setFailure((error as Error)?.message || 'An unexpected error occurred')
    } finally {
      setCreating(false)
    }
  }

  const offerUri = offerResult ? extractOfferUri(offerResult) : null
  const userPin = offerResult ? extractUserPin(offerResult) : null

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => (!v ? handleClose() : onOpenChange(v))}
    >
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {offerResult
              ? 'Credential Offer Created'
              : `Create Offer — ${template?.name || ''}`}
          </DialogTitle>
        </DialogHeader>

        {failure && (
          <AlertComponent
            message={failure}
            type="failure"
            onAlertClose={() => setFailure(null)}
          />
        )}

        {offerResult ? (
          <div className="space-y-4">
            {userPin && (
              <div className="border-primary bg-secondary rounded-md border-2 p-4 text-center">
                <p className="text-muted-foreground text-sm">
                  Your wallet will ask for a PIN when scanning this code —
                  enter:
                </p>
                <p className="text-3xl font-bold tracking-widest">{userPin}</p>
              </div>
            )}
            {offerUri ? (
              <div className="flex flex-col items-center gap-3">
                <CustomQRCode value={offerUri} size={180} />
                <p className="text-muted-foreground max-w-full text-center text-xs break-all">
                  {offerUri}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">
                  Offer created. Raw response (deep-link field not recognized —
                  scan/copy the appropriate value manually):
                </p>
                <pre className="bg-muted max-h-64 overflow-auto rounded-md p-3 text-xs">
                  {JSON.stringify(offerResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {keys.length === 0 && (
              <p className="text-muted-foreground text-sm">
                This template has no attributes configured.
              </p>
            )}
            {keys.map((key) => (
              <div key={key} className="space-y-2">
                <Label>{key} *</Label>
                <Input
                  value={claimValues[key] || ''}
                  onChange={(e) =>
                    setClaimValues((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                />
              </div>
            ))}

            <div className="space-y-2">
              <Label>Notice URL (optional)</Label>
              <Input
                value={noticeUrl}
                onChange={(e) => setNoticeUrl(e.target.value)}
              />
            </div>

            {template?.canBeRevoked && (
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={isRevocable}
                  onCheckedChange={setIsRevocable}
                />
                Issue as revocable
              </label>
            )}
          </div>
        )}

        <DialogFooter>
          {offerResult ? (
            <Button onClick={handleClose}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={creating}>
                {creating ? 'Creating...' : 'Create Offer'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreateOfferDialog
