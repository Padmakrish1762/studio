'use client'

import { Card, CardContent } from '@/components/ui/card'
import CreateVerifier, { ExistingVerifier } from './CreateVerifier'
import React, { JSX, useCallback, useEffect, useState } from 'react'
import {
  apiStatusCodes,
  itemPerPage,
  pageCount,
  pageIndex,
  sortBy,
  sortOrder,
} from '@/config/CommonConstant'

import { AlertComponent } from '@/components/AlertComponent'
import { AxiosResponse } from 'axios'
import { Button } from '@/components/ui/button'
import { Features } from '@/common/enums'
import Loader from '@/components/Loader'
import PageContainer from '@/components/layout/page-container'
import { PaginationState } from '@/common/interface'
import { RefreshCw } from 'lucide-react'
import RoleViewButton from '@/components/RoleViewButton'
import VerifierList from './VerifierList'
import { getOid4vpVerifiers } from '@/app/api/Oid4vcVerification'
import { useAppSelector } from '@/lib/hooks'

const Verifiers = (): JSX.Element => {
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list')
  const [verifiers, setVerifiers] = useState<ExistingVerifier[]>([])
  const [editingVerifier, setEditingVerifier] = useState<
    ExistingVerifier | undefined
  >()
  const [loading, setLoading] = useState<boolean>(true)
  const [success, setSuccess] = useState<string | null>(null)
  const [failure, setFailure] = useState<string | null>(null)
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex,
    pageSize: itemPerPage,
    pageCount,
    searchTerm: '',
    sortBy,
    sortOrder,
  })

  const orgId = useAppSelector((state) => state?.organization.orgId)

  useEffect(() => {
    setSuccess(null)
    setFailure(null)
  }, [view])

  const fetchVerifiers = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      const response = await getOid4vpVerifiers(orgId || '')
      const { data } = response as AxiosResponse

      if (data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS) {
        const raw = Array.isArray(data?.data)
          ? data.data
          : data?.data?.data || []
        setVerifiers(raw)
        setPaginationState((prev) => ({
          ...prev,
          pageCount: data?.data?.lastPage ?? 1,
        }))
      } else {
        setFailure(data?.message || 'Failed to fetch verifiers')
      }
    } catch (error) {
      setFailure((error as Error)?.message || 'Failed to fetch verifiers')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    if (orgId && view === 'list') {
      fetchVerifiers()
    }
  }, [
    orgId,
    view,
    paginationState.pageIndex,
    paginationState.pageSize,
    fetchVerifiers,
  ])

  const handleSuccess = (message: string): void => {
    setSuccess(message)
    setView('list')
    setEditingVerifier(undefined)
    setTimeout(() => fetchVerifiers(), 500)
  }

  const renderAlerts = (): JSX.Element => (
    <>
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
    </>
  )

  if (!orgId && view === 'list') {
    return (
      <PageContainer>
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
              <h3 className="mb-2 text-2xl font-semibold">
                No organization created
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Please create an organization to manage OID4VP verifiers.
              </p>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  if (loading && view === 'list' && verifiers.length === 0) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <Loader size={40} />
      </div>
    )
  }

  const renderContent = (): JSX.Element => {
    if (view === 'create' || view === 'edit') {
      return (
        <CreateVerifier
          editVerifier={view === 'edit' ? editingVerifier : undefined}
          onCancel={() => {
            setView('list')
            setEditingVerifier(undefined)
          }}
          onSuccess={handleSuccess}
          onFailure={(message) => setFailure(message)}
        />
      )
    }

    if (verifiers.length === 0) {
      return (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            {renderAlerts()}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  OID4VP Verifiers
                </h2>
                <p className="text-muted-foreground mt-1">
                  Verify credentials using the OpenID4VP standard
                </p>
              </div>
              <RoleViewButton
                buttonTitle="Create Verifier"
                feature={Features.VERIFICATION}
                onClickEvent={() => setView('create')}
              />
            </div>
            <div className="flex flex-col items-center justify-center px-4 py-16">
              <h3 className="mb-3 text-2xl font-semibold">No verifiers yet</h3>
              <p className="text-muted-foreground mb-8 max-w-md text-center">
                Get started by registering an OID4VP verifier for this
                organization.
              </p>
              <RoleViewButton
                buttonTitle="Create Verifier"
                feature={Features.VERIFICATION}
                onClickEvent={() => setView('create')}
              />
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <>
        {renderAlerts()}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              OID4VP Verifiers
            </h2>
            <p className="text-muted-foreground mt-1">
              Verify credentials using the OpenID4VP standard
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => fetchVerifiers()}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <RoleViewButton
              buttonTitle="Create Verifier"
              feature={Features.VERIFICATION}
              onClickEvent={() => setView('create')}
            />
          </div>
        </div>

        <VerifierList
          verifiers={verifiers}
          loading={loading}
          paginationState={paginationState}
          onPaginationChange={setPaginationState}
          onRefresh={fetchVerifiers}
          onEdit={(verifier) => {
            setEditingVerifier(verifier)
            setView('edit')
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
    )
  }

  return <PageContainer>{renderContent()}</PageContainer>
}

export default Verifiers
