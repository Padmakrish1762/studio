const MODE = process.env.NEXT_PUBLIC_MODE || ''

export const didExamples: Record<string, string> = {
  'did:indy:bcovrin:testnet': 'did:indy:bcovrin:testnet:123abc456xyz',
  'did:indy:indicio:demonet': 'did:indy:indicio:demonet:abc123xyz789',
  'did:indy:indicio:mainnet': 'did:indy:indicio:mainnet:did123example',
  'did:indy:indicio:testnet': 'did:indy:indicio:testnet:xyz987abc654',
  'did:polygon:testnet': 'did:polygon:testnet:0xabcdef123456',
  'did:polygon:mainnet': 'did:polygon:mainnet:0x1234abcd5678',
  'did:key': 'did:key:z6MkfExampleAbc123',
  'did:web': 'did:web:example.com',
}

export const protocolOptions = [
  {
    id: 'didcomm',
    title: 'DIDComm',
    desc: 'Use decentralized identifiers for peer-to-peer verifiable communication.',
    icon: (
      <img
        src="/images/didcomm-logo.png"
        alt="DIDComm Logo"
        className="h-14 w-16"
      />
    ),
  },
  {
    id: 'oid4vc',
    title: 'OID4VC',
    desc: 'Use OpenID Connect-based verifiable credential exchange.',
    icon: (
      <img
        src="/images/oid4vc_logo.png"
        alt="OID4VC Logo"
        className="h-10 w-30"
      />
    ),
  },
]

export const subOptionsMap = {
  didcomm: [
    {
      id: 'anoncreds',
      title: 'AnonCreds',
      desc: 'Privacy-preserving credentials issued over DIDComm.',
      tooltip:
        'AnonCreds enables privacy-preserving credentials using ZK proofs.',
    },
    {
      id: 'w3c',
      title: 'W3C VCDM',
      desc: 'W3C Verifiable Credentials compatible with DIDComm transport.',
      tooltip: 'W3C VCDM defines interoperable verifiable credentials.',
    },
  ],

  oid4vc: [
    {
      id: 'jwt_vc_json-ld',
      title: 'W3C VC (JWT)',
      desc: 'W3C Verifiable Credential, signed as a JWT, issued via OID4VC.',
      tooltip:
        'jwt_vc_json-ld: a standard JWT (header.payload.signature) whose payload carries a W3C VC envelope, verifiable with any JWT library.',
    },
    {
      id: 'ldp_vc',
      title: 'W3C VC (Linked Data Proof)',
      desc: 'W3C Verifiable Credential with a Linked Data Proof, issued via OID4VC.',
      tooltip:
        'ldp_vc: a W3C Verifiable Credential signed with a JSON-LD Linked Data Proof rather than a JWT envelope.',
    },
    {
      id: 'sdjwt',
      title: 'SD-JWT',
      desc: 'Selective Disclosure JWT-based credentials for OID4VC.',
      tooltip: 'SD-JWT supports selective disclosure with JWT format.',
    },
    {
      id: 'mdoc',
      title: 'MDOC',
      desc: 'Mobile Document (ISO/IEC 18013-5) via OID4VC.',
      tooltip: 'MDOC follows ISO/IEC mobile identity standard.',
    },
  ],
}

export const didOptionsMap: Record<string, string[]> = {
  anoncreds: [
    'did:indy:bcovrin:testnet',
    'did:indy:indicio:demonet',
    'did:indy:indicio:mainnet',
    'did:indy:indicio:testnet',
  ],

  w3c: [
    'did:polygon:testnet',
    ...(MODE === 'PROD' ? ['did:polygon:mainnet'] : []),
    'did:key',
    'did:web',
  ],

  // OID4VC sub-option ids (see subOptionsMap.oid4vc above) were never
  // mapped here, so picking "OID4VC" as the protocol led to an empty DID
  // method dropdown — the only way to actually create a DID was to pick
  // "DIDComm" instead, even for an OID4VC-only org. `mdoc` is intentionally
  // left unmapped: the backend's template DTO rejects `signerOption: DID`
  // for `mso_mdoc` (it requires an X.509 cert instead, configured under
  // Trust -> x509), so there's no valid DID choice to offer there.
  'jwt_vc_json-ld': ['did:key', 'did:web'],
  ['ldp_vc']: ['did:key', 'did:web'],
  sdjwt: ['did:key', 'did:web'],
}
