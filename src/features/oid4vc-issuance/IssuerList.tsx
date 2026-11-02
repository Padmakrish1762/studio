'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Eye, MoreVertical, Trash2 } from 'lucide-react'
import {
  IColumnData,
  ITableMetadata,
  TableStyling,
  getColumns,
} from '@/components/ui/generic-table-component/columns'
import React, { Dispatch, JSX, SetStateAction } from 'react'

import { AxiosResponse } from 'axios'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CellContext } from '@tanstack/react-table'
import ConfirmationModal from '@/components/confirmation-modal'
import { DataTable } from '@/components/ui/generic-table-component/data-table'
import { DateCell } from '../organization/connectionIssuance/components/CredentialTableCells'
import { apiStatusCodes } from '@/config/CommonConstant'
import { deleteOid4vcIssuer } from '@/app/api/Oid4vcIssuance'
import { useAppSelector } from '@/lib/hooks'
import { useRouter } from 'next/navigation'

export interface IssuerRecord {
  id: string
  issuerId: string
  publicIssuerId: string
  authorizationServerUrl: string
  createDateTime?: string
  metadata?: { name?: string; locale?: string }[]
}

export interface PaginationState {
  pageIndex: number
  pageSize: number
  pageCount: number
  searchTerm: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

interface IssuerListProps {
  issuers: IssuerRecord[]
  loading: boolean
  paginationState: PaginationState
  onPaginationChange: Dispatch<SetStateAction<PaginationState>>
  onRefresh: () => void
  onSuccess: (message: string | null) => void
  onFailure: (message: string | null) => void
}

const NameCell = ({ row }: CellContext<IssuerRecord, unknown>): JSX.Element => (
  <span className="max-w-[220px] truncate text-sm font-medium">
    {row.original.metadata?.[0]?.name || row.original.issuerId || '—'}
  </span>
)

const PublicIdCell = ({
  row,
}: CellContext<IssuerRecord, unknown>): JSX.Element => (
  <span className="text-muted-foreground max-w-[220px] truncate text-sm">
    {row.original.publicIssuerId || '—'}
  </span>
)

const AuthServerCell = ({
  row,
}: CellContext<IssuerRecord, unknown>): JSX.Element => (
  <span className="max-w-[260px] truncate text-sm">
    {row.original.authorizationServerUrl || '—'}
  </span>
)

const CreatedCell = ({
  row,
}: CellContext<IssuerRecord, unknown>): JSX.Element => {
  if (!row.original.createDateTime) {
    return <span>—</span>
  }
  return <DateCell date={row.original.createDateTime} />
}

const IssuerList = ({
  issuers,
  loading,
  paginationState,
  onPaginationChange,
  onRefresh,
  onSuccess,
  onFailure,
}: IssuerListProps): JSX.Element => {
  const orgId = useAppSelector((state) => state?.organization.orgId)
  const router = useRouter()

  const [showConfirmModal, setShowConfirmModal] = React.useState(false)
  const [selectedIssuer, setSelectedIssuer] =
    React.useState<IssuerRecord | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(
    null,
  )
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [actionLoading, setActionLoading] = React.useState(false)

  const handleDelete = async (): Promise<void> => {
    if (!selectedIssuer) {
      return
    }
    setActionLoading(true)
    try {
      const response = await deleteOid4vcIssuer(orgId || '', selectedIssuer.id)
      const { data } = response as AxiosResponse

      if (
        data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS ||
        data?.statusCode === apiStatusCodes.API_STATUS_DELETED
      ) {
        setSuccessMessage(data.message)
        onSuccess(data.message)
        onRefresh()
        setShowConfirmModal(false)
        setSelectedIssuer(null)
      } else {
        setErrorMessage(data?.message)
        onFailure(data?.message)
      }
    } catch (error) {
      const msg = (error as Error)?.message || 'Failed to delete issuer'
      setErrorMessage(msg)
      onFailure(msg)
    } finally {
      setActionLoading(false)
    }
  }

  const actionCell = ({
    row,
  }: {
    row: { original: IssuerRecord }
  }): JSX.Element => {
    const issuer = row.original
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onClick={() => router.push(`/oid4vc-issuance/issuers/${issuer.id}`)}
          >
            <Eye className="mr-2 h-4 w-4" />
            View / Manage
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setSuccessMessage(null)
              setErrorMessage(null)
              setSelectedIssuer(issuer)
              setShowConfirmModal(true)
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const columnData: IColumnData[] = [
    {
      id: 'name',
      title: 'Name',
      accessorKey: 'metadata',
      cell: NameCell,
      columnFunction: [],
    },
    {
      id: 'publicIssuerId',
      title: 'Public Issuer ID',
      accessorKey: 'publicIssuerId',
      cell: PublicIdCell,
      columnFunction: [],
    },
    {
      id: 'authorizationServerUrl',
      title: 'Authorization Server',
      accessorKey: 'authorizationServerUrl',
      cell: AuthServerCell,
      columnFunction: [],
    },
    {
      id: 'createDateTime',
      title: 'Created',
      accessorKey: 'createDateTime',
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
  const columns = getColumns<IssuerRecord>(tableStyling)

  return (
    <Card className="p-4">
      {showConfirmModal && selectedIssuer && (
        <ConfirmationModal
          openModal={showConfirmModal}
          buttonTitles={['Cancel', 'Delete']}
          loading={actionLoading}
          closeModal={() => {
            setShowConfirmModal(false)
            setSelectedIssuer(null)
            setSuccessMessage(null)
            setErrorMessage(null)
          }}
          onSuccess={(confirmed: boolean): void => {
            if (confirmed) {
              handleDelete()
            }
          }}
          message={`Are you sure you want to delete issuer "${
            selectedIssuer.metadata?.[0]?.name || selectedIssuer.issuerId
          }"? This cannot be undone.`}
          isProcessing={actionLoading}
          success={successMessage}
          failure={errorMessage}
          setSuccess={setSuccessMessage}
          setFailure={setErrorMessage}
        />
      )}

      <DataTable
        isLoading={loading}
        placeHolder="Search issuers..."
        data={issuers}
        columns={columns}
        index="id"
        pageIndex={paginationState.pageIndex}
        pageSize={paginationState.pageSize}
        pageCount={paginationState.pageCount}
        onPageChange={(index: number): void =>
          onPaginationChange((prev) => ({ ...prev, pageIndex: index }))
        }
        onPageSizeChange={(size: number): void =>
          onPaginationChange((prev) => ({
            ...prev,
            pageSize: size,
            pageIndex: 0,
          }))
        }
        onSearchTerm={(term: string): void =>
          onPaginationChange((prev) => ({
            ...prev,
            searchTerm: term,
            pageIndex: 0,
          }))
        }
      />
    </Card>
  )
}

export default IssuerList
