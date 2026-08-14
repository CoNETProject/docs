# DePIN DCDN / BT distribution

**Maturity: Under development.** CoNET has published protocol components that this application may reuse, but there is no published end-to-end DCDN / BitTorrent client, live swarm service, or finalized seeding-settlement protocol described by this page.

Public site: [https://gitbook.conet.network/applications/bt-dcdn.html](https://gitbook.conet.network/applications/bt-dcdn.html)

## Product role

DePIN DCDN is the proposed bulk-content application for the CoNET stack. Its intended role is to combine:

- **wallet-addressed discovery** instead of exposing a stable `IP:port` as the application-level peer identity;
- **content hashes and piece hashes** so downloaders can verify received bytes;
- **Layer Minus request routing** so a client can reach a seeder through an entry rather than treating the seeder’s physical address as the public product name;
- **incentivized seeding** so storage and bandwidth can be compensated rather than relying only on volunteer availability.

“BT” describes the useful piece and swarm concepts borrowed from BitTorrent. It does not mean that the current BitTorrent protocol has already been ported to L0, that existing torrent clients are compatible, or that CoNET currently operates a decentralized CDN.

This is an application on L0 and a potential consumer of settlement capabilities. It is not a fourth protocol layer.

## Protocol dependencies

| Dependency | Intended application use | Current status for DCDN |
| --- | --- | --- |
| [Wallet-address P2P](../l0/wallet-address-p2p.md) | Discover a participant by wallet and route metadata rather than publishing a home `IP:port` in the application roster | L0 capability exists; DCDN discovery protocol is not finalized |
| [HTTP mimicry & Fetch-and-Close](../l0/http-mimicry.md) | Carry bounded piece requests through short HTTP(S)-shaped sessions | L0 capability exists; torrent-scale behavior is not demonstrated |
| **Content manifest and hashes** | Identify a release, enumerate pieces, and verify each piece before assembly | Application schema remains to be specified |
| **Seeder advertisement and discovery** | Associate content hashes with currently available wallet-addressed seeders | Discovery service / DHT replacement remains to be implemented |
| **Accounting and settlement** | Meter useful delivery and compensate eligible seeders | Incentive and fraud-proof design remains to be implemented |
| [UDP forward](../l0/udp-forward.md) | Optional datagram-shaped control frames without directly dialing a routed node | Existing separate capability; use by DCDN is undecided |
| [CoNET-DLE](../l2/README.md) | Candidate settlement plane for aggregate or high-frequency rewards | Dependency direction is proposed; exact integration is not finalized |

The DCDN client must define its own application protocol. Existing L0 packages do not automatically provide torrent manifests, swarm scheduling, piece exchange, seeding proofs, or content policy.

## How protocol capability could become an application

The target flow is:

```text
Publisher
  │  split content into pieces
  │  publish manifest + content root + piece hashes
  ▼
Wallet-addressed discovery
  │  find seeders advertising the content hash
  ▼
Downloader
  │  request selected pieces through Layer Minus entries
  │  verify every piece hash
  │  assemble and verify the complete content root
  ▼
Delivery accounting
  │  produce fraud-resistant evidence of useful service
  ▼
Settlement
     compensate eligible seeders under a defined policy
```

Each stage needs an explicit specification:

### Wallet-addressed discovery

A wallet address can be the stable application identifier while physical routing remains behind Layer Minus. This can keep a seeder’s home address out of the public swarm roster, but it does not make the underlying network address cease to exist. Entries, routed nodes, and network observers still process network connections and metadata.

The discovery design must define:

- who may advertise a content hash;
- how advertisements expire and are refreshed;
- how a client distinguishes live seeders from stale records;
- how Sybil identities, poisoned advertisements, and eclipse attacks are limited;
- whether discovery is on-chain, off-chain, DHT-like, mailbox-based, or hybrid.

None of those choices should be inferred from wallet addressing alone.

### Content hash and piece verification

The manifest should commit to the exact content and its pieces. A downloader accepts a piece only when its hash matches the manifest and accepts the final file only when the complete content commitment matches.

Content addressing provides **integrity**, not:

- confidentiality;
- publisher authenticity unless the manifest is also signed;
- proof that content is safe, legal, or correctly licensed;
- availability when no honest seeder retains the bytes.

The hash algorithm, manifest serialization, publisher signature, piece size, versioning, and magnet / torrent compatibility remain design work.

### Incentivized seeding

The intended economic loop is to reward storage and useful delivery, particularly for cold content. A viable protocol must prove more than “a wallet claimed to seed”:

- a requester received correct, previously unavailable bytes;
- the seeder did not manufacture both sides of the exchange;
- duplicate, replayed, or trivial transfers are not paid repeatedly;
- accounting cannot be amplified cheaply through Sybil wallets;
- settlement cost does not exceed the delivered value;
- publisher budgets, downloader charges, and node rewards have explicit limits.

Micropayments, batched tips, publisher bounty pools, and proof-of-transfer accounting are candidate mechanisms, not shipped DCDN features.

## What exists today

The reusable public substrate is:

| Component | Public source |
| --- | --- |
| **L0 node substrate** — SI, HTTP-shaped routing, and wallet P2P primitives | [CoNET-SI](https://github.com/CoNET-project/CoNET-SI) · [`@conet.project/mvp-si`](https://www.npmjs.com/package/@conet.project/mvp-si) |
| **L0 client plane** | [CoNET-DL](https://github.com/CoNET-project/CoNET-DL) · [`@conet.project/mvp-dl`](https://www.npmjs.com/package/@conet.project/mvp-dl) |
| **Candidate settlement documentation** | [CoNET-DLE](../l2/README.md) · [Economics digest](../l2/economics.md) |

What does **not** exist as a published DCDN product today:

- a public DCDN / BT client repository or npm package;
- a released swarm-discovery implementation;
- a finalized manifest and content-hash format;
- a production piece scheduler and verifier;
- a documented live seeder market;
- finalized delivery-proof, fee, reward, fraud, or slashing rules;
- measured production throughput or availability.

The presence of L0 packages is evidence of dependencies, not evidence that the DCDN application is online.

## What remains in development

1. Specify manifest serialization, content roots, piece hashes, publisher signatures, and version negotiation.
2. Implement torrent / magnet ingest or explicitly define a non-BitTorrent-compatible format.
3. Design wallet-addressed seeder discovery, freshness, routing, and Sybil resistance.
4. Implement parallel piece scheduling, retries, rare-piece selection, local verification, resume, and final assembly.
5. Define privacy-preserving session identity without claiming that a wallet address is anonymous.
6. Design measurable, fraud-resistant proofs of useful storage and delivery.
7. Define payment assets, batching, fees, budgets, disputes, and settlement finality.
8. Add content-policy, abuse-reporting, malware, copyright, operator, and jurisdiction controls.
9. Benchmark throughput, latency, path overhead, cold-content availability, and entry / seeder capacity.
10. Publish client source, interoperability tests, threat models, and independent security review before describing the service as available.

## Trust and security boundary

| Boundary | Required interpretation |
| --- | --- |
| **Wallet identity** | Pseudonymous identifier, not proof of a human, legal entity, reputation, or anonymity |
| **Entry and routing nodes** | Can observe timing, volume, connection metadata, and can deny service; encryption does not guarantee availability |
| **Seeder** | Possesses or serves content pieces and can observe requests that reach it; it must not be trusted for byte integrity |
| **Content hash** | Detects altered bytes when the manifest is trustworthy; it does not authenticate the publisher by itself |
| **Publisher signature** | Can authenticate a manifest to a known publisher key, but does not establish content legality or safety |
| **Incentive system** | Must resist fake traffic, collusion, replay, Sybil behavior, and dishonest accounting before rewards are meaningful |
| **Network observer** | May correlate entries, seeders, timing, and wallet activity; the design is not a mixnet or protection against a global passive observer |
| **End user and operator** | Remain responsible for applicable content, malware, licensing, and legal obligations |

Hiding a stable peer IP from a swarm roster would be a useful property, but it must not be described as guaranteed anonymity, immunity from blocking, or immunity from lawful process.

## Related

- [Applications](README.md)
- [SilentPass VPN](silentpass-vpn.md) — a public privacy-access product on parts of the same L0 substrate
- [HTTP mimicry & Fetch-and-Close](../l0/http-mimicry.md)
- [Wallet-address P2P](../l0/wallet-address-p2p.md)
- [TCP/IP privacy threats](../l0/tcp-ip-privacy.md)
- [UDP forward](../l0/udp-forward.md)
- [CoNET-DLE](../l2/README.md)
- [Use case: creator economy](../use-cases/decentralized-youtube.md)
- [Resources](../resources.md)
