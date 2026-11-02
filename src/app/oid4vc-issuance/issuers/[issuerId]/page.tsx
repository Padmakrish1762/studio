import React from 'react'
import ViewIssuer from '@/features/oid4vc-issuance/ViewIssuer'

type Params = Promise<{ issuerId: string }>

export default async function IssuerPage({
  params,
}: {
  readonly params: Params
}): Promise<React.JSX.Element> {
  const { issuerId } = await params

  return (
    <div className="p-4">
      <ViewIssuer issuerId={issuerId} />
    </div>
  )
}
