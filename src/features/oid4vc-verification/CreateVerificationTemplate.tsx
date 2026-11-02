'use client'

import { Card, CardContent } from '@/components/ui/card'
import {
  CredentialQuery,
  ExistingVerificationTemplate,
  QueryFormat,
  SignerOption,
  buildTemplateJson,
  emptyQuery,
  fromExisting,
  inferQueryFormat,
} from './verificationTemplateHelpers'
import { Plus, Trash2 } from 'lucide-react'
import React, { FormEvent, JSX, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createOid4vpVerificationTemplate,
  updateOid4vpVerificationTemplate,
} from '@/app/api/Oid4vcVerification'

import { AlertComponent } from '@/components/AlertComponent'
import { AxiosResponse } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { apiStatusCodes } from '@/config/CommonConstant'
import { useAppSelector } from '@/lib/hooks'

export type { ExistingVerificationTemplate } from './verificationTemplateHelpers'

interface CreateVerificationTemplateProps {
  editTemplate?: ExistingVerificationTemplate
  onCancel: () => void
  onSuccess: (message: string) => void
  onFailure: (message: string) => void
}

const CreateVerificationTemplate = ({
  editTemplate,
  onCancel,
  onSuccess,
  onFailure,
}: CreateVerificationTemplateProps): JSX.Element => {
  const orgId = useAppSelector((state) => state?.organization.orgId)
  const isEditing = Boolean(editTemplate)

  const [name, setName] = useState(editTemplate?.name || '')
  const [signerOption, setSignerOption] = useState<SignerOption>(
    editTemplate?.signerOption || 'DID',
  )
  const [queryFormat, setQueryFormat] = useState<QueryFormat>(
    inferQueryFormat(editTemplate),
  )
  const [combine, setCombine] = useState<'all' | 'any'>(
    editTemplate?.templateJson?.dcql?.query?.combine || 'all',
  )
  const [queries, setQueries] = useState<CredentialQuery[]>(
    fromExisting(editTemplate),
  )

  const [creating, setCreating] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [failure, setFailure] = useState<string | null>(null)

  const updateQuery = (
    index: number,
    field: keyof CredentialQuery,
    value: unknown,
  ): void => {
    setQueries((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q)),
    )
  }

  const updateClaim = (qIndex: number, cIndex: number, value: string): void => {
    setQueries((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) {
          return q
        }
        return {
          ...q,
          claims: q.claims.map((c, j) => (j === cIndex ? { path: value } : c)),
        }
      }),
    )
  }

  const addClaim = (qIndex: number): void => {
    setQueries((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) {
          return q
        }
        return { ...q, claims: [...q.claims, { path: '' }] }
      }),
    )
  }

  const removeClaim = (qIndex: number, cIndex: number): void => {
    setQueries((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) {
          return q
        }
        return { ...q, claims: q.claims.filter((_, j) => j !== cIndex) }
      }),
    )
  }

  const addQuery = (): void => setQueries((prev) => [...prev, emptyQuery()])
  const removeQuery = (index: number): void =>
    setQueries((prev) => prev.filter((_, i) => i !== index))

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setSuccess(null)
    setFailure(null)

    if (!name.trim()) {
      setFailure('Template name is required')
      return
    }
    if (queries.some((q) => !q.vct.trim())) {
      setFailure('Each credential query needs a VCT')
      return
    }
    if (queries.some((q) => q.claims.some((c) => !c.path.trim()))) {
      setFailure('Each claim needs at least one path segment')
      return
    }

    setCreating(true)

    const templateJson = buildTemplateJson(name, queryFormat, combine, queries)

    const payload = { name: name.trim(), signerOption, templateJson }

    try {
      const response = isEditing
        ? await updateOid4vpVerificationTemplate(
            orgId || '',
            editTemplate!.id,
            payload,
          )
        : await createOid4vpVerificationTemplate(orgId || '', payload)
      const { data } = response as AxiosResponse

      if (
        data?.statusCode === apiStatusCodes.API_STATUS_CREATED ||
        data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS
      ) {
        const message =
          (data?.message as string) ||
          (isEditing
            ? 'Verification template updated'
            : 'Verification template created')
        setSuccess(message)
        setTimeout(() => onSuccess(message), 1200)
      } else {
        const errorMessage =
          (data?.message as string) ||
          (isEditing
            ? 'Failed to update template'
            : 'Failed to create template')
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
      <CardContent className="space-y-6 pt-6">
        <h3 className="text-2xl font-bold tracking-tight">
          {isEditing
            ? 'Edit Verification Template'
            : 'Create Verification Template'}
        </h3>

        {success && (
          <AlertComponent
            message={success}
            type="success"
            onAlertClose={() => setSuccess(null)}
          />
        )}
        {failure && (
          <AlertComponent
            message={failure}
            type="failure"
            onAlertClose={() => setFailure(null)}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Template Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Signer Option *</Label>
              <Select
                value={signerOption}
                onValueChange={(v) => setSignerOption(v as SignerOption)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DID">DID</SelectItem>
                  <SelectItem value="X509_P256">X.509 (P-256)</SelectItem>
                  <SelectItem value="X509_ED25519">X.509 (Ed25519)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Query Format *</Label>
            <Select
              value={queryFormat}
              onValueChange={(v) => setQueryFormat(v as QueryFormat)}
            >
              <SelectTrigger className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dcql">DCQL</SelectItem>
                <SelectItem value="presentationExchange">
                  Presentation Exchange (PEX)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              Use Presentation Exchange for wallets built on older Credo
              versions without DCQL support.
            </p>
          </div>

          {queryFormat === 'dcql' && (
            <div className="space-y-2">
              <Label>Combine</Label>
              <Select
                value={combine}
                onValueChange={(v) => setCombine(v as 'all' | 'any')}
              >
                <SelectTrigger className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All credentials required</SelectItem>
                  <SelectItem value="any">Any credential matches</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>
                Requested Credentials ({queryFormat === 'dcql' ? 'DCQL' : 'PEX'}
                ) *
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addQuery}
              >
                <Plus className="h-4 w-4" /> Add credential query
              </Button>
            </div>

            {queries.map((q, qIndex) => (
              <Card key={q.id} className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm font-medium">
                    Credential query — {q.id}
                  </span>
                  {queries.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeQuery(qIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Select
                    value={q.format}
                    onValueChange={(v) => updateQuery(qIndex, 'format', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dc+sd-jwt">
                        SD-JWT VC (dc+sd-jwt)
                      </SelectItem>
                      <SelectItem value="mso_mdoc">mdoc (mso_mdoc)</SelectItem>
                      <SelectItem value="jwt_vc_json-ld">
                        JWT VC JSON-LD
                      </SelectItem>
                      <SelectItem value="ldp_vc">LDP VC</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="VCT to request (e.g. BirthCertificateCredential-sdjwt)"
                    value={q.vct}
                    onChange={(e) => updateQuery(qIndex, 'vct', e.target.value)}
                  />
                </div>

                {queryFormat === 'dcql' && (
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={q.requireCryptographicHolderBinding}
                      onCheckedChange={(v) =>
                        updateQuery(
                          qIndex,
                          'requireCryptographicHolderBinding',
                          v,
                        )
                      }
                    />
                    Require cryptographic holder binding
                  </label>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Claims to request</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addClaim(qIndex)}
                    >
                      <Plus className="h-4 w-4" /> Add claim
                    </Button>
                  </div>
                  {q.claims.map((c, cIndex) => (
                    <div key={cIndex} className="flex items-center gap-2">
                      <Input
                        placeholder="Path segments, comma-separated (e.g. full_name)"
                        value={c.path}
                        onChange={(e) =>
                          updateClaim(qIndex, cIndex, e.target.value)
                        }
                      />
                      {q.claims.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeClaim(qIndex, cIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating
                ? isEditing
                  ? 'Saving...'
                  : 'Creating...'
                : isEditing
                  ? 'Save Changes'
                  : 'Create Template'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default CreateVerificationTemplate
