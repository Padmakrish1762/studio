'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Eye, MoreVertical, Pencil, Trash2 } from 'lucide-react'
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
import { ExistingVerifier } from './CreateVerifier'
import { apiStatusCodes } from '@/config/CommonConstant'
import { deleteOid4vpVerifier } from '@/app/api/Oid4vcVerification'
import { useAppSelector } from '@/lib/hooks'
import { useRouter } from 'next/navigation'

export interface PaginationState {
  pageIndex: number
  pageSize: number
  pageCount: number
  searchTerm: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

interface VerifierRecord extends ExistingVerifier {
  createDateTime?: string
}

interface VerifierListProps {
  verifiers: VerifierRecord[]
  loading: boolean
  paginationState: PaginationState
  onPaginationChange: Dispatch<SetStateAction<PaginationState>>
  onRefresh: () => void
  onEdit: (verifier: ExistingVerifier) => void
  onSuccess: (message: string | null) => void
  onFailure: (message: string | null) => void
}

const NameCell = ({
  row,
}: CellContext<VerifierRecord, unknown>): JSX.Element => (
  <span className="max-w-[220px] truncate text-sm font-medium">
    {row.original.metadata?.client_name || row.original.verifierId || '—'}
  </span>
)

const PublicIdCell = ({
  row,
}: CellContext<VerifierRecord, unknown>): JSX.Element => (
  <span className="text-muted-foreground max-w-[220px] truncate text-sm">
    {row.original.publicVerifierId || '—'}
  </span>
)

const CreatedCell = ({
  row,
}: CellContext<VerifierRecord, unknown>): JSX.Element => {
  if (!row.original.createDateTime) {
    return <span>—</span>
  }
  return <DateCell date={row.original.createDateTime} />
}

const VerifierList = ({
  verifiers,
  loading,
  paginationState,
  onPaginationChange,
  onRefresh,
  onEdit,
  onSuccess,
  onFailure,
}: VerifierListProps): JSX.Element => {
  const orgId = useAppSelector((state) => state?.organization.orgId)
  const router = useRouter()

  const [showConfirmModal, setShowConfirmModal] = React.useState(false)
  const [selected, setSelected] = React.useState<VerifierRecord | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(
    null,
  )
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [actionLoading, setActionLoading] = React.useState(false)

  const handleDelete = async (): Promise<void> => {
    if (!selected) {
      return
    }
    setActionLoading(true)
    try {
      const response = await deleteOid4vpVerifier(orgId || '', selected.id)
      const { data } = response as AxiosResponse

      if (
        data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS ||
        data?.statusCode === apiStatusCodes.API_STATUS_DELETED
      ) {
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
      const msg = (error as Error)?.message || 'Failed to delete verifier'
      setErrorMessage(msg)
      onFailure(msg)
    } finally {
      setActionLoading(false)
    }
  }

  const actionCell = ({
    row,
  }: {
    row: { original: VerifierRecord }
  }): JSX.Element => {
    const verifier = row.original
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onClick={() =>
              router.push(`/oid4vc-verification/verifiers/${verifier.id}`)
            }
          >
            <Eye className="mr-2 h-4 w-4" />
            View / Manage
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(verifier)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setSuccessMessage(null)
              setErrorMessage(null)
              setSelected(verifier)
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
      id: 'publicVerifierId',
      title: 'Public Verifier ID',
      accessorKey: 'publicVerifierId',
      cell: PublicIdCell,
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
  const columns = getColumns<VerifierRecord>(tableStyling)

  return (
    <Card className="p-4">
      {showConfirmModal && selected && (
        <ConfirmationModal
          openModal={showConfirmModal}
          buttonTitles={['Cancel', 'Delete']}
          loading={actionLoading}
          closeModal={() => {
            setShowConfirmModal(false)
            setSelected(null)
            setSuccessMessage(null)
            setErrorMessage(null)
          }}
          onSuccess={(confirmed) => confirmed && handleDelete()}
          message={`Are you sure you want to delete verifier "${
            selected.metadata?.client_name || selected.verifierId
          }"?`}
          isProcessing={actionLoading}
          success={successMessage}
          failure={errorMessage}
          setSuccess={setSuccessMessage}
          setFailure={setErrorMessage}
        />
      )}

      <DataTable
        isLoading={loading}
        placeHolder="Search verifiers..."
        data={verifiers}
        columns={columns}
        index="id"
        pageIndex={paginationState.pageIndex}
        pageSize={paginationState.pageSize}
        pageCount={paginationState.pageCount}
        onPageChange={(index: number) =>
          onPaginationChange((prev) => ({ ...prev, pageIndex: index }))
        }
        onPageSizeChange={(size: number) =>
          onPaginationChange((prev) => ({
            ...prev,
            pageSize: size,
            pageIndex: 0,
          }))
        }
        onSearchTerm={(term: string) =>
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

export default VerifierList
