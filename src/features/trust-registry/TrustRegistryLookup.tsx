'use client'

import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Search, XCircle } from 'lucide-react'
import React, { FormEvent, JSX, useState } from 'react'

import { AxiosResponse } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiStatusCodes } from '@/config/CommonConstant'
import { getTrustRegistryByDid } from '@/app/api/Oid4vcIssuance'

interface TrustRegistryIssuerEntry {
  publicIssuerId: string
  ecosystemId: string
  ecosystemName: string
  status: string
  credentialTypesOffered: string[]
}

interface TrustRegistryResult {
  did: string
  trusted: boolean
  issuers: TrustRegistryIssuerEntry[]
}

// Public page, no org context and no auth — anyone (including a third-party
// verifier) can check whether a DID is a currently-active, ecosystem-governed
// OID4VC issuer, same as the API itself requires no API key.
const TrustRegistryLookup = (): JSX.Element => {
  const [did, setDid] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TrustRegistryResult | null>(null)

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)
    setResult(null)

    const trimmed = did.trim()
    if (!trimmed) {
      setError('Enter a DID to look up')
      return
    }

    setLoading(true)
    try {
      const response = await getTrustRegistryByDid(trimmed)
      const { data } = response as AxiosResponse

      if (data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS) {
        setResult(data?.data as TrustRegistryResult)
      } else {
        setError((data?.message as string) || 'Lookup failed')
      }
    } catch (err) {
      setError((err as Error)?.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Trust Registry</h1>
        <p className="text-muted-foreground mt-1">
          Check whether a DID is a currently active, ecosystem-governed OID4VC
          issuer. This does not verify any individual credential — it only tells
          you whether something is currently vouching for the issuer that signed
          it.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
        <Input
          placeholder="did:key:z6Mk..."
          value={did}
          onChange={(e) => setDid(e.target.value)}
          className="font-mono text-sm"
        />
        <Button type="submit" disabled={loading}>
          <Search className="mr-2 h-4 w-4" />
          {loading ? 'Checking...' : 'Check'}
        </Button>
      </form>

      {error && (
        <Card className="border-destructive mb-4 p-4">
          <p className="text-destructive text-sm">{error}</p>
        </Card>
      )}

      {result && (
        <Card className="p-4">
          <CardContent className="space-y-4 p-0">
            <div className="flex items-center gap-2">
              {result.trusted ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-600">Trusted</span>
                </>
              ) : (
                <>
                  <XCircle className="text-destructive h-5 w-5" />
                  <span className="text-destructive font-semibold">
                    Not Trusted
                  </span>
                </>
              )}
            </div>
            <p className="text-muted-foreground font-mono text-xs break-all">
              {result.did}
            </p>

            {result.issuers.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                This DID is not registered as an ecosystem-governed issuer —
                either it was never linked to an ecosystem, or it simply
                isn&apos;t a known issuer DID at all.
              </p>
            ) : (
              <div className="space-y-3">
                {result.issuers.map((issuer) => (
                  <div
                    key={issuer.publicIssuerId}
                    className="rounded-md border p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {issuer.publicIssuerId}
                      </span>
                      <span
                        className={
                          issuer.status === 'ACTIVE'
                            ? 'text-xs font-semibold text-green-600'
                            : 'text-destructive text-xs font-semibold'
                        }
                      >
                        {issuer.status}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Ecosystem: {issuer.ecosystemName}
                    </p>
                    {issuer.credentialTypesOffered.length > 0 && (
                      <p className="text-muted-foreground mt-1 text-xs">
                        Credential types:{' '}
                        {issuer.credentialTypesOffered.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default TrustRegistryLookup
