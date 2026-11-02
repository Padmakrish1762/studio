'use client'

import { Ban, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  IColumnData,
  ITableMetadata,
  TableStyling,
  getColumns,
} from '@/components/ui/generic-table-component/columns'
import React, { JSX } from 'react'

import { AxiosResponse } from 'axios'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CellContext } from '@tanstack/react-table'
import ConfirmationModal from '@/components/confirmation-modal'
import { DataTable } from '@/components/ui/generic-table-component/data-table'
import { DateCell } from '../organization/connectionIssuance/components/CredentialTableCells'
import { apiStatusCodes } from '@/config/CommonConstant'
import { revokeOid4vcIssuanceSession } from '@/app/api/Oid4vcIssuance'
import { useAppSelector } from '@/lib/hooks'

export interface OfferRecord {
  id: string
  credentialOfferId?: string
  state: string
  createdAt?: string
  credentialOfferPayload?: { credential_configuration_ids?: string[] }
}

interface OfferListProps {
  offers: OfferRecord[]
  loading: boolean
  onRefresh: () => void
  onSuccess: (message: string | null) => void
  onFailure: (message: string | null) => void
}

const stateBadgeVariant = (
  state: string,
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const normalized = state?.toLowerCase() || ''
  if (
    normalized.includes('error') ||
    normalized.includes('revoked') ||
    normalized.includes('fail')
  ) {
    return 'destructive'
  }
  if (
    normalized.includes('issued') ||
    normalized.includes('done') ||
    normalized.includes('complete')
  ) {
    return 'default'
  }
  if (
    normalized.includes('offer') ||
    normalized.includes('pending') ||
    normalized.includes('created')
  ) {
    return 'secondary'
  }
  return 'outline'
}

const StateCell = ({ row }: CellContext<OfferRecord, unknown>): JSX.Element => (
  <Badge variant={stateBadgeVariant(row.original.state)}>
    {row.original.state || 'unknown'}
  </Badge>
)

const CreatedCell = ({
  row,
}: CellContext<OfferRecord, unknown>): JSX.Element => {
  if (!row.original.createdAt) {
    return <span>—</span>
  }
  return <DateCell date={row.original.createdAt} />
}

const ConfigIdsCell = ({
  row,
}: CellContext<OfferRecord, unknown>): JSX.Element => (
  <span className="text-muted-foreground max-w-[220px] truncate text-xs">
    {row.original.credentialOfferPayload?.credential_configuration_ids?.join(
      ', ',
    ) || '—'}
  </span>
)

const OfferList = ({
  offers,
  loading,
  onRefresh,
  onSuccess,
  onFailure,
}: OfferListProps): JSX.Element => {
  const orgId = useAppSelector((state) => state?.organization.orgId)

  const [showConfirmModal, setShowConfirmModal] = React.useState(false)
  const [selected, setSelected] = React.useState<OfferRecord | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(
    null,
  )
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [actionLoading, setActionLoading] = React.useState(false)

  const handleRevoke = async (): Promise<void> => {
    if (!selected) {
      return
    }
    setActionLoading(true)
    try {
      const response = await revokeOid4vcIssuanceSession(
        orgId || '',
        selected.id,
      )
      const { data } = response as AxiosResponse

      if (data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS) {
        setSuccessMessage(data.message)
        onSuccess(data.message)
        onRefresh()
        setShowConfirmModal(false)
        setSelected(null)
      } else {
        setErrorMessage(data?.message)
        onFailure(data?.message)
      }
    } catch (error) {
      const msg =
        (error as Error)?.message || 'Failed to revoke issuance session'
      setErrorMessage(msg)
      onFailure(msg)
    } finally {
      setActionLoading(false)
    }
  }

  const actionCell = ({
    row,
  }: {
    row: { original: OfferRecord }
  }): JSX.Element => {
    const offer = row.original
    const isRevoked = offer.state?.toLowerCase().includes('revoked')
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            disabled={isRevoked}
            onClick={() => {
              setSuccessMessage(null)
              setErrorMessage(null)
              setSelected(offer)
              setShowConfirmModal(true)
            }}
          >
            <Ban className="mr-2 h-4 w-4" />
            Revoke
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const columnData: IColumnData[] = [
    {
      id: 'state',
      title: 'Status',
      accessorKey: 'state',
      cell: StateCell,
      columnFunction: [],
    },
    {
      id: 'credentialConfigurationIds',
      title: 'Credential Config',
      accessorKey: 'credentialOfferPayload',
      cell: ConfigIdsCell,
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
      title: 'Actions',
      accessorKey: 'actions',
      cell: actionCell,
      columnFunction: [],
    },
  ]

  const metadata: ITableMetadata = { enableSelection: false }
  const tableStyling: TableStyling = { metadata, columnData }
  const columns = getColumns<OfferRecord>(tableStyling)

  return (
    <Card className="p-4">
      {showConfirmModal && selected && (
        <ConfirmationModal
          openModal={showConfirmModal}
          buttonTitles={['Cancel', 'Revoke']}
          loading={actionLoading}
          closeModal={() => {
            setShowConfirmModal(false)
            setSelected(null)
            setSuccessMessage(null)
            setErrorMessage(null)
          }}
          onSuccess={(confirmed) => confirmed && handleRevoke()}
          message="Are you sure you want to revoke this credential offer / issuance session?"
          isProcessing={actionLoading}
          success={successMessage}
          failure={errorMessage}
          setSuccess={setSuccessMessage}
          setFailure={setErrorMessage}
        />
      )}

      <DataTable
        isLoading={loading}
        placeHolder="Search offers..."
        data={offers}
        columns={columns}
        index="id"
        pageIndex={0}
        pageSize={offers.length || 10}
        pageCount={1}
        onPageChange={() => undefined}
        onPageSizeChange={() => undefined}
        onSearchTerm={() => undefined}
      />
    </Card>
  )
}

export default OfferList
