export type SignerOption = 'DID' | 'X509_P256' | 'X509_ED25519'
export type QueryFormat = 'dcql' | 'presentationExchange'

export interface ClaimRow {
  path: string
}

export interface CredentialQuery {
  id: string
  format: string
  vct: string
  requireCryptographicHolderBinding: boolean
  claims: ClaimRow[]
}

export interface ExistingVerificationTemplate {
  id: string
  name: string
  signerOption: SignerOption
  templateJson?: {
    dcql?: {
      query?: {
        combine?: 'all' | 'any'
        credentials?: {
          id: string
          format: string
          meta?: { vct?: string }
          require_cryptographic_holder_binding?: boolean
          claims?: { path: string[] }[]
        }[]
      }
    }
    presentationExchange?: {
      definition?: {
        id: string
        purpose?: string
        input_descriptors: {
          id: string
          name?: string
          format: Record<string, unknown>
          constraints: {
            fields: { id: string; path: string[]; purpose?: string }[]
          }
        }[]
      }
    }
  }
}

// New PEX templates omit `format` entirely on each input_descriptor (see
// buildTemplateJson) since the credo-controller agent's validation schema
// for PEX's SD-JWT VC format key is broken, and `format` is optional on
// both the agent's and the wallet's schemas anyway. This mapping only
// exists to round-trip templates created during earlier testing, which
// stored the literal key "undefined" as a workaround before format was
// dropped entirely.
const LEGACY_PEX_SD_JWT_FORMAT_KEY = 'undefined'

// eslint-disable-next-line no-confusing-arrow
export const pexFormatToDcqlFormat = (pexFormat: string): string =>
  pexFormat === LEGACY_PEX_SD_JWT_FORMAT_KEY ? 'dc+sd-jwt' : pexFormat

// PEX field paths are JSONPath. Claim rows just store the plain claim name;
// strip whichever wrapper prefix is present (flat, credentialSubject, or the
// JWT-VC envelope's vc.credentialSubject) to get back the bare key on load.
export const pexPathToPlainClaim = (path: string): string =>
  path
    .replace(/^\$\.vc\.credentialSubject\['?/, '')
    .replace(/^\$\.credentialSubject\['?/, '')
    .replace(/^\$\['?/, '')
    .replace(/'?\]$/, '')

// eslint-disable-next-line no-confusing-arrow
export const inferQueryFormat = (
  template?: ExistingVerificationTemplate,
): QueryFormat =>
  template?.templateJson?.presentationExchange ? 'presentationExchange' : 'dcql'

export const emptyQuery = (): CredentialQuery => ({
  id: `cred_${Math.random().toString(36).slice(2, 8)}`,
  format: 'dc+sd-jwt',
  vct: '',
  requireCryptographicHolderBinding: false,
  claims: [{ path: '' }],
})

export const fromExisting = (
  template?: ExistingVerificationTemplate,
): CredentialQuery[] => {
  const dcqlCreds = template?.templateJson?.dcql?.query?.credentials
  if (dcqlCreds && dcqlCreds.length > 0) {
    return dcqlCreds.map((c) => ({
      id: c.id,
      format: c.format,
      vct: c.meta?.vct || '',
      requireCryptographicHolderBinding: Boolean(
        c.require_cryptographic_holder_binding,
      ),
      claims: c.claims?.map((cl) => ({ path: cl.path.join(',') })) || [
        { path: '' },
      ],
    }))
  }

  const descriptors =
    template?.templateJson?.presentationExchange?.definition?.input_descriptors
  if (descriptors && descriptors.length > 0) {
    return descriptors.map((d) => {
      const [formatKey] = Object.keys(d.format || {})
      return {
        id: d.id,
        format: pexFormatToDcqlFormat(formatKey || 'dc+sd-jwt'),
        vct: d.name || '',
        requireCryptographicHolderBinding: false,
        claims: d.constraints?.fields?.map((f) => ({
          // Each field now carries several candidate JSONPaths (flat,
          // credentialSubject, vc.credentialSubject) all pointing at the
          // same underlying key - dedupe back to the bare key for editing.
          path: Array.from(new Set(f.path.map(pexPathToPlainClaim))).join(','),
        })) || [{ path: '' }],
      }
    })
  }

  return [emptyQuery()]
}

// Mobile wallets built on Credo <0.7 only implement the DIF Presentation
// Exchange holder flow (no DCQL support), so the PEX branch exists to
// produce a request format those wallets can actually parse.
export const buildTemplateJson = (
  name: string,
  queryFormat: QueryFormat,
  combine: 'all' | 'any',
  queries: CredentialQuery[],
): object => {
  if (queryFormat === 'dcql') {
    return {
      dcql: {
        query: {
          combine,
          credentials: queries.map((q) => ({
            id: q.id,
            format: q.format,
            meta: { vct: q.vct.trim() },
            ['require_cryptographic_holder_binding']:
              q.requireCryptographicHolderBinding,
            claims: q.claims.map((c) => ({
              path: c.path
                .split(',')
                .map((p) => p.trim())
                .filter(Boolean),
            })),
          })),
        },
      },
    }
  }

  return {
    presentationExchange: {
      definition: {
        id: `${name.trim().toLowerCase().replace(/\s+/g, '-')}-verification`,
        purpose: `Present required claims for ${name.trim()}`,
        // `format` is intentionally omitted here: the credo-controller
        // agent's PEX format validation schema is broken for SD-JWT VC
        // (it only accepts the literal key "undefined" instead of
        // "vc+sd-jwt"), and sending that broken key in turn fails the
        // wallet's own (correct) schema validation. `format` is optional
        // on InputDescriptorV2 for both the agent and the wallet, so
        // omitting it avoids the conflict entirely (confirmed via live
        // API test - the resulting request is accepted by both sides).
        ['input_descriptors']: queries.map((q) => ({
          id: q.id,
          name: q.vct.trim(),
          constraints: {
            fields: q.claims.map((c) => {
              const segments = c.path
                .split(',')
                .map((p) => p.trim())
                .filter(Boolean)
              // A JWT-VC credential (jwt_vc_json-ld/ldp_vc) nests claims at
              // vc.credentialSubject.<key> (confirmed against a real issued
              // credential - see apps/oid4vc-issuance/libs/helpers/
              // credential-sessions.builder.ts, which wraps every claim
              // payload as `{ credentialSubject: ... }` under the JWT's `vc`
              // key). SD-JWT VC (dc+sd-jwt, the classic format - see
              // modules/sd-jwt-vc/SdJwtVcService.mjs) is the opposite: it has
              // no envelope at all, disclosed claims sit flat at the top
              // level of the decoded payload. Offering the JWT-VC-shaped
              // envelope candidates *ahead of* the flat one for an SD-JWT
              // credential risks wallets whose PEX evaluator only tries
              // path[0] and doesn't fall through the rest of the array
              // (confirmed failure case: a dc+sd-jwt Creator Card credential
              // reported "not present in wallet" against a template built
              // with the envelope-first ordering). Put the correct shape
              // first for the credential's actual format instead of hoping
              // every implementation iterates the full candidate list.
              const isJwtVcFormat =
                q.format === 'jwt_vc_json-ld' || q.format === 'ldp_vc'
              // eslint-disable-next-line no-confusing-arrow
              const candidatesFor = (key: string): string[] =>
                isJwtVcFormat
                  ? [
                      `$.vc.credentialSubject['${key}']`,
                      `$.credentialSubject['${key}']`,
                      `$['${key}']`,
                    ]
                  : [`$['${key}']`]
              return {
                id: segments[0] || c.path.trim(),
                path: segments.flatMap(candidatesFor),
              }
            }),
          },
        })),
      },
    },
  }
}
