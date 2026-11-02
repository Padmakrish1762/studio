import {
  axiosDelete,
  axiosGet,
  axiosPatch,
  axiosPost,
  axiosPublicUserGet,
  axiosPut,
} from '@/services/apiRequests'

import { AxiosResponse } from 'axios'
import { apiRoutes } from '@/config/apiRoutes'
import { getHeaderConfigs } from '@/config/GetHeaderConfigs'

export const createOid4vcIssuer = async (
  orgId: string,
  payload: object,
): Promise<AxiosResponse | string> => {
  const url = `${apiRoutes.organizations.root}/${orgId}${apiRoutes.Oid4vcIssuance.issuers}`
  try {
    return await axiosPost({ url, payload, config: getHeaderConfigs() })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const updateOid4vcIssuer = async (
  orgId: string,
  issuerId: string,
  payload: object,
): Promise<AxiosResponse | string> => {
  const url = `${apiRoutes.organizations.root}/${orgId}${apiRoutes.Oid4vcIssuance.issuers}/${issuerId}`
  try {
    return await axiosPost({ url, payload, config: getHeaderConfigs() })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const getOid4vcIssuers = async (
  orgId: string,
): Promise<AxiosResponse | string> => {
  const url = `${apiRoutes.organizations.root}/${orgId}${apiRoutes.Oid4vcIssuance.issuers}`
  try {
    return await axiosGet({ url, config: getHeaderConfigs() })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const getOid4vcIssuerById = async (
  orgId: string,
  issuerId: string,
): Promise<AxiosResponse | string> => {
  const url = `${apiRoutes.organizations.root}/${orgId}${apiRoutes.Oid4vcIssuance.issuers}/${issuerId}`
  try {
    return await axiosGet({ url, config: getHeaderConfigs() })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const deleteOid4vcIssuer = async (
  orgId: string,
  issuerId: string,
): Promise<AxiosResponse | string> => {
  const url = `${apiRoutes.organizations.root}/${orgId}${apiRoutes.Oid4vcIssuance.issuers}/${issuerId}`
  try {
    return await axiosDelete({ url, config: getHeaderConfigs() })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const createOid4vcTemplate = async (
  orgId: string,
  issuerId: string,
  payload: object,
): Promise<AxiosResponse | string> => {
  const url = `${apiRoutes.organizations.root}/${orgId}${apiRoutes.Oid4vcIssuance.template}/${issuerId}${apiRoutes.Oid4vcIssuance.templateSuffix}`
  try {
    return await axiosPost({ url, payload, config: getHeaderConfigs() })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const getOid4vcTemplates = async (
  orgId: string,
  issuerId: string,
): Promise<AxiosResponse | string> => {
  const url = `${apiRoutes.organizations.root}/${orgId}${apiRoutes.Oid4vcIssuance.template}/${issuerId}${apiRoutes.Oid4vcIssuance.templateSuffix}`
  try {
    return await axiosGet({ url, config: getHeaderConfigs() })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const getOid4vcTemplateById = async (
  orgId: string,
  issuerId: string,
  templateId: string,
): Promise<AxiosResponse | string> => {
  const url = `${apiRoutes.organizations.root}/${orgId}${apiRoutes.Oid4vcIssuance.template}/${issuerId}${apiRoutes.Oid4vcIssuance.templateSuffix}/${templateId}`
  try {
    return await axiosGet({ url, config: getHeaderConfigs() })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const updateOid4vcTemplate = async (
  orgId: string,
  issuerId: string,
  templateId: string,
  payload: object,
): Promise<AxiosResponse | string> => {
  const url = `${apiRoutes.organizations.root}/${orgId}${apiRoutes.Oid4vcIssuance.template}/${issuerId}${apiRoutes.Oid4vcIssuance.templateSuffix}/${templateId}`
  try {
    return await axiosPatch({ url, payload, config: getHeaderConfigs() })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const deleteOid4vcTemplate = async (
  orgId: string,
  issuerId: string,
  templateId: string,
): Promise<AxiosResponse | string> => {
  const url = `${apiRoutes.organizations.root}/${orgId}${apiRoutes.Oid4vcIssuance.template}/${issuerId}${apiRoutes.Oid4vcIssuance.templateSuffix}/${templateId}`
  try {
    return await axiosDelete({ url, config: getHeaderConfigs() })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const createOid4vcOffer = async (
  orgId: string,
  issuerId: string,
  payload: object,
): Promise<AxiosResponse | string> => {
  const url = `${apiRoutes.organizations.root}/${orgId}${apiRoutes.Oid4vcIssuance.template}/${issuerId}${apiRoutes.Oid4vcIssuance.createOfferSuffix}`
  try {
    return await axiosPost({ url, payload, config: getHeaderConfigs() })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const updateOid4vcOffer = async (
  orgId: string,
  issuerId: string,
  credentialId: string,
  payload: object,
): Promise<AxiosResponse | string> => {
  const url = `${apiRoutes.organizations.root}/${orgId}${apiRoutes.Oid4vcIssuance.template}/${issuerId}/${credentialId}${apiRoutes.Oid4vcIssuance.updateOfferSuffix}`
  try {
    return await axiosPut({ url, payload, config: getHeaderConfigs() })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const deleteOid4vcOffer = async (
  orgId: string,
  credentialId: string,
): Promise<AxiosResponse | string> => {
  const url = `${apiRoutes.organizations.root}/${orgId}${apiRoutes.Oid4vcIssuance.template}/${credentialId}${apiRoutes.Oid4vcIssuance.deleteOfferSuffix}`
  try {
    return await axiosDelete({ url, config: getHeaderConfigs() })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const getOid4vcCredentialOfferById = async (
  orgId: string,
  offerId: string,
): Promise<AxiosResponse | string> => {
  const url = `${apiRoutes.organizations.root}/${orgId}${apiRoutes.Oid4vcIssuance.credentialOffer}/${offerId}`
  try {
    return await axiosGet({ url, config: getHeaderConfigs() })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const getOid4vcCredentialOffers = async (
  orgId: string,
  query: {
    publicIssuerId?: string
    preAuthorizedCode?: string
    credentialOfferUri?: string
    authorizationCode?: string
  } = {},
): Promise<AxiosResponse | string> => {
  const params = new URLSearchParams(
    Object.entries(query).reduce<Record<string, string>>((acc, [k, v]) => {
      if (v) {
        acc[k] = v
      }
      return acc
    }, {}),
  ).toString()
  const url = `${apiRoutes.organizations.root}/${orgId}${apiRoutes.Oid4vcIssuance.credentialOffer}${params ? `?${params}` : ''}`
  try {
    return await axiosGet({ url, config: getHeaderConfigs() })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

// Public, unauthenticated trust-registry lookup — no org context, no auth header.
export const getTrustRegistryByDid = async (
  did: string,
): Promise<AxiosResponse | string> => {
  const url = `/trust-registry/issuers/${encodeURIComponent(did)}`
  try {
    return await axiosPublicUserGet({ url })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const revokeOid4vcIssuanceSession = async (
  orgId: string,
  issuanceSessionId: string,
): Promise<AxiosResponse | string> => {
  const url = `${apiRoutes.organizations.root}/${orgId}${apiRoutes.Oid4vcIssuance.issuanceSessions}/${issuanceSessionId}${apiRoutes.Oid4vcIssuance.revokeSuffix}`
  try {
    return await axiosPost({ url, config: getHeaderConfigs() })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}
