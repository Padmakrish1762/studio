'use client'

import { setRefreshToken, setSessionId, setToken } from '@/lib/authSlice'
import { useEffect, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { apiRoutes } from '@/config/apiRoutes'
import { generateAccessToken } from '@/utils/session'
import { passwordValueEncryption } from '@/utils/passwordEncryption'
import { useAppDispatch } from '@/lib/hooks'
import { useSession } from 'next-auth/react'

const preventRedirectOnPaths = [
  '/create-organization',
  '/agent-config',
  '/wallet-setup',
  '/create-did',
  '/x509-certificate',
  '/intents',
  '/did-details',
  '/organizations',
  '/users',
  '/connections',
  '/ecosystems',
  '/profile',
  '/developers-setting',
  '/billing',
  '/schemas',
  '/invitations',
  '/delete-organization',
  '/agent-config',
  '/credentials',
  '/verification',
]
const excludeRouteForSessionCheck = [
  '/verify-email-success',
  '/reset-password',
  '/sign-up',
  '/sign-in',
  '/trust-registry',
]

export const SessionManager = ({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement => {
  const { data: session, status } = useSession({
    required: false,
  })

  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const dispatch = useAppDispatch()

  const redirectTo = searchParams.get('redirectTo')
  const hasCheckedOnMount = useRef(false)

  const setSessionDetails = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sessionDetails: any,
    redirectTo: string | null,
  ): void => {
    const isOnRestrictedPage = preventRedirectOnPaths.some((page) =>
      pathname.startsWith(page),
    )
    if (sessionDetails?.data?.sessionToken) {
      dispatch(setToken(sessionDetails.data.sessionToken))
    }
    if (sessionDetails?.data?.refreshToken) {
      dispatch(setRefreshToken(sessionDetails.data.refreshToken))
    }
    if (redirectTo && !isOnRestrictedPage) {
      window.location.href = redirectTo
    } else if (!redirectTo && !isOnRestrictedPage) {
      router.push('/dashboard')
    }
  }

  const logoutSession = (): void => {
    generateAccessToken()
  }

  const fetchSessionDetails = async (
    sessionId: string,
    redirectTo: string | null,
  ): Promise<void> => {
    try {
      const encrypted = await passwordValueEncryption(sessionId)
      const encoded = encodeURIComponent(encrypted)
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}${apiRoutes.auth.fetchSessionDetails}?sessionId=${encoded}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
      )
      const data = await resp.json()
      if (!data.data) {
        logoutSession()
        return
      }
      // eslint-disable-next-line
      setSessionDetails(data, redirectTo)
    } catch (error) {
      console.error('Failed to fetch session details: ', error)
      throw error
    }
  }

  useEffect(() => {
    if (status === 'loading') {
      return
    }

    const isIgnoreSessionCheck = excludeRouteForSessionCheck.some((page) =>
      pathname.startsWith(page),
    )

    // On /sign-up and /sign-in, a session that was ALREADY present the
    // moment this page loaded (e.g. a platform admin clicking an invite
    // link meant for someone else, in the same logged-in browser tab) must
    // not bounce you to /dashboard before the form ever shows - that's a
    // stale session for a different flow, not a real sign-in here. A
    // session that becomes authenticated WHILE already sitting on this
    // page (i.e. the user just submitted the sign-in form) is the real
    // thing and must still redirect - hasCheckedOnMount tells these apart.
    if (isIgnoreSessionCheck && !hasCheckedOnMount.current) {
      hasCheckedOnMount.current = true
      return
    }
    hasCheckedOnMount.current = true

    setTimeout(() => {
      if (status === 'authenticated' && session?.sessionId) {
        fetchSessionDetails(session.sessionId, redirectTo)
        dispatch(setSessionId(session?.sessionId))
      } else if (
        !isIgnoreSessionCheck &&
        (status === 'unauthenticated' || session === null)
      ) {
        router.push('/sign-in')
      }
    }, 500)
  }, [status, session])

  if (status === 'loading') {
    return <div>Loading session...</div>
  }

  return <>{children}</>
}
