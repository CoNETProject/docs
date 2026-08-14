# L0 security limits and threat grades

**Evidence level: Implemented capability** for the current CoNET-SI forwarding plane; **design study** for listed upgrades that are not in SI `main`.

This page states what Layer Minus actually protects. It answers common over-claims: Fetch-and-Close is not an anonymity protocol; Chat SSE is a traffic fingerprint; long-term user OpenPGP keys do not provide forward secrecy; a valid EOA signature does not by itself stop replay; A/B/C role names are not independent operators.

L0 remains a [PGP / wallet-address forwarding network](using-l0.md). Stronger privacy modes are **application compositions** unless SI implements them.

Public source for the live plane: [CoNET-project/CoNET-SI](https://github.com/CoNET-project/CoNET-SI).

## Fetch-and-Close is a short-session mode

[Fetch-and-Close](http-mimicry.md) is optional:

```text
select an entry → send one bounded request → receive a bounded response → close
```

It can reduce:

- long-lived connection duration;
- a fixed tunnel fingerprint;
- single-connection bidirectional volume statistics;
- long-term binding to one entry;
- a continuous network identity at one exit;
- the window during which one connection can be monitored.

It cannot remove:

- the set of entry IPs a client uses;
- request time;
- packet or ciphertext length;
- request frequency;
- periodic polling;
- a stable client or TLS fingerprint when HTTPS is used;
- correlation of adjacent requests;
- the bandwidth curve of a large download;
- global entry–exit matching by a well-placed observer.

The current book already treats Fetch-and-Close as optional. Chat and mining use long-lived SSE. UDP client and server listens are also SSE. Browsers may reuse HTTP/2 connections. Browser pooling, caching, and OS behavior can break a “new connection per resource” assumption. Those effects must be **measured**, not inferred from the design.

**Grade:** Fetch-and-Close lowers persistent-flow features. It is **not** a traffic-anonymity protocol. Size padding and timing jitter are **not implemented**.

## Outer envelope and nested PGP hops

SI routing is not limited to “one key ID, never decrypt.” After a **local** decrypt **once**:

1. If the plaintext is still OpenPGP armor, read the inner `getEncryptionKeyIDs()`.
2. If that inner key ID **is** this node's route PGP, treat it as an attack: emit socket `end` and stop. Do not peel again on the same node.
3. If the inner key ID is **not** this node, read SI-to-SI `X-CoNET-Hop-Sigs`. More than **3** hop signatures (or a count that cannot take another hop) is an all-node flood: emit `end` and **do not** forward.
4. Otherwise **forward the inner armor** and append this node's hop signature. When the destination SI ends the socket, the previous hop closes and frees that connection.
5. If the plaintext is a signed mailbox / egress command, the last hop verifies hop signatures and meters those prior-hop bytes against the **user** wallet for **GB**.

An application can therefore wrap a user-PGP business message to entry A, or to a short hop chain (at most three SI-to-SI signatures). A first-hop path observer then sees the **outer** key ID, not R's. Each peel node still learns the **next** key ID, time, and size. Extra hops are extra **GB**. This is not a mix network and does not replace padding.

Current Chat clients may still post a single user-PGP layer (A forwards without decrypting). The peel rule is available to any client that wraps.

## Chat SSE is a primary L0 traffic fingerprint

DePIN Chat’s recipient opens a long-lived HTTP/SSE listen through entry **C** (`command: "mining"`, `listenKind: "chat"`). Mining collectors and UDP listens also keep SSE sessions.

An ISP or entry C can observe:

- a long-lived HTTP/SSE;
- disconnect and reconnect;
- liveness heartbeats;
- a downlink push pattern;
- active hours;
- traffic peaks;
- online / offline cadence.

Content remains OpenPGP-encrypted. Metadata can still support inferences about when a user is online, how often messages arrive, device sleep/wake, and that a chat-like application is in use.

### Proposed receive modes (not implemented)

| Mode | Intended behavior | Status |
| --- | --- | --- |
| **Realtime** | Long-lived SSE; low latency; current Chat / POS / mining / UDP listen | **Implemented** |
| **Privacy poll** | Randomized short polls, batch fetch, optional padding and dummy polls; higher latency; weaker online and arrival-time correlation | **Not implemented** |

A client could offer both. That choice is application-layer. Current SI mailbox delivery is store-then-push over SSE.

## Long-term user OpenPGP is not forward-secret

Business messages are encrypted to the recipient’s **registered user OpenPGP public key**. OpenPGP typically creates a per-message symmetric session key and wraps that key to the long-term recipient public key.

If that long-term private key is later compromised, an attacker who stored earlier ciphertext may decrypt it. The live model therefore provides:

- confidentiality against nodes that lack the user private key;
- sender authentication when the outer EOA signature verifies;
- a per-message random session key **wrapped by the long-term key**.

It does **not** currently specify or implement:

- forward secrecy for stored Chat ciphertext;
- post-compromise security;
- Double Ratchet;
- automatic session-key rotation after first contact;
- MLS group messaging ([RFC 9420](https://www.rfc-editor.org/rfc/rfc9420.html)).

Encrypted Chat history (IPFS fragments + `ChatIndexRegistry`) is likewise keyed from long-term EOA/OpenPGP material. Compromise of that authority can expose recoverable history.

### Proposed hybrid (not implemented)

Keep AddressPGP as the wallet-identity and mailbox-routing root. After an OpenPGP (or equivalent) first handshake, move ongoing one-to-one content into an X25519 / X3DH + Double Ratchet session, and use MLS only if a group product is specified. Until that composition exists, do not describe Chat as forward-secret.

On-demand new wallets reduce *future* correlation after a leak; they do not decrypt-protect already captured armor.

## Plain HTTP allows active path attacks

OpenPGP and EOA signatures stop a path observer from **quietly rewriting plaintext**. They do not stop an HTTP observer from:

- dropping or delaying packets;
- replaying an old request;
- injecting a false HTTP status;
- returning a fake entry response;
- blocking a recipient key ID;
- classifying by key ID;
- forcing client retries;
- measuring whether a mailbox accepted a copy.

`checkSign` in CoNET-SI recovers the EOA from `personal_sign(message)` and checks it against `walletAddress`. That is authentication of **that exact string**, not a consumed-nonce store.

Partial anti-replay exists only on some **route-key commands**:

| Object | Current binding | Replay store |
| --- | --- | --- |
| Generic `/post` business armor | OpenPGP integrity + client-defined inner fields | Mailbox `saveLocal` **appends**; identical armor can be stored again |
| `wallet_online_query` / `gossip_delivery_ack` | EIP-191 + `timestamp` within ±600 s | No durable nonce set |
| UDP listen / relay / uplink | EIP-191 + `timestamp` within ±600 s; payload size cap | No replay window beyond the skew |
| Chat `sendId` | Application field; clients may drop duplicates | Not an SI mailbox invariant |

A correct EOA signature therefore does **not** automatically reject a previously valid message.

### Required application bindings (normative for new compositions)

Non-idempotent application objects (payments, POS authorization, UDP session creation, spend) must bind at least:

`messageId`, `nonce`, `timestamp` / `expiry`, `senderWallet`, `recipientWallet`, `commandType`, `payloadHash`, `protocolVersion`.

The consuming mailbox or application must persist **consumed** identifiers. Do not treat TLS, HTTP 2xx, or `checkSign` alone as that store.

### TLS 1.3 0-RTT (not used by the HTTP-first path)

The intended client `/post` path is plain HTTP. If a future Fetch-and-Close client uses TLS 1.3 0-RTT for performance, 0-RTT has **no inherent anti-replay** ([RFC 8446](https://www.rfc-editor.org/rfc/rfc8446.html)). Non-idempotent operations must still consume application nonces.

## Mailbox isolation fails under collusion

A/B/C separation prevents an ordinary mailbox from seeing the client’s direct IP. It is a **role** split, not a proof that A, B, and C are independent operators.

| Collusion | Combined view |
| --- | --- |
| **A + B** | A has sender IP, recipient key ID, mailbox identity, time, and size. B has the route, stored armor, and arrival time. Together they reconstruct a send relationship. |
| **C + B** | C has the recipient IP. B has the recipient wallet, presence, listen session, and message-arrival times. Together they bind wallet to network location. |
| **Same operator for A, B, and C** | Distinct chain addresses or Guardian IDs do not create independent trust domains. |

L1 has no public operator-domain census equivalent to the DLE `OperatorDomainRegistryV1` specification. Clients today pick healthy entries; SI does not enforce “this operator must not be both entry and mailbox on one path.”

### Proposed operator hygiene (not implemented on L0)

- Same operator domain must not be both entry and mailbox on one path.
- Clients check an operator-domain signal before selecting A/C.
- Diversify by ASN, cloud, and region.
- Rotate mailboxes.
- Publish independence metrics.
- Challenge and slash correlated multi-wallet operators.
- Remember recent path triples locally and avoid immediate reuse.

Until those exist, treat A/B/C as **correct use of roles**, not as multi-operator anonymity.

## UDP forward: cryptography vs native UDP

The cryptographic split is sound and implemented:

- session AES key is encrypted only to the UDP server **user PGP**;
- mailbox B must not receive that key;
- route commands must not carry `Securitykey`;
- frames are AES-256-GCM;
- client and server should reach B through different entries;
- UDP pools are separate from chat/mining.

UDP forward is **not** native UDP. It is HTTP request plus SSE. It does not automatically provide UDP timing, congestion control, retransmission, delivery ACK, application-consumption proof, packet ordering, or low-jitter realtime performance.

Mailbox B still sees `sessionId`, client and server wallets, frame timing and size, direction, and session duration. That metadata can classify VoIP-like, game-like, or sensor-like use even when payloads stay encrypted.

Implemented bounds: 12,000-character payload, ±600 s timestamp, session-count caps, 10-minute idle sweep, downlink `seq` for SSE writes.

### Proposed UDP hardening (not implemented)

Sequence numbers with a replay window, padding buckets, optional constant-rate mode, application ACKs, rekey, and tighter per-session byte limits. Document these as upgrades, not as the live relay.

## Wallet identity is a correlation paradox

A wallet solves problems IP cannot: cryptographic ownership, mobility without renaming the peer, and accounts that are not issued by a platform.

A **long-lived** wallet used for Chat, POS, Beamio, mining, L1 transfers, DLE, BT, Treasury, and public social identity becomes a stable join key. Observers can build `wallet → chat activity → payments → services → social graph`.

A wallet is more autonomous than an IP. It is **not** automatically harder to correlate than an IP.

### Proposed layered identities (application, not L0)

```text
Master wallet
  ├── Chat identity
  ├── POS identity
  ├── BT session identity
  ├── DLE payment identity
  └── Temporary network identity
```

Delegation proofs can authorize a child wallet in one plane without putting the master wallet on every envelope. L0 will forward whatever key ID it is given. Isolation is an application registration policy. [How to use L0](using-l0.md) already allows on-demand new wallets; it does not hide the link if the application reuses one EOA everywhere.

## Current L0 threat grades

Grades describe the **current SI + intended A/B/C client path**, not a future ratchet, poll mode, or operator registry.

| Attack or observer goal | Current protection | Note |
| --- | --- | --- |
| Intermediate node reads business plaintext | **Strong** | User-PGP armor is not decrypted on forward |
| Mailbox reads business plaintext | **Strong** | B stores and pushes armor; decrypts only route-key commands |
| Recipient learns sender IP | **Moderately strong** | Intended path posts through A; inner envelope may still name the sender wallet |
| Mailbox learns client IP | **Moderately strong** on a correct A/B/C path | Direct-to-B use collapses this |
| ISP reads business plaintext | **Strong** | OpenPGP body |
| ISP classifies an HTTPS entry | **Weak to moderate** | SNI / JA3 / certificate |
| ISP classifies HTTP `POST /post` | **Weak** | Path, JSON, ASCII armor; key ID is the **outer** layer (R's key unless the client wrapped) |
| Entry learns recipient wallet / route | **Weak** on a one-layer post; **reduced for the first-hop observer** with an outer wrap | After a local peel, A still sees the next key ID |
| Long-term wallet graph | **Moderate to weak** | Public chain + reused EOA |
| Single malicious relay | **Moderately strong** | Cannot read user-PGP content; can drop, delay, or classify |
| Entry + mailbox collusion | **Weak** | Role split ≠ operator split |
| Global timing correlation | **Weak** | No padding or mix |
| Endpoint compromise | **Weak** | Device or long-term key exposure |
| Historical-message forward secrecy | **Insufficient** | Long-term user PGP wrap |
| Sybil / correlated relays | **Economic and operational** | Guardian stake and ops; no L0 operator-domain enforcement |

## What applications must not claim

- Fetch-and-Close as mix-net or anonymity.
- Chat SSE as metadata-private presence.
- OpenPGP-to-AddressPGP as Double Ratchet / MLS.
- `checkSign` as anti-replay for payments or POS.
- A/B/C as independent-operator anonymity.
- UDP forward as native realtime UDP.
- One wallet as an unlinkable identity across products.

## Implementation anchors

- Entry HTTP/HTTPS and `{ data }` POST: [CoNET-SI `server.ts`](https://github.com/CoNET-project/CoNET-SI/blob/main/src/endpoint/server.ts)
- Key-ID forward and `checkSign`: [CoNET-SI `localNodeCommand.ts`](https://github.com/CoNET-project/CoNET-SI/blob/main/src/util/localNodeCommand.ts)
- Mailbox append store: `saveLocal` in [CoNET-SI `util.ts`](https://github.com/CoNET-project/CoNET-SI/blob/main/src/util/util.ts)
- UDP bounds: [CoNET-SI `udpForward.ts`](https://github.com/CoNET-project/CoNET-SI/blob/main/src/util/udpForward.ts)
- Chat listen composition: [DePIN Chat](../applications/depin-chat.md)

## Next

- [How to use Layer Minus](using-l0.md) — compose only the primitives that exist.
- [HTTP transport and Fetch-and-Close](http-mimicry.md) — short-session carrier.
- [Zero-trust mailbox routing](mailbox-routing.md) — A/B/C roles.
- [Wallet-addressed peer identity](wallet-address-p2p.md) — key roles and reuse risk.
- [UDP frame forwarding](udp-forward.md) — AES split and remaining metadata.
