'use client'

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
import { MoreVertical, Pencil, SendHorizonal, Trash2 } from 'lucide-react'
import React, { JSX } from 'react'

import { AxiosResponse } from 'axios'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CellContext } from '@tanstack/react-table'
import ConfirmationModal from '@/components/confirmation-modal'
import { DataTable } from '@/components/ui/generic-table-component/data-table'
import { ExistingVerificationTemplate } from './CreateVerificationTemplate'
import { apiStatusCodes } from '@/config/CommonConstant'
import { deleteOid4vpVerificationTemplate } from '@/app/api/Oid4vcVerification'
import { useAppSelector } from '@/lib/hooks'

interface VerificationTemplateListProps {
  templates: ExistingVerificationTemplate[]
  loading: boolean
  onRefresh: () => void
  onEdit: (template: ExistingVerificationTemplate) => void
  onRequestPresentation: (template: ExistingVerificationTemplate) => void
  onSuccess: (message: string | null) => void
  onFailure: (message: string | null) => void
}

const NameCell = ({
  row,
}: CellContext<ExistingVerificationTemplate, unknown>): JSX.Element => (
  <span className="max-w-[220px] truncate text-sm font-medium">
    {row.original.name}
  </span>
)

const SignerCell = ({
  row,
}: CellContext<ExistingVerificationTemplate, unknown>): JSX.Element => (
  <span className="text-sm">{row.original.signerOption}</span>
)

const CredentialsCell = ({
  row,
}: CellContext<ExistingVerificationTemplate, unknown>): JSX.Element => {
  const creds = row.original.templateJson?.dcql?.query?.credentials || []
  return (
    <div className="flex flex-wrap gap-1">
      {creds.map((c, i) => (
        <Badge key={i} variant="outline">
          {c.meta?.vct || c.format}
        </Badge>
      ))}
      {creds.length === 0 && <span className="text-muted-foreground">—</span>}
    </div>
  )
}

const VerificationTemplateList = ({
  templates,
  loading,
  onRefresh,
  onEdit,
  onRequestPresentation,
  onSuccess,
  onFailure,
}: VerificationTemplateListProps): JSX.Element => {
  const orgId = useAppSelector((state) => state?.organization.orgId)

  const [showConfirmModal, setShowConfirmModal] = React.useState(false)
  const [selected, setSelected] =
    React.useState<ExistingVerificationTemplate | null>(null)
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
      const response = await deleteOid4vpVerificationTemplate(
        orgId || '',
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
    row: { original: ExistingVerificationTemplate }
  }): JSX.Element => {
    const template = row.original
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={() => onRequestPresentation(template)}>
            <SendHorizonal className="mr-2 h-4 w-4" />
            Request Presentation
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
      id: 'signerOption',
      title: 'Signer',
      accessorKey: 'signerOption',
      cell: SignerCell,
      columnFunction: [],
    },
    {
      id: 'credentials',
      title: 'Requested Credentials',
      accessorKey: 'templateJson',
      cell: CredentialsCell,
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
  const columns = getColumns<ExistingVerificationTemplate>(tableStyling)

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
        placeHolder="Search verification templates..."
        data={templates}
        columns={columns}
        index="id"
        pageIndex={0}
        pageSize={templates.length || 10}
        pageCount={1}
        onPageChange={() => undefined}
        onPageSizeChange={() => undefined}
        onSearchTerm={() => undefined}
      />
    </Card>
  )
}

export default VerificationTemplateList
