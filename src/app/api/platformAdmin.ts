import { AxiosResponse } from 'axios'
import { apiRoutes } from '@/config/apiRoutes'
import { axiosPost } from '@/services/apiRequests'
import { getHeaderConfigs } from '@/config/GetHeaderConfigs'

// Platform-admin-only: invite a user by email to create an ecosystem.
// Backend-gated via @Roles(OrgRoles.PLATFORM_ADMIN) — non-admin callers get a 403.
export const inviteUserToCreateEcosystem = async (
  email: string,
): Promise<AxiosResponse | string> => {
  const url = apiRoutes.Platform.ecosystemCreationInvitations
  try {
    return await axiosPost({
      url,
      payload: { email },
      config: getHeaderConfigs(),
    })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}
