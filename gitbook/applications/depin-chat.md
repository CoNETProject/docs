# CoNET DePIN Chat

**Maturity: Integrated capability.** DePIN Chat is implemented inside Beamio consumer, merchant, and POS flows. It is not presented here as a feature-complete replacement for mainstream messaging platforms.

Public site: [https://gitbook.conet.network/applications/depin-chat.html](https://gitbook.conet.network/applications/depin-chat.html)

## Product role

DePIN Chat is an **application composition** of Layer Minus. L0 only forwards OpenPGP envelopes by wallet / key ID; see [How to use Layer Minus](../l0/using-l0.md). Wire samples: [SI developer guide](../l0/si-developer-guide.md) and [Chat developer guide](../l0/chat-developer-guide.md). This product turns that forwarding path into:

- wallet-addressed one-to-one messages;
- typed application envelopes, such as POS terminal authorization;
- delivery state, transient presence, and encrypted cross-device history.

The messaging identity is an **EOA with AddressPGP material**, not an AA Smart Wallet, phone number, or platform account. `@BeamioTag` is a discovery aid; clients must resolve an exact tag and use the resulting EOA rather than selecting the first prefix-search result.

DePIN Chat is a messaging and application-control plane. It does not currently claim the group, channel, voice, video, moderation, or contact-graph maturity of a general social messenger.

## Protocol dependencies

| Dependency | Application use |
| --- | --- |
| **AddressPGP on CoNET L1** | Associates an EOA with a user PGP public key and a mailbox route key |
| **EIP-191 signatures** | Authenticates the sender’s outer message envelope and mailbox control commands |
| [Layer Minus mailbox routing](../l0/mailbox-routing.md) | Sends through entry **A**, stores at mailbox **B**, and listens through entry **C**, with `A ≠ B` and `C ≠ B` |
| **User PGP keys** | Encrypt business messages to recipients and delivery receipts back to senders |
| **Route PGP keys** | Encrypt mailbox-control commands such as listen, presence query, and mailbox delivery ACK |
| **CoNET-SI mailbox state** | Stores ciphertext, maintains live listen pools, forwards SSE data, and applies delivery ACKs |
| **Encrypted IPFS fragments + ChatIndexRegistry** | Provides a recoverable encrypted-history track whose head pointer is recorded by [`ChatIndexRegistry`](https://mainnet.conet.network/address/0x1511Caa71081C84d8a591490D1b83879088EED72) on CoNET L1 |
| **Client Worker and local database** | Decrypts, verifies, merges, and renders messages without placing private keys in relay nodes |

## How protocol capability becomes messaging

### A / B / C delivery path

```text
Sender S
  │  sign the application text
  │  encrypt the business envelope to recipient R's user PGP
  │  HTTP POST /post to entry A  (HTTPS optional; body is already user-PGP ciphertext)
  ▼
Entry A  ─────────►  mailbox B
                     │  stores ciphertext before best-effort live forwarding
                     │
Recipient R          │
  │  encrypt listen command to B's route PGP
  │  open SSE through entry C
  └─────────────────►  C forwards the listen to B

Only R's user key decrypts the business message.
```

The client must not send or listen by directly dialing mailbox B. Entry health, mailbox delivery, application ingestion, and user-visible delivery are separate states.

### User PGP and route PGP are not interchangeable

| Payload | Encryption target | Reason |
| --- | --- | --- |
| Ordinary chat or typed business message | Recipient **user PGP** | Only the recipient application should read business plaintext |
| `beamio_chat_delivery_receipt_v1` | Original sender **user PGP** | The sender application reads and applies the delivery state |
| Listen command | Mailbox B **route PGP** | B must read the control command and attach the SSE listener |
| `wallet_online_query` | Contact mailbox B **route PGP** | B answers from its own live listen pool |
| `gossip_delivery_ack` | Recipient mailbox B **route PGP** | B removes the matching offline item and cancels pending notification work |

Encrypting a business message to a route key would let the mailbox read it. Encrypting a mailbox-control command to a user key would prevent the mailbox from processing it.

### Delivery acknowledgements

After the recipient has verified and ingested an ordinary message, the client emits two independent acknowledgements:

1. **Mailbox ACK** — `gossip_delivery_ack`, encrypted to B’s route PGP. It identifies the stored ciphertext by hash and lets B remove the offline copy or stop an outstanding notification timer.
2. **Sender receipt** — `beamio_chat_delivery_receipt_v1`, encrypted to the sender’s user PGP. It updates the sender’s existing message to **Delivered**.

Neither acknowledgement should become a visible chat bubble. **Delivered** means the recipient application ingested the message and emitted the receipt; it is not a human read receipt.

### Presence and `listenKind`

The recipient listen is a **long-lived HTTP/SSE**. An ISP or entry C can see duration, reconnects, heartbeats, push cadence, and online hours even though message bodies stay encrypted. That fingerprint is inherent to Realtime Mode. A Privacy Poll Mode (randomized short polls, batch fetch, dummy traffic) is **not implemented**. Long-term user OpenPGP wrapping also does **not** provide forward secrecy for stored ciphertext. See [L0 security limits](../l0/security-limits.md).

Chat clients establish the mailbox SSE with:

```text
command: "mining"
listenKind: "chat"
```

Layer Minus mining clients omit `listenKind` and remain in the mining class. This distinction prevents chat-session lifecycle rules from being applied to mining listeners.

Presence is a mailbox observation:

- the querying client sends `wallet_online_query` to the contact’s mailbox route key through an independent entry;
- B checks whether that wallet has a non-stale live listener;
- only a valid `ok: true` response updates the UI;
- a timeout or failed query preserves the last trusted value.

Presence is **not** written to AddressPGP and must not be inferred from a historical chain `routeOnline` field.

### History recovery

The application maintains two distinct tracks:

| Track | Purpose |
| --- | --- |
| **Local UI conversations** | Immediate rendering on the current device |
| **Encrypted recovery track** | AES-GCM encrypted message fragments plus an encrypted index on IPFS, with the current index hash referenced by ChatIndexRegistry |

The recovery key is derived from the user’s EOA signing authority. Relays and IPFS do not receive plaintext history keys.

On recovery, the client reads the pointer, decrypts the available index and fragments, creates any missing peer conversations, and merges messages by stable identifiers. Network, RPC, IPFS, or decryption failure must not be treated as an authoritative empty history and must not erase the last trusted local state.

## What exists today

Beamio integrations:

| Surface | Current use |
| --- | --- |
| **Consumer PWA** | One-to-one Messages, mailbox presence, delivery state, and encrypted-history recovery |
| **Merchant OS** | Chat listener and POS terminal-authorization inbox |
| **POS PWA** | Sends `beamio_pos_terminal_permission_v1` to the merchant EOA |

Typed message handling:

| Message type | Application result |
| --- | --- |
| Ordinary chat | Added to the relevant Messages conversation |
| `beamio_pos_terminal_permission_v1` | Added to Merchant OS **Pending terminal authorization**, not Messages |
| `beamio_chat_delivery_receipt_v1` | Updates an existing sender message to **Delivered**, without adding unread state |

Source availability differs by client. Consumer, Merchant OS, and Alliance are public SilentPassUI branches. POS PWA remains a live product without a standalone public repository identified.

| Component | Public repository | npm |
| --- | --- | --- |
| **Chat SDK** — Worker, gossip, and encrypted history | [CoNET-project/chat-sdk](https://github.com/CoNET-project/chat-sdk) | [`@conet.project/chat-sdk`](https://www.npmjs.com/package/@conet.project/chat-sdk) |
| **Consumer PWA** | [CoNET-project/SilentPassUI](https://github.com/CoNET-project/SilentPassUI/tree/cashtree) branch `cashtree` | — |
| **Merchant OS** | [CoNET-project/SilentPassUI](https://github.com/CoNET-project/SilentPassUI/tree/cashtrees) branch `cashtrees` | — |
| **POS PWA** | Live endpoints only; no standalone public repository identified | — |
| **Alliance client** | [CoNET-project/SilentPassUI](https://github.com/CoNET-project/SilentPassUI/tree/Alliance) branch `Alliance` | — |
| **Mailbox node / SI** | [CoNET-project/CoNET-SI](https://github.com/CoNET-project/CoNET-SI) | [`@conet.project/mvp-si`](https://www.npmjs.com/package/@conet.project/mvp-si) |
| **API relay** — route registration and history-pointer settlement | [settleonbase/x402sdk](https://github.com/settleonbase/x402sdk) | [`@settle402/sdk`](https://www.npmjs.com/package/@settle402/sdk) |

These implementation surfaces establish integration, not a claim that every mailbox is continuously available or that all clients expose the same feature set.

## What remains in development

- Continue reliability testing for offline storage, reconnect, duplicate delivery, notification timing, and mailbox failover.
- Improve key-registration, key-rotation, recovery, and device-migration UX.
- Expand interoperability tests across Consumer, Merchant OS, POS, Alliance, SDK, and SI versions.
- Publish independent reviews of message-envelope validation, OpenPGP handling, history-key derivation, and local key storage.
- Add broader messaging features only with explicit protocol and metadata boundaries; do not infer groups, channels, calls, or moderation from the one-to-one transport.
- Measure and document metadata leakage, latency, retention behavior, and practical mailbox availability.

## Trust and security boundary

| Boundary | What remains visible or trusted |
| --- | --- |
| **Entry A / C** | Sees the connecting client IP, timing, volume, and the OpenPGP recipient **key ID** needed to look up B; forwards ciphertext over HTTP; does not read business plaintext; can delay or drop traffic |
| **Mailbox B** | Sees route ownership, ciphertext arrival, listener state, and timing; decrypts route-control commands but not user-PGP business plaintext |
| **Recipient device and user key** | Can decrypt message plaintext and history; compromise of the device or private key exposes that data |
| **Sender signature** | Authenticates the claimed sender when verification succeeds; clients must reject malformed or invalid envelopes |
| **Push-notification path** | Signals that offline data may exist; it must not require business plaintext in the mailbox notification payload |
| **IPFS and chain history pointer** | Store ciphertext and a public pointer, not plaintext; traffic and update timing remain observable |

Additional limits:

- Wallet identity is pseudonymous and public-chain activity may be correlated. Reusing the Chat EOA for payments or social identity strengthens that graph.
- Historical Chat armor encrypted to the long-term user PGP key is not forward-secret if that key is later compromised.
- A global observer capable of correlating entry and mailbox traffic is outside this design’s confidentiality claim.
- Presence is transient and can be stale; it is not a durable promise that a person is reading.
- Delivery receipt proves application ingestion, not human attention.
- Losing the EOA recovery authority can make encrypted history unrecoverable.
- Availability depends on entries, the selected mailbox, RPC access, and client key state even when ciphertext confidentiality remains intact.

## Related

- [Beamio](beamio.md)
- [Institutional multisig AA](institutional-multisig-aa.md) — same wallet identity plane; task truth remains on-chain
- [Use case: decentralized SNS](../use-cases/decentralized-sns.md)
- [Applications](README.md)
- [SI developer guide](../l0/si-developer-guide.md)
- [Chat developer guide](../l0/chat-developer-guide.md)
- [L0 security limits](../l0/security-limits.md)
- [Zero-trust mailbox routing](../l0/mailbox-routing.md)
- [Wallet-address P2P](../l0/wallet-address-p2p.md)
- [UDP forward](../l0/udp-forward.md)
- [SilentPass VPN](silentpass-vpn.md)
- [Resources](../resources.md)
