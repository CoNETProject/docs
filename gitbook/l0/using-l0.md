# How to use Layer Minus

**Evidence level: Implemented capability.** CoNET-SI implements the forwarding plane described here. Chat, SilentPass, mining, UDP, and Beamio control flows are **application compositions** of that plane. They are not additional L0 protocols.

Layer Minus is a **permissionless decentralized cloud** whose live wire is a **PGP / wallet-address forwarding network**. Anyone may use it. Participants offer **forward bandwidth**, **storage**, and **CPU / GPU compute** and are rewarded in **GB** for useful ciphertext work. It accepts an OpenPGP envelope, reads the recipient **key ID**, and either forwards that armor or — if this node can decrypt — peels an inner OpenPGP layer and forwards when the inner key ID is not local. It does not define a product, a message schema, a VPN, or a payment flow.

**Do not trust any node.** A Layer Minus host may drop, log, or lie. Privacy-first apps combine **privacy routing**, **data fragmentation**, and other client cryptography so that communications, storage, compute, and decentralized AI never hand a reconstructable secret to one operator. See [Permissionless cloud and zero-trust applications](permissionless-cloud.md).

How to use L0 is therefore **application-layer development**: pick wallets, pick encryption targets, put an application object inside the envelope, and combine the forwarding primitives that already exist.

## What L0 is

A Layer Minus node does the following:

1. Accept `POST` with **only** `{ data: <OpenPGP armor> }` over HTTP (HTTPS optional). The client **must not** send `X-CoNET-Hop-Sigs` or sibling JSON fields (`NoPush`, `beamioNoPush`, flags). Mailbox instructions belong inside armor encrypted to **B’s route PGP**.
2. Read `getEncryptionKeyIDs()` from the OpenPGP **side channel**.
3. If that key ID is **not a routable node / mailbox**, respond **404**.
4. If that key ID **is not** this node's route PGP but **is** routable, miner-sign the **same armor** and forward it to its mailbox over HTTP `:80` (`X-CoNET-Hop-Sigs`, cap **3**). If the destination SI emits socket `end`, close and free this hop.
5. If the key ID **is** this node's route PGP, **decrypt once**. Then:
   - if the plaintext is still OpenPGP armor and the inner side-channel key ID **is this node**, treat it as an attack: emit socket `end` and stop;
   - if the inner key ID **is not** this node, check SI-to-SI hop signatures. More than **3** signatures, or a count that cannot take another hop, is an all-node flood: emit `end` and **discard**;
   - otherwise forward the **inner** armor and append this node's miner hop signature;
   - if this node is the mailbox, store the armor and, when a listen SSE is attached, encrypt the downlink with the user’s listen `Securitykey`;
   - if the plaintext is mailbox-work JSON `{ data, NoPush? }` (not a signed `{ message, signMessage }`), unwrap the inner armor and deliver it locally; `NoPush: true` skips APNs / offline badge;
   - if the plaintext is signed JSON `{ message, signMessage }`, the last hop verifies hop signatures, meters those prior-hop bytes against the **user** wallet for **GB**, and runs the API command (listen, proxy, storage, WASM / container, and so on).

Byte-level header rules: [X-CoNET-Hop-Sigs v1](hop-sigs.md). The header is miner signatures for **GB metering**. It is not a detailed forward JSON.

That peel-and-forward step is the **outer envelope** and **nested multi-hop** primitive. A node decrypts **at most one** local layer. An application may wrap a user-PGP business message to an entry (or to a short hop chain). A path observer of the first `/post` then sees the **outer** key ID, not the inner recipient. Each node that can decrypt still learns the **next** key ID. Extra hops are extra forwarded bytes and therefore extra **GB**. When a destination SI ends the socket, the previous hop closes and frees that connection.

Forwarded bytes are metered for **GB**. That is the incentive for carrying ciphertext, not for reading it.

```text
Any application
  │  choose wallets and keys
  │  choose encrypt-to-user-PGP or encrypt-to-route-PGP
  │  put application JSON (or AES frames) inside
  ▼
L0 forwarding plane
  POST armor (no hop header) → read key ID
    ├─ not a routable node → 404
    ├─ not local → HTTP :80 forward same armor + miner hop signature
    └─ local decrypt once → same-node inner PGP → end (attack)
                          → inner key ≠ local and hop sigs < 3 → forward inner
                          → mailbox → store / SSE (SSE encrypted with listen Securitykey)
                          → mailbox-work JSON { data, NoPush? } → unwrap inner armor; NoPush skips APNs
                          → else run signed JSON command; last hop meters prior hops to the user
```

L0 names a peer as **wallet + OpenPGP material**. IP addresses remain TCP/IP locators for one hop. Changing entry, mailbox, or device does not change the wallet unless the **application** creates a new one.

## What L0 is not

| Not an L0 duty | Who owns it |
| --- | --- |
| Chat bubbles, unread counts, history, POS Staff queues | Application + optional L1 registries |
| VPN / SOCKS capture, path rotation, admission UX | SilentPass and related clients |
| TUN / iptables / geth–beacon overlay catch | `conet-l0d` — [Applications](../applications/conet-l0d.md) · [Developers](../developers/conet-l0d.md) |
| Mining epoch accounting and miner totals | LayerMinus / CoNET-DL |
| AES session keys, UDP adapters, game or media codecs | The UDP or media application |
| Payments, cards, Treasury, AA policy | L1 contracts and application APIs |
| Size padding or timing jitter | **Not implemented** in current SI |

Do not treat [DePIN Chat](../applications/depin-chat.md), [SilentPass](../applications/silentpass-vpn.md), or [conet-l0d](../applications/conet-l0d.md) as “the L0 protocol.” They are combinations of the same forwarding network. SilentPass is **egress** to a public `host:port`. `conet-l0d` is an **L1 overlay catch** (Under development). Do not use one as the other.

## Application developer loop

Every L0-using client repeats the same loop. Only the inner object and the encryption target change. Copy-paste TypeScript for `POST /post` and the command catalog is in the [SI developer guide](si-developer-guide.md). Chat envelopes, listen, receipts, and presence are in the [Chat developer guide](chat-developer-guide.md). The developer-track index is [L0 development](../developers/l0.md).

### 1. Create wallets (routing can be separate)

The protocol identity of a **mailbox row** is an **EOA**. Generate one, or reuse an existing wallet. An AA Smart Wallet is not a destination unless it has its own AddressPGP registration.

For higher privacy, **do not reuse the same EOA** for routing and for the people in the product:

| EOA | Register / sign | Purpose |
| --- | --- | --- |
| **Routing wallet** | AddressPGP + listen / ACK / presence | Mailbox B, hop **GB**, online query |
| **Sender / recipient wallet** | Encrypted application envelope only | Chat `from`, payments, POS, display |

SI routes the **inbox user PGP** registered on the routing wallet. The product can name a different sender or recipient EOA inside that ciphertext. Details: [Routing wallet versus sender / recipient wallets](wallet-address-p2p.md#routing-wallet-versus-sender--recipient-wallets).

If a wallet or key is later exposed, the application can create an **on-demand new wallet**, generate a new user PGP pair, and register again. L0 has no “account recovery” of its own; it just starts forwarding to the new key ID. Rotating only the routing wallet does not require a new product identity.

### 2. Register public bindings on L1

Publish, for that EOA:

- user OpenPGP public key (business-message recipient);
- encryption subkey ID used on envelopes;
- selected mailbox **route key ID**.

Current clients use the compatibility API `regiestChatRoute`, then resolve peers with `searchKey(walletAddress)`. Human-readable tags are an application lookup aid. Prefix-search `results[0]` is not a protocol identity.

### 3. Choose the encryption target

This is the only cryptographic decision L0 requires the application to get right.

| Encrypt to | L0 behavior | Typical application use |
| --- | --- | --- |
| **Recipient user PGP** | Entry and mailbox **forward and store** the armor. They cannot read it. | Chat text, typed business JSON, UDP `udp_subscribe` and duplex `duplex_offer` (each contains an AES key). Sender receipts use this as the **inner** armor, then wrap as mailbox work. |
| **Entry or hop-node route PGP** (outer wrap) | That node **decrypts once**. If the inner key ID is not local and hop signatures are within the cap of **3**, it **forwards the inner armor**. Same-node inner PGP is an attack. | Hide the inner recipient key ID from the first-hop path observer; short hop chains only |
| **Mailbox B route PGP** (signed command) | B **decrypts** and runs a command. | Listen, `wallet_online_query`, `gossip_delivery_ack`, UDP listen / relay / uplink |
| **Mailbox B route PGP** (mailbox work) | B **decrypts** `{ data, NoPush? }`, stores the inner user-PGP armor, and may skip APNs. HTTP stays `{ data }` only. | Sender `beamio_chat_delivery_receipt_v1` with `NoPush: true`. Missing B’s key is a failure — no HTTP-field fallback. |
| **Egress / node route PGP** | The selected SI decrypts and opens an origin connection. | SilentPass / `SaaS_Sock5` / `SaaS_Sock5_v2` |

Wrong target breaks the model: business JSON encrypted to B lets the mailbox read it; a listen command encrypted to the user key never reaches B.

### 4. Post through a healthy entry

Sign the inner object with the EOA (`{ message, signMessage }`), OpenPGP-encrypt it, and `POST` `{ data: armor }` to a healthy entry **A ≠ B**.

HTTP is sufficient for **payload** confidentiality because the body is already ciphertext. HTTPS is optional at the same handler and is the usual browser / payment carrier. Neither is “more private” in every dimension — [HTTP versus HTTPS](security-limits.md#http-versus-https-neither-is-more-private). SI-to-SI forwarding is HTTP on port 80.

The POST hides the **sender** from the mailbox: B sees an entry hop and a recipient key ID, not S's client IP.

A one-layer post (encrypt only to R's user PGP) does **not** hide R's key ID from A or from a plaintext-HTTP path observer. An **outer envelope** (encrypt that armor to A's route PGP, or to a short chain of node keys) hides the inner key ID from the first-hop observer. After A decrypts **once**, SI forwards if the inner side channel is not local and hop signatures stay at or below **3**. Same-node inner PGP is an attack. A still learns the next key ID. That is routing, not business plaintext.

### 5. Listen only if the application needs inbound data

Listening is another composition, not a default L0 session.

Encrypt a listen command to **B's route PGP** and open HTTP/SSE through a healthy entry **C ≠ B**. Label the session so SI can keep pools apart:

| Application | Command | `listenKind` |
| --- | --- | --- |
| Chat / Merchant OS / Alliance mailbox | `mining` | **`chat`** |
| LayerMinus mining gossip | `mining` | omit (SI defaults to mining) |
| UDP client / server | `udp_listen` / `udp_server_listen`, or `mining` | `udp` / `udp_server` |

Duplex overlay does **not** add a SI listen row. App-layer host listen **is** Chat (`mining` + `listenKind: "chat"`).

Entry acceptance or an SSE handshake is transport progress. The application still decrypts, verifies, and decides what the payload means.

### 6. Put the product protocol inside the envelope

L0 does not parse application JSON. The client defines:

- the inner schema (`type`, `sendId`, amounts, hosts, frames);
- whether a message is shown, queued, or discarded;
- acknowledgements, retries, and wallet rotation;
- optional extra encryption before the L0 envelope.

Three privacy elements exist: **sender**, **recipient**, and **content**. L0 can hide content from intermediate nodes and hide the sender's direct IP from the mailbox. Who counts as sender or recipient, whether those wallets rotate, and what the content means are application choices.

## Combinations that already exist

The same forwarding plane is reused. Only the inner object and key roles change.

| Composition | L0 primitives | Application-owned layer |
| --- | --- | --- |
| **DePIN Chat** | User-PGP POST, `listenKind: "chat"`, `gossip_delivery_ack`, `wallet_online_query`, mailbox-work wrap for sender receipts (`NoPush`) | Envelope JSON, Messages UI, encrypted history / `ChatIndexRegistry` |
| **POS terminal permission** | Same Chat delivery path | Typed `beamio_pos_terminal_permission_v1`; Staff pending, not Messages |
| **Mining gossip** | `command: "mining"` listen (infrastructure may dial the target SI) | Signed epoch frames, miner accounting |
| **UDP frames** | User-PGP `udp_subscribe`; route-PGP listen / relay / uplink | AES-256-GCM session, adapters, codecs |
| **Duplex overlay** | Offer to long-lived user PGP; accept / reject / AES `duplex_frame` to the **session listen** user PGP; two owned Chat SSEs. No SI `duplex_*`. `duplex_reject` or missing accept keeps P1 gossip | AES-256-GCM of `L0D1` IPv4. Spec: [Duplex overlay](duplex-forward.md) |
| **SilentPass access** | Route-PGP `SilentPass` / `SaaS_Sock5` / `SaaS_Sock5_v2` through an entry | Device tunnel or local proxy, admission, path rotation |
| **On-demand new wallet** | New EOA + new user PGP + new AddressPGP row | Application identity rotation after a leak or for a new role |
| **Split routing / app wallets** | AddressPGP + listen on a **routing** EOA; sender / recipient only inside user-PGP | Mailbox and hop GB do not see the product wallet. Mapping stays in the client |
| **Fragmented storage / compute / AI** | Same forwarding plane + hash-addressed ciphertext fragments + untrusted WASM / GPU jobs | Privacy-first surfaces. No node holds a reconstructable whole. See [permissionless cloud](permissionless-cloud.md) |
| **Outer envelope / nested PGP hops** | Encrypt to a node that can decrypt once; if the inner key ID is not local and hop signatures stay under **3**, SI miner-signs and forwards the **inner UTF-8 armor string** (prefer peel plaintext; do not pass `Message.armor()` into `Buffer.byteLength`). Hop-sign, non-UTF-8 armor, or next-hop connect failure is a fast **404** — not a hung SSE | Hides the inner recipient key ID from the first-hop path observer; last hop meters prior hops to the user; same-node inner PGP or a hop that never reaches a recipient is discarded. Encoding: [hop-sigs v1](hop-sigs.md). Field lesson: [Peel, hop-sig, and listen timeouts](peel-hop-listen.md) |

A new product should start from this table: reuse the forwarding primitives, then invent only the inner protocol it actually needs.

## Combinations that are not in current SI

These are valid **application designs** on top of a forwarding network. They are **not** present as automatic SI policy (`postOpenpgpRouteSocket` already peels a local-decryptable outer PGP layer and forwards a non-local inner layer).

| Proposed composition | Intended extra property | Current status |
| --- | --- | --- |
| Padding or timing jitter | Weaker size / timing correlation | Not implemented |
| Privacy poll receive mode | Weaker Chat online / arrival-time fingerprint than SSE | Not implemented |
| Double Ratchet / MLS after AddressPGP handshake | Forward secrecy and post-compromise security for Chat | Not implemented |
| Operator-domain entry/mailbox exclusion | A/B/C as independent operators, not only roles | Not implemented on L0 |
| L1 overlay TCP byte-stream (`conet-l0d`) | Catch overlay `100.64.0.0/10` and carry geth / beacon TCP | **Application duplex** on Chat gossip ([duplex-forward](duplex-forward.md)). Crate uses AES frames when the peer app sends `duplex_accept`; **P1 gossip** remains the fallback. `[l0]` default off; authorized lab may enable it. 2026-08-18 lab: overlay geth + beacon TCP; follow-the-chain Prysm-bound; lab discv5 via L0 accepted (not a production product). HTTP 200 ≠ delivery. Keep public P2P for the 6s slot. Do **not** treat SI `duplex_*` / `p2p_stream_*` / `listenKind: "l1p2p"` as current SI |

Document those as upgrades or product options. Do not describe them as the live L0 plane. See [security limits](security-limits.md).

## Implementation anchors

| Piece | Public source |
| --- | --- |
| HTTP/HTTPS entry and `{ data }` POST | [CoNET-SI `server.ts`](https://github.com/CoNET-project/CoNET-SI/blob/main/src/endpoint/server.ts) |
| Key-ID route, decrypt-once, hop signatures, command switch | [CoNET-SI `localNodeCommand.ts`](https://github.com/CoNET-project/CoNET-SI/blob/main/src/util/localNodeCommand.ts) (`postOpenpgpRouteSocket`, `localNodeCommandSocket`) and [`siHopSigs.ts`](https://github.com/CoNET-project/CoNET-SI/blob/main/src/util/siHopSigs.ts) |
| AddressPGP bindings | [`0x684b0ac760cEE9c9b85de36d69746420648Cf9e2`](https://mainnet.conet.network/address/0x684b0ac760cEE9c9b85de36d69746420648Cf9e2) |
| Chat composition | [chat-sdk](https://github.com/CoNET-project/chat-sdk) |
| SilentPass composition | [SilentPass-iOS](https://github.com/CoNET-project/SilentPass-iOS) and SI `SilentPass` / `SaaS_Sock5*` commands |

## Next

1. [L0 development](../developers/l0.md) — developer-track index for SI and Chat.
2. [SI developer guide](si-developer-guide.md) — live `/post` contract, command catalog, and samples.
3. [Chat developer guide](chat-developer-guide.md) — Chat envelopes, listen, receipts, and presence.
4. [Wallet-addressed peer identity](wallet-address-p2p.md) — EOA, user PGP, route PGP.
5. [Zero-trust mailbox routing](mailbox-routing.md) — `S → A → B` and `R → C → B → R`.
6. [X-CoNET-Hop-Sigs v1](hop-sigs.md) — compact miner hop header (not a path JSON).
7. [Peel, hop-sig, and listen timeouts](peel-hop-listen.md) — wrap-to-C listen field lesson.
8. [UDP frame forwarding](udp-forward.md) — one composition that adds a symmetric key.
9. [Duplex overlay](duplex-forward.md) — application AES on Chat gossip; SI does not implement duplex commands.
10. [Security limits](security-limits.md) — live threat grades versus proposed upgrades.
11. [Applications](../applications/README.md) — products that combine L0 with L1 and UI.
12. [L1 overlay daemon](../applications/conet-l0d.md) · [Developers — conet-l0d](../developers/conet-l0d.md) — optional geth/beacon overlay (Under development).
