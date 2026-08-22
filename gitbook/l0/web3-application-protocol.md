# CoNET Web3 Application Protocol

**Evidence level: Under development.** This page is the **application-layer** draft for wallet-addressed, mutually authenticated, privacy-routed access to Web / API / AI hosts. It is **not** an additional Layer Minus wire command. L0 still only forwards OpenPGP armor; URI, request/response, session, and browser Origin semantics belong here.

Public site: [https://gitbook.conet.network/l0/web3-application-protocol.html](https://gitbook.conet.network/l0/web3-application-protocol.html)

**One-line definition:** *A wallet-addressed, mutually authenticated and privacy-routed application protocol.*

Operator / host gateway: [Applications — conet-l0d](../applications/conet-l0d.md) (**CoNET Web3 Enterprise Gateway** product role).  
Forwarding plane: [How to use Layer Minus](using-l0.md).  
Peer locator grammar already in the crate: `web3://` — do **not** treat that locator alone as a finished Application Protocol.

## Why a separate protocol page

| Layer | Owns |
| --- | --- |
| **Layer Minus (L0)** | Entry → mailbox / occupy pipe; OpenPGP key-ID routing; no business schema |
| **CoNET L1** | Intended **Web3 Domain** registry (owner wallet, service wallet, keys, route record) — design target; do not invent a second DNS of public origin IPs |
| **Web3 Application Protocol** | Canonical URI, signed request/response, session / delegation, Origin isolation, errors, optional payment scopes |
| **Enterprise Gateway (`conet-l0d`)** | Host-side adapter: verify wallet, map paths to local HTTP/REST/GraphQL/WebSocket/TCP, inject trusted identity headers, hide origin IP |

Do not equate **Peer Locator completion** with **Application Protocol production**. Overlay `web3://…/p2p/geth` is one composition; enterprise `web3://company.web3/dashboard` is another.

## Target access flow

```text
Browser extension (client gateway)
  → resolve Web3 Domain on CoNET L1 (service wallet + keys + L0 route; not origin IP)
  → sign + encrypt Application Request
  → POST ciphertext through any healthy L0 entry
  → Layer Minus routes by wallet / OpenPGP key ID
  → enterprise conet-l0d verifies user / session
  → forward to local Web or API (no public 80/443 required on the origin)
  → host signs + encrypts response
  → L0 returns to the extension; extension verifies host before render
```

**Accurate claim:** user and host need not publish stable network locations to each other; identity is wallet + keys + L0 route.  
**Do not claim:** “no IP anywhere,” automatic anonymity, or that wallet control equals a natural-person identity.

## Modules that v1 must define

| Module | Must specify |
| --- | --- |
| **URI** | Authority, path, query, version; exact tag resolution; byte-level canonicalization |
| **Request** | Method, domain, host wallet, `bodyHash`, nonce, `requestId`, `issuedAt`, expiry, signature |
| **Response** | Status, `contentType`, `bodyHash`, `requestId`, host signature, expiry |
| **Session** | Session public key, scope, lifetime, spend cap, revoke, device recovery |
| **Delegation** | Domain Owner → Operator → online Host Key chain |
| **Transport** | P1 control plane; occupied duplex data plane; streaming, fragmentation, reconnect |
| **Origin** | Storage, cookie substitutes, CORS, CSP, cache, Service Worker, device permissions |
| **Payment** (optional) | Session budgets, metering, DLE aggregation, L1 settlement |
| **Errors** | Unreachable, bad signature, expired route, permission denied, replay, downgrade |

### Signature minimum set

- Bind **Domain**, **Host Wallet**, **chainId**, and **protocol version**.
- Include **nonce**, **issuedAt**, **expiresAt**, **requestId**, and **body hash**.
- Require a single byte-level canonical encoding (path, Unicode, query, JSON).
- Prefer readable Typed Data (or equivalent); forbid ambiguous blind-sign text.

## What exists today vs what is destination

| Piece | Status in this book |
| --- | --- |
| L0 wallet-address forwarding | **Implemented capability** — [using-l0](using-l0.md) |
| `conet-l0d` TUN / overlay / duplex for L1 P2P | **Under development** / lab-proven — [Applications](../applications/conet-l0d.md) |
| Enterprise Gateway product role | **Destination** documented on the Applications page; not a shipped public hosting product |
| Browser extension Origin model | **Not** a public production client in this book |
| L1 Web3 Domain registry fields | **Design target** on this page; do not treat as a deployed canonical registry until an L1 page says so |
| Formal Application Protocol v1 byte spec | **Draft** — this page |

## Honest privacy boundary

| Party | May observe |
| --- | --- |
| Client entry | User IP, timing, size, rate — not end-to-end business plaintext |
| Intermediate Guardian | Routing metadata + ciphertext |
| Host mailbox / entry | Host online / traffic shape — not user business plaintext |
| Enterprise host | App wallet, permission, request content — usually not user public IP |
| User | Web3 Domain, host wallet, signed responses — usually not host public IP |
| On-chain observer | Domain / wallet / registration / funding links |
| Global passive observer | Possible timing and size correlation |

## Related

- [Applications — conet-l0d (Enterprise Gateway + L1 overlay)](../applications/conet-l0d.md)
- [How to use Layer Minus](using-l0.md)
- [Wallet-addressed peer identity](wallet-address-p2p.md)
- [Duplex overlay](duplex-forward.md)
- [SilentPass](../applications/silentpass-vpn.md) — egress to a public `host:port`; different composition
- [Security limits](security-limits.md)
