import { Button } from '@/components/ui/button'
import React from 'react'
import { useRouter } from 'next/navigation'

const X509FormatNotice = (): React.JSX.Element => {
  const router = useRouter()

  return (
    <div className="border-border -mx-6 mt-6 border-t px-6 pt-6">
      <p className="text-foreground mb-2 font-medium">
        This credential format signs with an X.509 certificate, not a DID
        &mdash; configure one under Trust &rarr; x509, or reuse your
        organization&apos;s existing DID. Issuers and verifiers are managed from
        the Issuer / Verifier screens.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          onClick={() => router.push('/oid4vc-issuance/issuers')}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 py-2 font-medium shadow-sm"
        >
          Go to OID4VC Issuers
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/oid4vc-verification/verifiers')}
          className="rounded-lg px-6 py-2 font-medium shadow-sm"
        >
          Go to OID4VP Verifiers
        </Button>
      </div>
    </div>
  )
}

export default X509FormatNotice
