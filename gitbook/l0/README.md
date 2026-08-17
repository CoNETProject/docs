# L0 — Layer Minus

**Evidence level: Implemented capability.** CoNET-SI, LayerMinus workers, and current application integrations implement the protocol surfaces identified below. Availability and client coverage remain deployment-specific.

## Developer docs

**Build on Layer Minus:** [L0 development](../developers/l0.md) — SI `POST /post` samples and the Chat module guide.

| Task | Page |
| --- | --- |
| Cloud model and zero-trust composition | [Permissionless cloud and zero-trust applications](permissionless-cloud.md) |
| Client against CoNET-SI | [SI developer guide](si-developer-guide.md) |
| Chat envelopes, listen, receipts | [Chat developer guide](chat-developer-guide.md) |
| Wrap-to-C listen timeouts | [Peel, hop-sig, and listen timeouts](peel-hop-listen.md) |
| All developer tracks (L0 / L1 mining / ERC-20 / L2) | [Developers](../developers/README.md) |

Layer Minus is a **permissionless, decentralized cloud** and, on the wire, CoNET's **PGP / wallet-address forwarding network**. Anyone may use it. Participants may join by offering **CPU / GPU compute**, **network forward**, and **storage**, and earn **GB** for useful ciphertext work. It runs **above the existing TCP/IP Internet**; it does not replace IP routing or define a new physical network.

Its job is to move ciphertext from an entry to the mailbox (or egress) named by a recipient OpenPGP key, while keeping a peer's durable identity as a **wallet**, not as the IP used for one connection. **Any one node may be malicious.** Developers therefore compose **privacy routing + data fragmentation + client cryptography** so that no node is trusted with plaintext or a reconstructable whole. That is how privacy-first **communications, storage, compute, and decentralized AI** are built. Thesis: [Permissionless cloud and zero-trust applications](permissionless-cloud.md).

How to use L0 is **application-layer development**. Chat, SilentPass, mining gossip, UDP frames, and Beamio control messages are **combinations** of the same forwarding primitives. They are not extra L0 protocols. Start with [How to use Layer Minus](using-l0.md), then the [L0 development](../developers/l0.md) track.

## What it is

A Layer Minus identity combines:

- an **EOA wallet address** for ownership and signatures;
- a **user OpenPGP key** for business-message encryption; and
- a **route OpenPGP key** that identifies the mailbox node selected for that wallet.

The bindings are published through **AddressPGP on CoNET L1**. Clients send signed, **already-encrypted** OpenPGP envelopes to a healthy entry node over **HTTP or HTTPS**. A node reads the OpenPGP recipient **key ID** (an intentional packet side channel). If the key is not local, it forwards the same armor and appends an SI hop signature (`X-CoNET-Hop-Sigs`, cap **3**). If the key **is** local, it decrypts **once**; when the plaintext is still OpenPGP and the inner key ID is not this node, it forwards the **inner** armor. Same-node inner PGP, or more than three hop signatures, ends the socket as an attack. The node still does not read user-PGP **business** plaintext. The last hop meters verified prior-hop bytes against the user wallet for **GB**.

## Protocol at a glance

```text
Business delivery

Sender S
  └─ encrypt to recipient R's user PGP
     └─ optional outer wrap to A (or a hop chain)
        └─ HTTP POST /post to entry A  (HTTPS optional)
           └─ A reads key ID
              ├─ not local → HTTP :80 forward same armor to B
              └─ local decrypt → inner key ID not local → forward inner
                 └─ A meters bytes for GB reward

Mailbox listen

Recipient R
  └─ encrypt listen command to B's route PGP
     └─ HTTP/SSE to entry C
        └─ HTTP :80 forward to mailbox B
           └─ stored and live ciphertext back to R
```

For the privacy-preserving path, **A is not B and C is not B**. Client `/post` may use HTTP or HTTPS; **HTTP is sufficient** because the body is OpenPGP ciphertext, and it is the intended path where a TLS handshake would be classified or blocked. Browser pages served over HTTPS may still be forced to HTTPS by mixed-content policy. SI-to-SI forwarding uses HTTP on port 80.

## Core invariants

| Concern | Protocol rule |
| --- | --- |
| Network identity | Wallet address plus registered OpenPGP material, not a public IP |
| HTTP `/post` body | **Only** `{ "data": "<OpenPGP armor>" }`. No sibling fields (`NoPush`, `beamioNoPush`, flags). |
| Business encryption | Encrypt to the recipient's **user PGP**. TLS is not required for that confidentiality. |
| Mailbox work | Delivery instructions such as `NoPush` live in JSON encrypted to **B’s route PGP**, wrapping inner user-PGP armor. Only B sees them. |
| Routing metadata | Nodes read the OpenPGP **encryption key ID**. Non-local → forward. Local decrypt + inner PGP for another key → forward the inner armor. |
| Forwarding incentive | Relayed ciphertext is metered; the forwarding node is compensated in **GB** |
| Mailbox control | Encrypt listen, presence, acknowledgement, and UDP relay commands to **B's route PGP** |
| Send path | `S → entry A → mailbox B` |
| Listen path | `R → entry C → mailbox B → R` |
| Chat listen | `command: "mining"` with `listenKind: "chat"` |
| Mining listen | Direct infrastructure SSE to the target SI with `command: "mining"` and `listenKind` omitted; SI defaults it to mining |
| Nested peel / hop-sign | After a local decrypt, hop-sign the **inner UTF-8 armor string**. Hop-sign or next-hop connect failure is a **fast 404**, not a hung SSE. Field lesson: [Peel, hop-sig, and listen timeouts](peel-hop-listen.md) |
| Delivery evidence | Entry acceptance or an SSE handshake is transport progress, **not** proof that the application processed the message |
| UDP key exchange | Encrypt `udp_subscribe` to the UDP server's **user PGP**; never expose its symmetric key to mailbox B |

The A/B/C rule governs application mailbox delivery and control traffic. A LayerMinus mining collector intentionally dials each target SI directly to receive that node's signed gossip. This infrastructure exception is not an approved shortcut for Chat, presence, delivery ACKs, or UDP sessions.

## Why it matters

IP addresses remain necessary for packet delivery, but they are poor long-term application identities: they expose network location, change across networks, and are easy to filter. Layer Minus keeps those transient locators in the underlay while applications resolve and authenticate wallets.

This design is a shared forwarding plane. Applications combine it into Chat, typed Beamio control messages, mining gossip, presence queries, delivery acknowledgements, encrypted UDP-shaped frames, and SilentPass egress. Product-specific proxy traffic may also use short **Fetch-and-Close** sessions. L0 does not implement those products; it forwards the envelopes they create.

## Guarantees and limits

When clients follow the A/B/C route and cryptographic keys remain secure:

- entries and mailboxes do not receive business plaintext;
- the mailbox sees an entry as its network peer rather than a direct client connection; and
- changing an entry or mailbox does not change the wallet identity. An application may also keep a **routing wallet** (AddressPGP + listen) separate from sender / recipient wallets inside the encrypted envelope.

Layer Minus does **not** promise anonymity against a global observer, hide the client IP from the selected entry, make traffic-analysis metadata disappear, or guarantee delivery after an entry returns HTTP 200. It also does not make every HTTP-shaped flow indistinguishable from ordinary browsing. Fetch-and-Close is a short-session mode, not a mix network. Chat SSE is a traffic fingerprint. Long-term user OpenPGP is not forward-secret. A/B/C names roles, not independent operators. See [security limits and threat grades](security-limits.md).

The mailbox, Chat listen, offline ciphertext store, acknowledgements, presence query, mining listen classification, and UDP relay are implemented in CoNET-SI. Application coverage and user-facing reliability still depend on the client, healthy entry selection, key management, and acknowledgement behavior.

## Implementation anchors

| Component | Responsibility |
| --- | --- |
| **AddressPGP** | L1 user-key and route-key bindings |
| **CoNET-SI** | Native HTTP/HTTPS entry, SI-to-SI forwarding, mailbox storage, SSE pools, presence, acknowledgements, and UDP relay |
| **Beamio Chat SDK** | User-PGP message encryption and `listenKind: "chat"` mailbox listening through entry C |
| **CoNET-DL / LayerMinus workers** | Mining listens, signed gossip verification, and optional reporting to the accounting plane |

## Next

1. [Permissionless cloud and zero-trust applications](permissionless-cloud.md) — who may join, what is rewarded, and why no node is trusted.
2. [L0 development](../developers/l0.md) — SI `/post` samples and the Chat module guide.
3. [How to use Layer Minus](using-l0.md) — forwarding primitives and how applications combine them.
4. [The TCP/IP substrate](tcp-ip.md) — prerequisite, not a competing protocol.
5. [The IP-address privacy problem](tcp-ip-privacy.md) — the threat model and its limits.
6. [Wallet-addressed peer identity](wallet-address-p2p.md) — AddressPGP and key roles.
7. [Zero-trust mailbox routing](mailbox-routing.md) — the normative A/B/C delivery path.
8. [Peel, hop-sig, and listen timeouts](peel-hop-listen.md) — wrap-to-C listen field lesson.
9. [HTTP transport and Fetch-and-Close](http-mimicry.md) — wire shape and short-session mode.
10. [UDP frame forwarding](udp-forward.md) — one composition: symmetric payload relay without giving the key to B.
11. [Security limits and threat grades](security-limits.md) — what the live plane does and does not protect.
12. [Node and client roles](node-roles.md) — runtime responsibilities and boundaries.

User-facing products are documented under [Applications](../applications/README.md), including [SilentPass](../applications/silentpass-vpn.md), [Beamio](../applications/beamio.md), and [DePIN Chat](../applications/depin-chat.md).
