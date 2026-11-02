'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  IColumnData,
  ITableMetadata,
  TableStyling,
  getColumns,
} from '@/components/ui/generic-table-component/columns'
import React, { JSX, useState } from 'react'

import { AxiosResponse } from 'axios'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CellContext } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/generic-table-component/data-table'
import { DateCell } from '../organization/connectionIssuance/components/CredentialTableCells'
import { Eye } from 'lucide-react'
import { apiStatusCodes } from '@/config/CommonConstant'
import { getOid4vpVerifierPresentationResponse } from '@/app/api/Oid4vcVerification'
import { useAppSelector } from '@/lib/hooks'

export interface PresentationRecord {
  id: string
  state: string
  createdAt?: string
}

interface PresentationListProps {
  presentations: PresentationRecord[]
  loading: boolean
}

const stateBadgeVariant = (
  state: string,
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const normalized = state?.toLowerCase() || ''
  if (
    normalized.includes('error') ||
    normalized.includes('fail') ||
    normalized.includes('invalid')
  ) {
    return 'destructive'
  }
  if (
    normalized.includes('verified') ||
    normalized.includes('success') ||
    normalized.includes('done')
  ) {
    return 'default'
  }
  if (normalized.includes('request') || normalized.includes('pending')) {
    return 'secondary'
  }
  return 'outline'
}

const StateCell = ({
  row,
}: CellContext<PresentationRecord, unknown>): JSX.Element => (
  <Badge variant={stateBadgeVariant(row.original.state)}>
    {row.original.state || 'unknown'}
  </Badge>
)

const CreatedCell = ({
  row,
}: CellContext<PresentationRecord, unknown>): JSX.Element => {
  if (!row.original.createdAt) {
    return <span>—</span>
  }
  return <DateCell date={row.original.createdAt} />
}

const PresentationList = ({
  presentations,
  loading,
}: PresentationListProps): JSX.Element => {
  const orgId = useAppSelector((state) => state?.organization.orgId)

  const [resultOpen, setResultOpen] = useState(false)
  const [resultLoading, setResultLoading] = useState(false)
  const [resultData, setResultData] = useState<unknown>(null)
  const [resultError, setResultError] = useState<string | null>(null)

  const viewResult = async (
    verificationPresentationId: string,
  ): Promise<void> => {
    setResultOpen(true)
    setResultLoading(true)
    setResultError(null)
    setResultData(null)
    try {
      const response = await getOid4vpVerifierPresentationResponse(
        orgId || '',
        verificationPresentationId,
      )
      const { data } = response as AxiosResponse
      if (data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS) {
        setResultData(data?.data)
      } else {
        setResultError(data?.message || 'Failed to fetch result')
      }
    } catch (error) {
      setResultError((error as Error)?.message || 'Failed to fetch result')
    } finally {
      setResultLoading(false)
    }
  }

  const actionCell = ({
    row,
  }: {
    row: { original: PresentationRecord }
  }): JSX.Element => (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => viewResult(row.original.id)}
    >
      <Eye className="h-4 w-4" />
    </Button>
  )

  const columnData: IColumnData[] = [
    {
      id: 'state',
      title: 'Status',
      accessorKey: 'state',
      cell: StateCell,
      columnFunction: [],
    },
    {
      id: 'createdAt',
      title: 'Created',
      accessorKey: 'createdAt',
      cell: CreatedCell,
      columnFunction: [],
    },
    {
      id: 'actions',
      title: 'Result',
      accessorKey: 'actions',
      cell: actionCell,
      columnFunction: [],
    },
  ]

  const metadata: ITableMetadata = { enableSelection: false }
  const tableStyling: TableStyling = { metadata, columnData }
  const columns = getColumns<PresentationRecord>(tableStyling)

  return (
    <Card className="p-4">
      <DataTable
        isLoading={loading}
        placeHolder="Search presentation requests..."
        data={presentations}
        columns={columns}
        index="id"
        pageIndex={0}
        pageSize={presentations.length || 10}
        pageCount={1}
        onPageChange={() => undefined}
        onPageSizeChange={() => undefined}
        onSearchTerm={() => undefined}
      />

      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="max-h-[80vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Verification Result</DialogTitle>
          </DialogHeader>
          {resultLoading && (
            <p className="text-muted-foreground text-sm">Loading...</p>
          )}
          {resultError && (
            <p className="text-destructive text-sm">{resultError}</p>
          )}
          {resultData !== null && !resultLoading && (
            <pre className="bg-muted max-h-96 overflow-auto rounded-md p-3 text-xs">
              {JSON.stringify(resultData, null, 2)}
            </pre>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default PresentationList
