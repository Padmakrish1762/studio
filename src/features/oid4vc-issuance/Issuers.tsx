'use client'

import { Card, CardContent } from '@/components/ui/card'
import IssuerList, { IssuerRecord } from './IssuerList'
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
import CreateIssuer from './CreateIssuer'
import { Features } from '@/common/enums'
import Loader from '@/components/Loader'
import PageContainer from '@/components/layout/page-container'
import { PaginationState } from '@/common/interface'
import { RefreshCw } from 'lucide-react'
import RoleViewButton from '@/components/RoleViewButton'
import { getOid4vcIssuers } from '@/app/api/Oid4vcIssuance'
import { useAppSelector } from '@/lib/hooks'

const Issuers = (): JSX.Element => {
  const [view, setView] = useState<'list' | 'create'>('list')
  const [issuers, setIssuers] = useState<IssuerRecord[]>([])
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

  const fetchIssuers = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      const response = await getOid4vcIssuers(orgId || '')
      const { data } = response as AxiosResponse

      if (data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS) {
        const raw = Array.isArray(data?.data)
          ? data.data
          : data?.data?.data || data?.data?.issuers || []
        setIssuers(raw)
        setPaginationState((prev) => ({
          ...prev,
          pageCount: data?.data?.lastPage ?? 1,
        }))
      } else {
        setFailure(data?.message || 'Failed to fetch issuers')
      }
    } catch (error) {
      setFailure((error as Error)?.message || 'Failed to fetch issuers')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    if (orgId && view === 'list') {
      fetchIssuers()
    }
  }, [
    orgId,
    view,
    paginationState.pageIndex,
    paginationState.pageSize,
    fetchIssuers,
  ])

  const handleCreateSuccess = (message: string): void => {
    setSuccess(message)
    setView('list')
    setTimeout(() => fetchIssuers(), 500)
  }

  const handleCreateFailure = (message: string): void => {
    setFailure(message)
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
                Please create an organization to manage OID4VC issuers.
              </p>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  if (loading && view === 'list' && issuers.length === 0) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="space-y-4 text-center">
          <Loader size={40} />
          <div>
            <p className="text-lg font-medium">Loading issuers</p>
          </div>
        </div>
      </div>
    )
  }

  const renderContent = (): JSX.Element => {
    if (view === 'create') {
      return (
        <CreateIssuer
          onCancel={() => setView('list')}
          onSuccess={handleCreateSuccess}
          onFailure={handleCreateFailure}
        />
      )
    }

    if (issuers.length === 0) {
      return (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            {renderAlerts()}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  OID4VC Issuers
                </h2>
                <p className="text-muted-foreground mt-1">
                  Issue credentials using the OpenID4VCI standard
                </p>
              </div>
              <RoleViewButton
                buttonTitle="Create Issuer"
                feature={Features.ISSUANCE}
                onClickEvent={() => setView('create')}
              />
            </div>
            <div className="flex flex-col items-center justify-center px-4 py-16">
              <h3 className="mb-3 text-2xl font-semibold">No issuers yet</h3>
              <p className="text-muted-foreground mb-8 max-w-md text-center">
                Get started by registering an OID4VC issuer for this
                organization.
              </p>
              <RoleViewButton
                buttonTitle="Create Issuer"
                feature={Features.ISSUANCE}
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
              OID4VC Issuers
            </h2>
            <p className="text-muted-foreground mt-1">
              Issue credentials using the OpenID4VCI standard
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => fetchIssuers()}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <RoleViewButton
              buttonTitle="Create Issuer"
              feature={Features.ISSUANCE}
              onClickEvent={() => setView('create')}
            />
          </div>
        </div>

        <IssuerList
          issuers={issuers}
          loading={loading}
          paginationState={paginationState}
          onPaginationChange={setPaginationState}
          onRefresh={fetchIssuers}
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

export default Issuers
