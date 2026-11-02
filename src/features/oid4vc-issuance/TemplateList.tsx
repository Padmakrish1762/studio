'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FilePlus2, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import {
  IColumnData,
  ITableMetadata,
  TableStyling,
  getColumns,
} from '@/components/ui/generic-table-component/columns'
import React, { Dispatch, JSX, SetStateAction } from 'react'

import { AxiosResponse } from 'axios'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CellContext } from '@tanstack/react-table'
import ConfirmationModal from '@/components/confirmation-modal'
import { DataTable } from '@/components/ui/generic-table-component/data-table'
import { ExistingTemplate } from './CreateTemplate'
import { apiStatusCodes } from '@/config/CommonConstant'
import { deleteOid4vcTemplate } from '@/app/api/Oid4vcIssuance'
import { useAppSelector } from '@/lib/hooks'

export interface PaginationState {
  pageIndex: number
  pageSize: number
  pageCount: number
  searchTerm: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

interface TemplateListProps {
  issuerId: string
  templates: ExistingTemplate[]
  loading: boolean
  paginationState: PaginationState
  onPaginationChange: Dispatch<SetStateAction<PaginationState>>
  onRefresh: () => void
  onEdit: (template: ExistingTemplate) => void
  onCreateOffer: (template: ExistingTemplate) => void
  onSuccess: (message: string | null) => void
  onFailure: (message: string | null) => void
}

const NameCell = ({
  row,
}: CellContext<ExistingTemplate, unknown>): JSX.Element => (
  <span className="max-w-[220px] truncate text-sm font-medium">
    {row.original.name}
  </span>
)

const FormatCell = ({
  row,
}: CellContext<ExistingTemplate, unknown>): JSX.Element => (
  <Badge variant="outline">{row.original.format}</Badge>
)

const SignerCell = ({
  row,
}: CellContext<ExistingTemplate, unknown>): JSX.Element => (
  <span className="text-sm">{row.original.signerOption}</span>
)

const RevokableCell = ({
  row,
}: CellContext<ExistingTemplate, unknown>): JSX.Element => (
  <Badge variant={row.original.canBeRevoked ? 'default' : 'secondary'}>
    {row.original.canBeRevoked ? 'Revocable' : 'Not revocable'}
  </Badge>
)

const TemplateList = ({
  issuerId,
  templates,
  loading,
  paginationState,
  onPaginationChange,
  onRefresh,
  onEdit,
  onCreateOffer,
  onSuccess,
  onFailure,
}: TemplateListProps): JSX.Element => {
  const orgId = useAppSelector((state) => state?.organization.orgId)

  const [showConfirmModal, setShowConfirmModal] = React.useState(false)
  const [selected, setSelected] = React.useState<ExistingTemplate | null>(null)
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
      const response = await deleteOid4vcTemplate(
        orgId || '',
        issuerId,
        selected.id,
      )
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
      const msg = (error as Error)?.message || 'Failed to delete template'
      setErrorMessage(msg)
      onFailure(msg)
    } finally {
      setActionLoading(false)
    }
  }

  const actionCell = ({
    row,
  }: {
    row: { original: ExistingTemplate }
  }): JSX.Element => {
    const template = row.original
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => onCreateOffer(template)}>
            <FilePlus2 className="mr-2 h-4 w-4" />
            Create Offer
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(template)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setSuccessMessage(null)
              setErrorMessage(null)
              setSelected(template)
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
      accessorKey: 'name',
      cell: NameCell,
      columnFunction: [],
    },
    {
      id: 'format',
      title: 'Format',
      accessorKey: 'format',
      cell: FormatCell,
      columnFunction: [],
    },
    {
      id: 'signerOption',
      title: 'Signer',
      accessorKey: 'signerOption',
      cell: SignerCell,
      columnFunction: [],
    },
    {
      id: 'canBeRevoked',
      title: 'Revocation',
      accessorKey: 'canBeRevoked',
      cell: RevokableCell,
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
  const columns = getColumns<ExistingTemplate>(tableStyling)

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
          message={`Are you sure you want to delete template "${selected.name}"?`}
          isProcessing={actionLoading}
          success={successMessage}
          failure={errorMessage}
          setSuccess={setSuccessMessage}
          setFailure={setErrorMessage}
        />
      )}

      <DataTable
        isLoading={loading}
        placeHolder="Search templates..."
        data={templates}
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

export default TemplateList
