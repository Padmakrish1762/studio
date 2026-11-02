'use client'

import { Card, CardContent } from '@/components/ui/card'
import CreateTemplate, { ExistingTemplate } from './CreateTemplate'
import OfferList, { OfferRecord } from './OfferList'
import React, { JSX, useCallback, useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TemplateList, { PaginationState } from './TemplateList'
import {
  apiStatusCodes,
  itemPerPage,
  pageCount,
  pageIndex,
  sortBy,
  sortOrder,
} from '@/config/CommonConstant'
import {
  getOid4vcCredentialOffers,
  getOid4vcIssuerById,
  getOid4vcTemplates,
} from '@/app/api/Oid4vcIssuance'

import { AlertComponent } from '@/components/AlertComponent'
import { AxiosResponse } from 'axios'
import { Button } from '@/components/ui/button'
import CreateOfferDialog from './CreateOfferDialog'
import { Features } from '@/common/enums'
import Loader from '@/components/Loader'
import PageContainer from '@/components/layout/page-container'
import { RefreshCw } from 'lucide-react'
import RoleViewButton from '@/components/RoleViewButton'
import { useAppSelector } from '@/lib/hooks'
import { useRouter } from 'next/navigation'

interface ViewIssuerProps {
  issuerId: string
}

interface IssuerDetail {
  id: string
  issuerId: string
  display?: { name?: string }[]
}

const ViewIssuer = ({ issuerId }: ViewIssuerProps): JSX.Element => {
  const orgId = useAppSelector((state) => state?.organization.orgId)
  const router = useRouter()

  const [issuer, setIssuer] = useState<IssuerDetail | null>(null)
  const [loadingIssuer, setLoadingIssuer] = useState(true)

  const [templates, setTemplates] = useState<ExistingTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [templateView, setTemplateView] = useState<'list' | 'create' | 'edit'>(
    'list',
  )
  const [editingTemplate, setEditingTemplate] = useState<
    ExistingTemplate | undefined
  >()
  const [templatePagination, setTemplatePagination] = useState<PaginationState>(
    {
      pageIndex,
      pageSize: itemPerPage,
      pageCount,
      searchTerm: '',
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc',
    },
  )

  const [offers, setOffers] = useState<OfferRecord[]>([])
  const [loadingOffers, setLoadingOffers] = useState(true)
  const [offerDialogOpen, setOfferDialogOpen] = useState(false)
  const [offerTemplate, setOfferTemplate] = useState<ExistingTemplate | null>(
    null,
  )

  const [success, setSuccess] = useState<string | null>(null)
  const [failure, setFailure] = useState<string | null>(null)

  const fetchIssuer = useCallback(async (): Promise<void> => {
    if (!orgId) {
      return
    }
    setLoadingIssuer(true)
    try {
      const response = await getOid4vcIssuerById(orgId, issuerId)
      const { data } = response as AxiosResponse
      if (data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS) {
        setIssuer(data?.data || null)
      } else {
        setFailure(data?.message || 'Failed to fetch issuer')
      }
    } catch (error) {
      setFailure((error as Error)?.message || 'Failed to fetch issuer')
    } finally {
      setLoadingIssuer(false)
    }
  }, [orgId, issuerId])

  const fetchTemplates = useCallback(async (): Promise<void> => {
    if (!orgId) {
      return
    }
    setLoadingTemplates(true)
    try {
      const response = await getOid4vcTemplates(orgId, issuerId)
      const { data } = response as AxiosResponse
      if (data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS) {
        const raw = Array.isArray(data?.data)
          ? data.data
          : data?.data?.data || []
        setTemplates(raw)
      } else {
        setFailure(data?.message || 'Failed to fetch templates')
      }
    } catch (error) {
      setFailure((error as Error)?.message || 'Failed to fetch templates')
    } finally {
      setLoadingTemplates(false)
    }
  }, [orgId, issuerId])

  const fetchOffers = useCallback(async (): Promise<void> => {
    if (!orgId || !issuer?.issuerId) {
      return
    }
    setLoadingOffers(true)
    try {
      const response = await getOid4vcCredentialOffers(orgId, {
        publicIssuerId: issuer.issuerId,
      })
      const { data } = response as AxiosResponse
      if (data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS) {
        const raw = Array.isArray(data?.data)
          ? data.data
          : data?.data?.data || []
        setOffers(raw)
      }
    } catch {
      // Non-fatal: offers tab just stays empty
    } finally {
      setLoadingOffers(false)
    }
  }, [orgId, issuer?.issuerId])

  useEffect(() => {
    fetchIssuer()
  }, [fetchIssuer])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  useEffect(() => {
    if (issuer?.issuerId) {
      fetchOffers()
    }
  }, [issuer?.issuerId, fetchOffers])

  if (loadingIssuer) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <Loader size={40} />
      </div>
    )
  }

  if (!issuer) {
    return (
      <PageContainer>
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <h3 className="mb-2 text-xl font-semibold">Issuer not found</h3>
            <Button
              variant="outline"
              onClick={() => router.push('/oid4vc-issuance/issuers')}
            >
              Back to Issuers
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {issuer.display?.[0]?.name || issuer.issuerId}
          </h2>
          <p className="text-muted-foreground mt-1">{issuer.issuerId}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/oid4vc-issuance/issuers')}
        >
          Back to Issuers
        </Button>
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

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Credential Templates</TabsTrigger>
          <TabsTrigger value="offers">Credential Offers</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-4">
          {templateView === 'create' || templateView === 'edit' ? (
            <CreateTemplate
              issuerId={issuerId}
              editTemplate={
                templateView === 'edit' ? editingTemplate : undefined
              }
              onCancel={() => {
                setTemplateView('list')
                setEditingTemplate(undefined)
              }}
              onSuccess={(msg) => {
                setSuccess(msg)
                setFailure(null)
                setTemplateView('list')
                setEditingTemplate(undefined)
                setTimeout(() => fetchTemplates(), 400)
              }}
              onFailure={(msg) => {
                setFailure(msg)
                setSuccess(null)
              }}
            />
          ) : (
            <>
              <div className="mb-4 flex justify-end gap-3">
                <Button variant="outline" onClick={() => fetchTemplates()}>
                  <RefreshCw className="h-4 w-4" /> Refresh
                </Button>
                <RoleViewButton
                  buttonTitle="Create Template"
                  feature={Features.ISSUANCE}
                  onClickEvent={() => setTemplateView('create')}
                />
              </div>
              <TemplateList
                issuerId={issuerId}
                templates={templates}
                loading={loadingTemplates}
                paginationState={templatePagination}
                onPaginationChange={setTemplatePagination}
                onRefresh={fetchTemplates}
                onEdit={(template) => {
                  setEditingTemplate(template)
                  setTemplateView('edit')
                }}
                onCreateOffer={(template) => {
                  setOfferTemplate(template)
                  setOfferDialogOpen(true)
                }}
                onSuccess={(msg) => {
                  setSuccess(msg)
                  setFailure(null)
                }}
                onFailure={(msg) => {
                  setFailure(msg)
                  setSuccess(null)
                }}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="offers" className="mt-4">
          <div className="mb-4 flex justify-end">
            <Button variant="outline" onClick={() => fetchOffers()}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>
          <OfferList
            offers={offers}
            loading={loadingOffers}
            onRefresh={fetchOffers}
            onSuccess={(msg) => {
              setSuccess(msg)
              setFailure(null)
            }}
            onFailure={(msg) => {
              setFailure(msg)
              setSuccess(null)
            }}
          />
        </TabsContent>
      </Tabs>

      <CreateOfferDialog
        issuerId={issuerId}
        template={offerTemplate}
        open={offerDialogOpen}
        onOpenChange={setOfferDialogOpen}
        onOfferCreated={() => fetchOffers()}
      />
    </PageContainer>
  )
}

export default ViewIssuer
