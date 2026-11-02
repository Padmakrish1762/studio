'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React from 'react'
import { cn } from '@/lib/utils'

interface SetDomainValueInputProps {
  domainValue: string
  setDomainValue: (value: string) => void
  domainError?: string | null
  readOnly?: boolean
}

const SetDomainValueInput = ({
  domainValue,
  setDomainValue,
  domainError,
  readOnly,
}: SetDomainValueInputProps): React.JSX.Element => (
  <div className="relative mb-3">
    <div className="flex pt-4 pb-4">
      <Label htmlFor="domainValue">
        {readOnly ? 'Domain' : 'Enter Domain'}
      </Label>
      <span className="text-destructive text-xs">*</span>
    </div>

    <Input
      id="domainValue"
      value={domainValue}
      onChange={(e) => setDomainValue(e.target.value)}
      placeholder="Please enter domain"
      readOnly={readOnly}
      disabled={readOnly}
      className={cn(
        'block h-11 w-full truncate rounded-lg p-2.5 text-sm',
        domainError ? 'border-destructive' : '',
      )}
    />

    {readOnly && (
      <span className="text-muted-foreground mt-1 block text-xs">
        CREDEBL hosts this DID document at your agent&apos;s own address, so
        it&apos;s the only domain this DID can actually resolve against.
      </span>
    )}

    {domainError && (
      <span className="text-destructive mt-1 block text-xs">{domainError}</span>
    )}
  </div>
)

export default SetDomainValueInput
