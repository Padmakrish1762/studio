'use client'

import { Card, CardContent } from '@/components/ui/card'
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
  createOid4vcTemplate,
  updateOid4vcTemplate,
} from '@/app/api/Oid4vcIssuance'

import { AlertComponent } from '@/components/AlertComponent'
import { AxiosResponse } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { apiStatusCodes } from '@/config/CommonConstant'
import { useAppSelector } from '@/lib/hooks'

type CredentialFormat = 'dc+sd-jwt' | 'mso_mdoc' | 'jwt_vc_json-ld' | 'ldp_vc'
type SignerOption = 'DID' | 'X509_P256' | 'X509_ED25519'
type ValueType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'object'
  | 'array'
  | 'image'

interface AttributeRow {
  key: string
  value_type: ValueType
  mandatory: boolean
  disclose: boolean
}

export interface ExistingTemplate {
  id: string
  name: string
  description?: string
  format: CredentialFormat
  signerOption: SignerOption
  canBeRevoked: boolean
  noticeUrl?: string
  attributes?: {
    vct?: string
    doctype?: string
    schemaUrl?: string
    attributes?: AttributeRow[]
    namespaces?: { namespace: string; attributes: AttributeRow[] }[]
  }
  appearance?: { display?: { name?: string; locale?: string }[] }
}

interface CreateTemplateProps {
  issuerId: string
  editTemplate?: ExistingTemplate
  onCancel: () => void
  onSuccess: (message: string) => void
  onFailure: (message: string) => void
}

const emptyAttribute = (): AttributeRow => ({
  key: '',
  ['value_type']: 'string',
  mandatory: true,
  disclose: true,
})

const CreateTemplate = ({
  issuerId,
  editTemplate,
  onCancel,
  onSuccess,
  onFailure,
}: CreateTemplateProps): JSX.Element => {
  const orgId = useAppSelector((state) => state?.organization.orgId)
  const isEditing = Boolean(editTemplate)

  const [name, setName] = useState(editTemplate?.name || '')
  const [description, setDescription] = useState(
    editTemplate?.description || '',
  )
  const [format, setFormat] = useState<CredentialFormat>(
    editTemplate?.format || 'dc+sd-jwt',
  )
  const [signerOption, setSignerOption] = useState<SignerOption>(
    editTemplate?.signerOption || 'DID',
  )
  const [vct, setVct] = useState(editTemplate?.attributes?.vct || '')
  const [schemaUrl, setSchemaUrl] = useState(
    editTemplate?.attributes?.schemaUrl || '',
  )
  const [doctype, setDoctype] = useState(
    editTemplate?.attributes?.doctype || '',
  )
  const [namespace, setNamespace] = useState(
    editTemplate?.attributes?.namespaces?.[0]?.namespace || '',
  )
  const [attributes, setAttributes] = useState<AttributeRow[]>(
    editTemplate?.attributes?.namespaces?.[0]?.attributes ||
      editTemplate?.attributes?.attributes || [emptyAttribute()],
  )
  const [canBeRevoked, setCanBeRevoked] = useState(
    editTemplate?.canBeRevoked || false,
  )
  const [noticeUrl, setNoticeUrl] = useState(editTemplate?.noticeUrl || '')
  const [displayName, setDisplayName] = useState(
    editTemplate?.appearance?.display?.[0]?.name || '',
  )
  const [displayLocale, setDisplayLocale] = useState(
    editTemplate?.appearance?.display?.[0]?.locale || 'en',
  )

  const [creating, setCreating] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [failure, setFailure] = useState<string | null>(null)

  const updateAttribute = (
    index: number,
    field: keyof AttributeRow,
    value: string | boolean,
  ): void => {
    setAttributes((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)),
    )
  }

  const addAttribute = (): void =>
    setAttributes((prev) => [...prev, emptyAttribute()])

  const removeAttribute = (index: number): void =>
    setAttributes((prev) => prev.filter((_, i) => i !== index))

  const isMdoc = format === 'mso_mdoc'

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setSuccess(null)
    setFailure(null)

    if (!name.trim()) {
      setFailure('Template name is required')
      return
    }
    if (isMdoc && !doctype.trim()) {
      setFailure('Document type is required for mdoc templates')
      return
    }
    if (!isMdoc && !vct.trim()) {
      setFailure('Verifiable Credential Type (vct) is required')
      return
    }
    if (isMdoc && !namespace.trim()) {
      setFailure('Namespace is required for mdoc templates')
      return
    }
    if (attributes.some((a) => !a.key.trim())) {
      setFailure('Every attribute needs a key')
      return
    }
    if (signerOption !== 'DID' && isMdoc === false) {
      // allowed per backend - X509 is fine for non-mdoc too
    }

    setCreating(true)

    const attributePayload = attributes.map((a) => ({
      key: a.key.trim(),
      ['value_type']: a.value_type,
      mandatory: a.mandatory,
      disclose: a.disclose,
    }))

    const template = isMdoc
      ? {
          doctype: doctype.trim(),
          namespaces: [
            { namespace: namespace.trim(), attributes: attributePayload },
          ],
        }
      : {
          vct: vct.trim(),
          ...(schemaUrl.trim() ? { schemaUrl: schemaUrl.trim() } : {}),
          attributes: attributePayload,
        }

    const payload: Record<string, unknown> = {
      name: name.trim(),
      ...(description.trim() ? { description: description.trim() } : {}),
      signerOption,
      format,
      template,
      canBeRevoked,
      ...(noticeUrl.trim() ? { noticeUrl: noticeUrl.trim() } : {}),
      ...(displayName.trim()
        ? {
            appearance: {
              display: [
                {
                  locale: displayLocale.trim() || 'en',
                  name: displayName.trim(),
                },
              ],
            },
          }
        : {}),
    }

    try {
      const response = isEditing
        ? await updateOid4vcTemplate(
            orgId || '',
            issuerId,
            editTemplate!.id,
            payload,
          )
        : await createOid4vcTemplate(orgId || '', issuerId, payload)
      const { data } = response as AxiosResponse

      if (
        data?.statusCode === apiStatusCodes.API_STATUS_CREATED ||
        data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS
      ) {
        const message =
          (data?.message as string) ||
          (isEditing
            ? 'Template updated successfully'
            : 'Template created successfully')
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
        <div>
          <h3 className="text-2xl font-bold tracking-tight">
            {isEditing
              ? 'Edit Credential Template'
              : 'Create Credential Template'}
          </h3>
        </div>

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
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Birth Certificate"
              />
            </div>
            <div className="space-y-2">
              <Label>Format *</Label>
              <Select
                value={format}
                onValueChange={(v) => setFormat(v as CredentialFormat)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dc+sd-jwt">
                    SD-JWT VC (dc+sd-jwt)
                  </SelectItem>
                  <SelectItem value="mso_mdoc">mdoc (mso_mdoc)</SelectItem>
                  <SelectItem value="jwt_vc_json-ld">JWT VC JSON-LD</SelectItem>
                  <SelectItem value="ldp_vc">LDP VC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
                  <SelectItem value="DID">
                    DID (use org&apos;s existing DID)
                  </SelectItem>
                  <SelectItem value="X509_P256">X.509 (P-256)</SelectItem>
                  <SelectItem value="X509_ED25519">X.509 (Ed25519)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                X.509 options require an active certificate under Trust &rarr;
                x509.
              </p>
            </div>

            {isMdoc ? (
              <div className="space-y-2">
                <Label>Document Type (doctype) *</Label>
                <Input
                  value={doctype}
                  onChange={(e) => setDoctype(e.target.value)}
                  placeholder="org.iso.18013.5.1.mDL"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Verifiable Credential Type (vct) *</Label>
                <Input
                  value={vct}
                  onChange={(e) => setVct(e.target.value)}
                  placeholder="BirthCertificateCredential-sdjwt"
                />
              </div>
            )}
          </div>

          {isMdoc ? (
            <div className="space-y-2">
              <Label>Namespace *</Label>
              <Input
                value={namespace}
                onChange={(e) => setNamespace(e.target.value)}
                placeholder="org.iso.18013.5.1"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Schema URL (optional)</Label>
              <Input
                value={schemaUrl}
                onChange={(e) => setSchemaUrl(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Attributes *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAttribute}
              >
                <Plus className="h-4 w-4" /> Add attribute
              </Button>
            </div>
            {attributes.map((a, index) => (
              <Card key={index} className="p-4">
                <div className="grid items-end gap-3 md:grid-cols-5">
                  <Input
                    placeholder="key (e.g. full_name)"
                    value={a.key}
                    onChange={(e) =>
                      updateAttribute(index, 'key', e.target.value)
                    }
                  />
                  <Select
                    value={a.value_type}
                    onValueChange={(v) =>
                      updateAttribute(index, 'value_type', v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        [
                          'string',
                          'number',
                          'boolean',
                          'date',
                          'object',
                          'array',
                          'image',
                        ] as ValueType[]
                      ).map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={a.mandatory}
                      onCheckedChange={(v) =>
                        updateAttribute(index, 'mandatory', v)
                      }
                    />
                    Mandatory
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={a.disclose}
                      onCheckedChange={(v) =>
                        updateAttribute(index, 'disclose', v)
                      }
                    />
                    Disclose
                  </label>
                  {attributes.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAttribute(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Display Name (optional, for appearance)</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Display Locale</Label>
              <Input
                value={displayLocale}
                onChange={(e) => setDisplayLocale(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notice URL (optional)</Label>
            <Input
              value={noticeUrl}
              onChange={(e) => setNoticeUrl(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Switch checked={canBeRevoked} onCheckedChange={setCanBeRevoked} />
            Can be revoked
          </label>

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

export default CreateTemplate
