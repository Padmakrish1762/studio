import React from 'react'
import ViewVerifier from '@/features/oid4vc-verification/ViewVerifier'

type Params = Promise<{ verifierId: string }>

export default async function VerifierPage({
  params,
}: {
  readonly params: Params
}): Promise<React.JSX.Element> {
  const { verifierId } = await params

  return (
    <div className="p-4">
      <ViewVerifier verifierId={verifierId} />
    </div>
  )
}
