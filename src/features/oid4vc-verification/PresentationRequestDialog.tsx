'use client'

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import React, { JSX, useEffect, useState } from 'react'
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
import CustomQRCode from '@/features/wallet/CustomQRCode'
import { ExistingVerificationTemplate } from './CreateVerificationTemplate'
import { apiStatusCodes } from '@/config/CommonConstant'
import { createOid4vpPresentationRequest } from '@/app/api/Oid4vcVerification'
import { getDids } from '@/app/api/Agent'
import { useAppSelector } from '@/lib/hooks'

type ResponseMode = 'direct_post' | 'direct_post.jwt' | 'dc_api' | 'dc_api.jwt'

interface PresentationRequestDialogProps {
  verifierId: string
  template: ExistingVerificationTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRequestCreated: () => void
}

// Confirmed via live API test: POST .../presentation returns
// { authorizationRequest: "openid4vp://?client_id=...&request_uri=...", verificationSession: {...} }
const extractRequestUri = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object') {
    return null
  }
  const obj = payload as Record<string, unknown>
  const candidates = [
    'authorizationRequest',
    'request_uri',
    'requestUri',
    'presentation_request_uri',
    'uri',
    'deepLink',
    'deepLinkUri',
    'qrCode',
    'qrCodeText',
  ]
  for (const key of candidates) {
    const value = obj[key]
    if (typeof value === 'string' && value.length > 0) {
      return value
    }
  }
  for (const key of ['response', 'data', 'result']) {
    const nested = obj[key]
    if (nested && typeof nested === 'object') {
      const found = extractRequestUri(nested)
      if (found) {
        return found
      }
    }
  }
  return null
}

const PresentationRequestDialog = ({
  verifierId,
  template,
  open,
  onOpenChange,
  onRequestCreated,
}: PresentationRequestDialogProps): JSX.Element => {
  const orgId = useAppSelector((state) => state?.organization.orgId)

  const [responseMode, setResponseMode] = useState<ResponseMode>('direct_post')
  const [orgDid, setOrgDid] = useState<string>('')
  const [didLoading, setDidLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    if (!open || !orgId) {
      return
    }
    const fetchDid = async (): Promise<void> => {
      setDidLoading(true)
      try {
        const response = await getDids(orgId)
        const { data } = response as AxiosResponse
        const dids = Array.isArray(data?.data)
          ? data.data
          : data?.data?.data || []
        const primary =
          dids.find((d: { isPrimaryDid?: boolean }) => d.isPrimaryDid) ||
          dids[0]
        setOrgDid(primary?.did || '')
      } catch {
        setOrgDid('')
      } finally {
        setDidLoading(false)
      }
    }
    fetchDid()
  }, [open, orgId])

  const reset = (): void => {
    setFailure(null)
    setResult(null)
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

    if (!orgDid) {
      setFailure(
        'No DID found for this organization — cannot sign the presentation request',
      )
      return
    }

    setCreating(true)

    // Mobile wallets built on Credo <0.7 only support the PEX holder flow
    // (no DCQL), so a template stored in PEX form must be sent as
    // `presentationExchange`, not force-converted to `dcql`.
    const presentationExchange = template.templateJson?.presentationExchange
    const payload = presentationExchange
      ? {
          requestSigner: { method: 'DID', did: orgDid },
          responseMode,
          presentationExchange,
          // Credo's default OpenID4VP version ('v1') only allows dcql -
          // presentationExchange requires explicitly pinning to an older
          // protocol version (confirmed via live API test).
          version: 'v1.draft24' as const,
        }
      : {
          requestSigner: { method: 'DID', did: orgDid },
          responseMode,
          // Credo's live DCQL schema rejects the "combine" property that the
          // template builder stores (confirmed via live API test - it's not
          // part of the real DCQL spec), so it's stripped here before sending.
          dcql: {
            query: {
              credentials:
                template.templateJson?.dcql?.query?.credentials || [],
            },
          },
        }

    try {
      const response = await createOid4vpPresentationRequest(
        orgId || '',
        verifierId,
        payload,
      )
      const { data } = response as AxiosResponse

      if (
        data?.statusCode === apiStatusCodes.API_STATUS_CREATED ||
        data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS
      ) {
        setResult(data?.data || {})
        onRequestCreated()
      } else {
        setFailure(
          (data?.message as string) || 'Failed to create presentation request',
        )
      }
    } catch (error) {
      setFailure((error as Error)?.message || 'An unexpected error occurred')
    } finally {
      setCreating(false)
    }
  }

  const requestUri = result ? extractRequestUri(result) : null

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => (!v ? handleClose() : onOpenChange(v))}
    >
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {result
              ? 'Presentation Request Created'
              : `Request Presentation — ${template?.name || ''}`}
          </DialogTitle>
        </DialogHeader>

        {failure && (
          <AlertComponent
            message={failure}
            type="failure"
            onAlertClose={() => setFailure(null)}
          />
        )}

        {result ? (
          <div className="space-y-4">
            {requestUri ? (
              <div className="flex flex-col items-center gap-3">
                <CustomQRCode value={requestUri} size={180} />
                <p className="text-muted-foreground max-w-full text-center text-xs break-all">
                  {requestUri}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">
                  Request created. Raw response (deep-link field not
                  recognized):
                </p>
                <pre className="bg-muted max-h-64 overflow-auto rounded-md p-3 text-xs">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Response Mode</label>
              <Select
                value={responseMode}
                onValueChange={(v) => setResponseMode(v as ResponseMode)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct_post">direct_post</SelectItem>
                  <SelectItem value="direct_post.jwt">
                    direct_post.jwt
                  </SelectItem>
                  <SelectItem value="dc_api">dc_api</SelectItem>
                  <SelectItem value="dc_api.jwt">dc_api.jwt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-muted-foreground text-xs">
              {didLoading
                ? 'Looking up organization DID...'
                : orgDid
                  ? `Signing with org DID: ${orgDid}`
                  : 'No DID found for this organization.'}
            </p>
          </div>
        )}

        <DialogFooter>
          {result ? (
            <Button onClick={handleClose}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={creating || didLoading}>
                {creating ? 'Creating...' : 'Create Request'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PresentationRequestDialog
