# Zero-trust mailbox routing

**Evidence level: Implemented capability.** The delivery path below is specified by the current protocol and implemented in CoNET-SI and participating clients; deployment health remains separate evidence.

Mailbox routing is the specified Layer Minus **forwarding** protocol. It separates the node that accepts a client connection from the node that stores ciphertext for the destination wallet. It is one piece of the [permissionless cloud](permissionless-cloud.md): **do not trust A, B, or C**. Any of them may be malicious. Privacy comes from encryption and role split, not from picking an honest operator.

L0 stops at “deliver this OpenPGP armor to the mailbox of this key.” Chat schemas, POS permission types, acknowledgements, and UI are [application combinations](using-l0.md) of the same path.

## Roles

| Symbol | Role |
| --- | --- |
| **S** | Sender of the **business** envelope (application EOA; may differ from any routing wallet) |
| **R** | AddressPGP row that owns the inbox user PGP and mailbox B. This may be a dedicated **routing wallet**, not the product display / payment EOA |
| **A** | Healthy entry used for sending |
| **B** | Mailbox selected by R's route binding |
| **C** | Healthy entry used for listening |

For the intended route, `A ≠ B` and `C ≠ B`. A and C may be different entries. A client must not optimize the path by connecting directly to B.

## How business delivery works

### Send: S → A → B

1. S resolves R's `userPublicKeyArmored` (the inbox key on R's AddressPGP row).
2. S signs the application envelope with its **sender** EOA. That EOA does not have to be R, and R does not have to be the recipient's display wallet.
3. S encrypts the complete envelope to **R's user OpenPGP key**.
4. Optionally, S wraps that armor in one or more **outer OpenPGP layers** addressed to A or to a hop chain. The first `/post` then shows the **outer** key ID to a path observer.
5. S posts the armored ciphertext to healthy entry A over **HTTP or HTTPS**. The HTTP JSON is **only** `{ "data": "<OpenPGP armor>" }`. Do **not** add sibling fields (`NoPush`, `beamioNoPush`, flags). Extra plaintext fields raise inspection risk. Because the body is already ciphertext, **HTTP is sufficient** and is the intended client path where TLS SNI or JA3/JA4 would be classified or blocked.
6. A reads `getEncryptionKeyIDs()`. If the key is not local, A forwards the **same armor** and signs the SI hop header. If the key **is** local, A decrypts **once**. When the plaintext is still OpenPGP and the inner side-channel key ID is not this node, A forwards the **inner** armor if hop signatures stay at or below **3**. Same-node inner PGP is an attack (`end`). A does **not** read user-PGP business plaintext.
7. B stores the inbound armor before attempting live SSE delivery. B does not decrypt the **user-PGP** business envelope. When B ends the socket, A frees that connection. SI hop signatures are the credential the last decrypting hop uses to meter prior-hop bytes against the **user** wallet for **GB**.

### Mailbox work envelope (B decrypts a delivery instruction)

If mailbox **B** must act on a delivery (today: skip APNs / offline push), the client wraps the inner user-PGP armor in a **mailbox work** packet encrypted to **B’s route PGP**. HTTP to the entry remains `{ "data": "<mailBoxNodeOpenPGP armor>" }`. Only B decrypts the work JSON and sees `NoPush`. Entry A sees only armor and the outer key ID.

```text
inner user-PGP armor
  → JSON { data: innerArmor, NoPush: true }
  → OpenPGP encrypt to mailbox B route PGP
  → optional wrap to this entry
  → POST { data } to A ≠ B
```

| Layer | Content | Encrypt to |
| --- | --- | --- |
| HTTP (entry / SI→SI) | **Only** `{ data: armor }` | — |
| Optional entry wrap | Inner armor | That **entry** route PGP |
| Mailbox work | `{ data: innerArmor, NoPush: true }` | **Mailbox B** route PGP |
| Business | Chat / sender receipt | Recipient **user PGP** |

Missing B’s route public key is a **failure**. Do not fall back to an HTTP sibling field. Ordinary Chat and POS permission messages **must not** set `NoPush`. `gossip_delivery_ack` is a signed route command, not mailbox work. Sender receipts `beamio_chat_delivery_receipt_v1` use this wrap so B stores and may SSE-forward without a badge.

Wire samples: [SI developer guide — mailbox work](si-developer-guide.md#3-mailbox-work-envelope-mailbox-b-decrypts).

The key ID is an **intentional OpenPGP side channel**. It exists so that a node can learn *where* to send the next hop without learning *what* the innermost ciphertext says. A peel node still learns the **next** key ID.

```text
S ── user-PGP ciphertext, optional wrap to A ──▶ A
A ── not local: forward same armor
A ── local decrypt + inner key ≠ A: forward inner armor ──▶ B
A earns GB for forwarding, not for reading content
```

### Listen: R → C → B → R

1. R resolves B's route public key.
2. R signs a mailbox listen command and encrypts it to **B's route OpenPGP key**.
3. R opens an HTTP/SSE request to healthy entry C.
4. C forwards the opaque command to B over HTTP on port 80. If the client wrapped the listen command to C’s route key, C peels once and must hop-sign the **inner UTF-8 armor string**. Prefer the peel plaintext when it already contains `BEGIN PGP MESSAGE`. Do **not** pass an OpenPGP.js 6 `Message.armor()` stream / thenable into `Buffer.byteLength`. Hop-sign failure, non-UTF-8 armor, or C→B TCP timeout (~8s) must return a fast **404** and close the client socket. A log-only `uncaughtException` that leaves the SSE open is a protocol bug: the client waits until its ~12s `connect_timeout` while **B is never dialed**. Field lesson: [Peel, hop-sig, and listen timeouts](peel-hop-listen.md).
5. B decrypts the control command, verifies that R belongs to its route, and attaches the SSE response to the appropriate listen pool.
6. B pushes stored and live business ciphertext through C; only R decrypts the business envelope.

```text
R ── route-PGP listen ──▶ C ── HTTP :80 ──▶ B
R ◀──── encrypted business frames over SSE through C ──── B
```

Client-to-entry `/post` may use **HTTP or HTTPS**. Native and censorship-sensitive clients should prefer HTTP so that delivery does not depend on a TLS handshake. Browser pages served over HTTPS may still be forced to HTTPS by mixed-content policy. SI-to-SI forwarding uses HTTP on port 80. An entry's HTTPS certificate failure is therefore not evidence that the forwarding plane is broken, and it is not a reason to require TLS for `/post`.

## Listen namespaces

The SI runtime labels long-lived sessions so that unrelated lifecycle policies do not interfere with one another:

| Use | Command | `listenKind` | Pool |
| --- | --- | --- | --- |
| Chat, Merchant OS, Alliance | `mining` | **`chat`** | Shared liveness pool, labeled chat |
| LayerMinus mining gossip | `mining` | Omitted; defaults to **mining** | Shared liveness pool, labeled mining |
| UDP client | `udp_listen`, or `mining` | `udp` | Separate UDP client pool |
| UDP server | `udp_server_listen`, or `mining` | `udp_server` | Separate UDP server pool |

A completed HTTP request body does not make a receive-only SSE socket stale. SI checks whether the socket remains writable; chat-only timeout or zombie policy must not evict a mining session.

Epoch / listing SSE frames (`{ status, epoch, ipaddress, … }` or `nodeWallets`) prove the listen pipe is alive. They are **not** business delivery. B must **not** treat a healthy writable chat listen as expired solely because `connectedAt` is older than a few seconds. Live SSE is skipped only when the socket is stale or unwritable; the armor is still stored (`saveLocal`). PGP key IDs used to attach a listen and to look up that listen must be compared case-insensitively (uppercase hex).

## Delivery and presence semantics

Layer Minus exposes several milestones. They are not interchangeable:

| Observation | What it proves | What it does not prove |
| --- | --- | --- |
| Entry returns 2xx | The entry accepted the request | B stored it, R decrypted it, or UI displayed it |
| Listen handshake | C reached B and B attached a session | Any business message has been processed |
| Mailbox `gossip_delivery_ack` | The recipient client accepted the identified armor and acknowledged it to B | The sender has seen a receipt |
| Sender delivery receipt | The recipient application reported the message delivered | Human reading or response |

Chat clients send the mailbox acknowledgement and a sender-facing receipt after successful application ingestion. Until acknowledgement, B may retain the encrypted offline copy and use its configured offline-notification policy.

Presence is local to the destination mailbox. A signed `wallet_online_query`, encrypted to B's route key and sent through C, asks whether the target has a non-stale listen session in B's pool. The historical on-chain `routeOnline` field is not current presence truth.

## Guarantees and non-guarantees

When routing and encryption rules are followed:

- A and C cannot decrypt **business** content (user-PGP innermost armor);
- A and C **can** read the OpenPGP key ID on the layer they handle. If the client used an outer envelope, the first-hop observer sees A's key, not R's. After a local decrypt, A still sees the next key ID — that is the routing primitive, not a leak of message text;
- B can decrypt mailbox control and mailbox-work JSON (`NoPush`) but not user-PGP business content;
- B sees an entry connection instead of a direct client connection;
- client `/post` confidentiality does not require HTTPS; and
- a forwarding node is paid in **GB** for relaying ciphertext, which aligns the incentive with delivery rather than inspection.

The design does not hide the client IP from A or C, prevent a global observer from correlating timing and sizes, protect a compromised endpoint, or guarantee availability of an entry or mailbox. Ciphertext key IDs and routing metadata remain visible where forwarding requires them. HTTP `/post` makes the application shape visible to a path observer in exchange for avoiding TLS metadata.

A/B/C are **roles**. Collusion of A+B, C+B, or one operator running all three reconstructs send relationships or binds a wallet to an IP. Distinct Guardian addresses are not an operator-domain proof.

`checkSign` authenticates the signed command string. Mailbox `saveLocal` appends armor and does not consume a nonce. A valid old request can be replayed unless the **application** binds `messageId` / `nonce` / expiry and persists consumed state. See [security limits](security-limits.md).

Direct-to-B requests violate the privacy model even if they function. Other protocol violations include encrypting business data to B's route key, targeting an AA without user PGP material, choosing a non-exact tag result, placing a UDP symmetric key in a route-key command, and putting mailbox instructions (`NoPush` / `beamioNoPush`) on the HTTP JSON instead of inside B-decryptable mailbox work.

## Implementation anchors

- SI key-ID routing, peel-and-forward, and HTTP :80 forward: `src/CoNET-SI/src/util/localNodeCommand.ts` (`getEncryptionKeyIDs`, local decrypt then inner-key forward, `forwardEncryptedSocket`, `BandwidthCount`)
- Mailbox persistence, acknowledgement, presence, and socket health: `src/CoNET-SI/src/util/util.ts`
- Chat listen command and worker-owned SSE loop: `src/SilentPassUI/src/vendor/beamio-chat-sdk/worker/gossip-core.ts`
- Route diagnostic: `scripts/testConetDepinMessage.ts`

## Next

- [How to use Layer Minus](using-l0.md) explains how applications combine this forwarding path.
- [Peel, hop-sig, and listen timeouts](peel-hop-listen.md) is the field lesson for wrap-to-C listen (peel crash, hung SSE, `forward <clientIP>`).
- [SI developer guide](si-developer-guide.md) and [Chat developer guide](chat-developer-guide.md) have TypeScript samples for `/post`, listen, and receipts.
- [Security limits](security-limits.md) covers collusion, replay, and threat grades.
- [Wallet-addressed peer identity](wallet-address-p2p.md) explains the keys used above.
- [HTTP transport and Fetch-and-Close](http-mimicry.md) explains the wire carrier and short-session option.
- [UDP frame forwarding](udp-forward.md) applies the same A/B/C model to encrypted application frames.
- [DePIN Chat](../applications/depin-chat.md) describes the user-facing messaging product.
