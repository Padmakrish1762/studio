import {
  axiosDelete,
  axiosGet,
  axiosPost,
  axiosPut,
} from '@/services/apiRequests'

import { AxiosResponse } from 'axios'
import { apiRoutes } from '@/config/apiRoutes'
import { getHeaderConfigs } from '@/config/GetHeaderConfigs'

export const createOid4vpVerifier = async (
  orgId: string,
  payload: object,
): Promise<AxiosResponse | string> => {
  const url = `${apiRoutes.organizations.root}/${orgId}${apiRoutes.Oid4vcVerification.verifier}`
  try {
    return await axiosPost({ url, payload, config: getHeaderConfigs() })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const getOid4vpVerifiers = async (
  orgId: string,
): Promise<AxiosResponse | string> => {
  const url = `${apiRoutes.organizations.root}/${orgId}${apiRoutes.Oid4vcVerification.verifier}`
  try {
    return await axiosGet({ url, config: getHeaderConfigs() })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const updateOid4vpVerifier = async (
  orgId: string,
  verifierId: string,
  payload: object,
): Promise<AxiosResponse | string> => {
  const url = `${apiRoutes.organizations.root}/${orgId}${apiRoutes.Oid4vcVerification.verifier}/${verifierId}`
  try {
    return await axiosPut({ url, payload, config: getHeaderConfigs() })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const deleteOid4vpVerifier = async (
  orgId: string,
  verifierId: string,
): Promise<AxiosResponse | string> => {
  const url = `${apiRoutes.organizations.root}/${orgId}${apiRoutes.Oid4vcVerification.verifier}?verifierId=${verifierId}`
  try {
    return await axiosDelete({ url, config: getHeaderConfigs() })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const createOid4vpVerificationTemplate = async (
  orgId: string,
  payload: object,
): Promise<AxiosResponse | string> => {
  const url = `${apiRoutes.organizations.root}/${orgId}${apiRoutes.Oid4vcVerification.verificationTemplate}`
  try {
    return await axiosPost({ url, payload, config: getHeaderConfigs() })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const getOid4vpVerificationTemplates = async (
  orgId: string,
): Promise<AxiosResponse | string> => {
  const url = `${apiRoutes.organizations.root}/${orgId}${apiRoutes.Oid4vcVerification.verificationTemplate}`
  try {
    return await axiosGet({ url, config: getHeaderConfigs() })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const updateOid4vpVerificationTemplate = async (
  orgId: string,
  templateId: string,
  payload: object,
): Promise<AxiosResponse | string> => {
  const url = `${apiRoutes.organizations.root}/${orgId}${apiRoutes.Oid4vcVerification.verificationTemplate}/${templateId}`
  try {
    return await axiosPut({ url, payload, config: getHeaderConfigs() })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const deleteOid4vpVerificationTemplate = async (
  orgId: string,
  templateId: string,
): Promise<AxiosResponse | string> => {
  const url = `${apiRoutes.organizations.root}/${orgId}${apiRoutes.Oid4vcVerification.verificationTemplate}/${templateId}`
  try {
    return await axiosDelete({ url, config: getHeaderConfigs() })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const createOid4vpPresentationRequest = async (
  orgId: string,
  verifierId: string,
  payload: object,
): Promise<AxiosResponse | string> => {
  const url = `${apiRoutes.organizations.root}/${orgId}${apiRoutes.Oid4vcVerification.presentation}?verifierId=${verifierId}`
  try {
    return await axiosPost({ url, payload, config: getHeaderConfigs() })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const getOid4vpVerifierPresentations = async (
  orgId: string,
): Promise<AxiosResponse | string> => {
  const url = `${apiRoutes.organizations.root}/${orgId}${apiRoutes.Oid4vcVerification.verifierPresentation}`
  try {
    return await axiosGet({ url, config: getHeaderConfigs() })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const getOid4vpVerifierPresentationResponse = async (
  orgId: string,
  verificationPresentationId: string,
): Promise<AxiosResponse | string> => {
  const url = `${apiRoutes.organizations.root}/${orgId}${apiRoutes.Oid4vcVerification.verifierPresentationResponse}?verificationPresentationId=${verificationPresentationId}`
  try {
    return await axiosGet({ url, config: getHeaderConfigs() })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}
