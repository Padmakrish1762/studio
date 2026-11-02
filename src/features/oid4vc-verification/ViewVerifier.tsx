'use client'

import CreateVerificationTemplate, {
  ExistingVerificationTemplate,
} from './CreateVerificationTemplate'
import PresentationList, { PresentationRecord } from './PresentationList'
import React, { JSX, useCallback, useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  getOid4vpVerificationTemplates,
  getOid4vpVerifierPresentations,
} from '@/app/api/Oid4vcVerification'

import { AlertComponent } from '@/components/AlertComponent'
import { AxiosResponse } from 'axios'
import { Button } from '@/components/ui/button'
import { Features } from '@/common/enums'
import Loader from '@/components/Loader'
import PageContainer from '@/components/layout/page-container'
import PresentationRequestDialog from './PresentationRequestDialog'
import { RefreshCw } from 'lucide-react'
import RoleViewButton from '@/components/RoleViewButton'
import VerificationTemplateList from './VerificationTemplateList'
import { apiStatusCodes } from '@/config/CommonConstant'
import { useAppSelector } from '@/lib/hooks'
import { useRouter } from 'next/navigation'

interface ViewVerifierProps {
  verifierId: string
}

const ViewVerifier = ({ verifierId }: ViewVerifierProps): JSX.Element => {
  const orgId = useAppSelector((state) => state?.organization.orgId)
  const router = useRouter()

  const [templates, setTemplates] = useState<ExistingVerificationTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [templateView, setTemplateView] = useState<'list' | 'create' | 'edit'>(
    'list',
  )
  const [editingTemplate, setEditingTemplate] = useState<
    ExistingVerificationTemplate | undefined
  >()

  const [presentations, setPresentations] = useState<PresentationRecord[]>([])
  const [loadingPresentations, setLoadingPresentations] = useState(true)
  const [requestDialogOpen, setRequestDialogOpen] = useState(false)
  const [requestTemplate, setRequestTemplate] =
    useState<ExistingVerificationTemplate | null>(null)

  const [success, setSuccess] = useState<string | null>(null)
  const [failure, setFailure] = useState<string | null>(null)

  const fetchTemplates = useCallback(async (): Promise<void> => {
    if (!orgId) {
      return
    }
    setLoadingTemplates(true)
    try {
      const response = await getOid4vpVerificationTemplates(orgId)
      const { data } = response as AxiosResponse
      if (data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS) {
        const raw = Array.isArray(data?.data)
          ? data.data
          : data?.data?.data || []
        setTemplates(raw)
      } else {
        setFailure(data?.message || 'Failed to fetch verification templates')
      }
    } catch (error) {
      setFailure(
        (error as Error)?.message || 'Failed to fetch verification templates',
      )
    } finally {
      setLoadingTemplates(false)
    }
  }, [orgId])

  const fetchPresentations = useCallback(async (): Promise<void> => {
    if (!orgId) {
      return
    }
    setLoadingPresentations(true)
    try {
      const response = await getOid4vpVerifierPresentations(orgId)
      const { data } = response as AxiosResponse
      if (data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS) {
        const raw = Array.isArray(data?.data)
          ? data.data
          : data?.data?.data || []
        setPresentations(raw)
      }
    } catch {
      // non-fatal
    } finally {
      setLoadingPresentations(false)
    }
  }, [orgId])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  useEffect(() => {
    fetchPresentations()
  }, [fetchPresentations])

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Verifier</h2>
          <p className="text-muted-foreground mt-1">{verifierId}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/oid4vc-verification/verifiers')}
        >
          Back to Verifiers
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
          <TabsTrigger value="templates">Verification Templates</TabsTrigger>
          <TabsTrigger value="presentations">Presentation Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-4">
          {templateView === 'create' || templateView === 'edit' ? (
            <CreateVerificationTemplate
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
                  feature={Features.VERIFICATION}
                  onClickEvent={() => setTemplateView('create')}
                />
              </div>
              {loadingTemplates && templates.length === 0 ? (
                <div className="flex min-h-[200px] items-center justify-center">
                  <Loader size={32} />
                </div>
              ) : (
                <VerificationTemplateList
                  templates={templates}
                  loading={loadingTemplates}
                  onRefresh={fetchTemplates}
                  onEdit={(template) => {
                    setEditingTemplate(template)
                    setTemplateView('edit')
                  }}
                  onRequestPresentation={(template) => {
                    setRequestTemplate(template)
                    setRequestDialogOpen(true)
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
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="presentations" className="mt-4">
          <div className="mb-4 flex justify-end">
            <Button variant="outline" onClick={() => fetchPresentations()}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>
          <PresentationList
            presentations={presentations}
            loading={loadingPresentations}
          />
        </TabsContent>
      </Tabs>

      <PresentationRequestDialog
        verifierId={verifierId}
        template={requestTemplate}
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        onRequestCreated={() => fetchPresentations()}
      />
    </PageContainer>
  )
}

export default ViewVerifier
