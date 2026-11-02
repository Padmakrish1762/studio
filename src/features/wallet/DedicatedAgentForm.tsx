'use client'

import * as yup from 'yup'

import { Field, Form, Formik } from 'formik'
import React, { useRef, useState } from 'react'
import { getAgentHealth, spinupDedicatedAgent } from '@/app/api/Agent'

import { AlertComponent } from '@/components/AlertComponent'
import type { AxiosResponse } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Loader from '@/components/Loader'
import { apiStatusCodes } from '@/config/CommonConstant'
import { nanoid } from 'nanoid'
import { passwordValueEncryption } from '@/utils/passwordEncryption'

interface DedicatedAgentFormProps {
  orgId: string
  onSuccess?: (data?: WalletResponse) => void
}

export interface WalletData {
  id: string
  orgId: string
  agentSpinUpStatus: number
  agentEndPoint: string
  tenantId: string | null
  walletName: string
}

export interface WalletResponse {
  statusCode: number
  message: string
  data: WalletData
}

const HEALTH_POLL_INTERVAL_MS = 3000
const HEALTH_POLL_MAX_ATTEMPTS = 40 // ~2 minutes

// Spinning up a dedicated agent provisions a brand-new container
// (apps/agent-provisioning) — the spinup call itself only kicks that off,
// it doesn't wait for the container to actually come up. We poll the
// agent's own health check afterward so "success" here means the agent is
// really reachable, not just that the request was accepted.
const waitForAgentHealth = async (orgId: string): Promise<boolean> => {
  for (let attempt = 0; attempt < HEALTH_POLL_MAX_ATTEMPTS; attempt += 1) {
    try {
      const res = (await getAgentHealth(orgId)) as AxiosResponse
      if (res?.data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS) {
        return true
      }
    } catch {
      // not ready yet — keep polling
    }
    await new Promise((resolve) => setTimeout(resolve, HEALTH_POLL_INTERVAL_MS))
  }
  return false
}

const DedicatedAgentForm = ({
  orgId,
  onSuccess,
}: DedicatedAgentFormProps): React.JSX.Element => {
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const spinupResponseRef = useRef<WalletResponse | undefined>(undefined)

  const validationSchema = yup.object({
    walletName: yup
      .string()
      .required('Wallet name is required')
      .min(2, 'Wallet name must be at least 2 characters')
      .max(25, 'Wallet name cannot exceed 25 characters')
      .matches(
        /^[a-zA-Z0-9]+$/,
        'Wallet name must be alphanumeric with no spaces or special characters',
      ),
    walletPassword: yup
      .string()
      .required('Wallet password is required')
      .min(6, 'Wallet password must be at least 6 characters'),
  })

  const handleSubmit = async (values: {
    walletName: string
    walletPassword: string
  }): Promise<void> => {
    setError(null)
    setLoading(true)
    setStatusMessage('Provisioning your dedicated agent...')

    try {
      const encryptedPassword = await passwordValueEncryption(
        values.walletPassword,
      )

      const payload = {
        walletName: values.walletName,
        walletPassword: encryptedPassword,
        keyType: 'ed25519',
        method: 'key',
        seed: nanoid(32),
      }

      const res = (await spinupDedicatedAgent(payload, orgId)) as AxiosResponse
      const { data } = res

      if (data?.statusCode !== apiStatusCodes.API_STATUS_CREATED) {
        setError(data?.message || 'Failed to spin up dedicated agent')
        return
      }

      spinupResponseRef.current = data as WalletResponse

      setStatusMessage(
        'Agent container starting up — this can take up to a minute...',
      )
      const healthy = await waitForAgentHealth(orgId)

      if (!healthy) {
        setError(
          'The agent is taking longer than expected to come up. Check back in a moment — it may still complete in the background.',
        )
        return
      }

      onSuccess?.(spinupResponseRef.current)
    } catch (err) {
      console.error(err)
      setError('Something went wrong while creating the dedicated wallet')
    } finally {
      setLoading(false)
      setStatusMessage(null)
    }
  }

  return (
    <div className="mt-6">
      <Formik
        initialValues={{
          walletName: '',
          walletPassword: '',
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched }) => (
          <Form className="space-y-6">
            <div>
              <Label htmlFor="walletName">Wallet Name</Label>
              <Field
                as={Input}
                id="walletName"
                name="walletName"
                placeholder="Enter wallet name"
                className="mt-2"
              />
              {errors.walletName && touched.walletName && (
                <p className="text-destructive mt-1 text-sm">
                  {errors.walletName}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="walletPassword">Wallet Password</Label>
              <Field
                as={Input}
                type="password"
                id="walletPassword"
                name="walletPassword"
                placeholder="Enter wallet password"
                className="mt-2"
              />
              {errors.walletPassword && touched.walletPassword && (
                <p className="text-destructive mt-1 text-sm">
                  {errors.walletPassword}
                </p>
              )}
              <p className="text-muted-foreground mt-1 text-xs">
                This encrypts your wallet at rest. CREDEBL provisions and runs
                this agent for you — nothing to host yourself.
              </p>
            </div>

            {statusMessage && (
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader /> {statusMessage}
              </p>
            )}

            {error && (
              <AlertComponent
                message={error}
                type="failure"
                onAlertClose={() => setError(null)}
              />
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? <Loader /> : 'Create Dedicated Wallet'}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  )
}

export default DedicatedAgentForm
