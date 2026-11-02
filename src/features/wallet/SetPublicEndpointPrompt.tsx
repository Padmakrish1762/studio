import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React from 'react'

interface SetPublicEndpointPromptProps {
  publicEndpointInput: string
  setPublicEndpointInput: (value: string) => void
  publicEndpointError?: string | null
  isSavingPublicEndpoint: boolean
  onSave: () => void
}

const SetPublicEndpointPrompt = ({
  publicEndpointInput,
  setPublicEndpointInput,
  publicEndpointError,
  isSavingPublicEndpoint,
  onSave,
}: SetPublicEndpointPromptProps): React.JSX.Element => (
  <div className="border-border bg-secondary mt-6 rounded-lg border p-4">
    <p className="text-foreground mb-2 text-sm font-medium">
      No public endpoint configured
    </p>
    <p className="text-muted-foreground mb-4 text-sm">
      did:web publishes its DID document at this agent&apos;s own address, so a
      publicly reachable endpoint (e.g. a dev tunnel or public domain, not an
      internal/Docker address) must be configured before creating this DID.
    </p>

    <Label htmlFor="publicEndpoint">Public Agent Endpoint</Label>
    <Input
      id="publicEndpoint"
      value={publicEndpointInput}
      onChange={(e) => setPublicEndpointInput(e.target.value)}
      placeholder="https://agent.example.com"
      className="mt-2"
    />
    {publicEndpointError && (
      <p className="text-destructive mt-1 text-sm">{publicEndpointError}</p>
    )}

    <Button
      onClick={onSave}
      disabled={isSavingPublicEndpoint}
      className="mt-4 rounded-lg px-6 py-2 font-medium shadow-sm disabled:opacity-50"
    >
      {isSavingPublicEndpoint ? 'Saving...' : 'Save & Continue'}
    </Button>
  </div>
)

export default SetPublicEndpointPrompt
