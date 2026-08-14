# Permissionless cloud and zero-trust applications

**Evidence level: mixed.** The forwarding plane, hop **GB** metering, mailbox ciphertext store, and fragment APIs are live. Storage, WASM / container, and GPU work that a given node actually offers is deployment-specific. Decentralized AI is an **application composition**, not a shipped L0 product.

Layer Minus is a **permissionless, decentralized cloud**. Anyone may use it. Anyone may join by offering resources. Developers build **privacy-first** applications on top of it. They must assume that **any one node can be malicious**.

## What the cloud is

Layer Minus is not a licensed SaaS and not a single operator’s data center. It is a shared infrastructure of independent CoNET-SI nodes on the public Internet. Participants contribute one or more of:

| Resource | What the node does | Why it is paid |
| --- | --- | --- |
| **Network forward** | Carry OpenPGP armor toward a mailbox or next hop | Metered forwarded bytes → **GB** |
| **Storage** | Hold ciphertext fragments, mailbox offline armor, or sealed indexes | Useful retention and retrieval, not custody of plaintext |
| **CPU / GPU compute** | Run a signed job (storage command, WASM / container, inference helper) | Work the client can **verify** without trusting the host |

The reward asset for DePIN service is **GB** (`GBToken` on CoNET L1). Forwarding is the live, byte-metered path. Storage and compute settlement follow the same rule: pay for **useful ciphertext work**, never for reading user plaintext.

**Use of the plane is permissionless.** A developer does not apply to CoNET to send Chat, store fragments, or schedule a job. A user does not need an account issued by a node operator.

**The public Guardian roster is a discovery set, not a license.** `GuardianNodesInfoV6.getAllNodes` is what current clients use to find domains and route keys. Adding a row with `addNode` today requires `adminList`. That is an L1 admission fact for the *listed* set. It does not make Layer Minus a permissioned application platform, and it does not make a listed node trusted. See [Guardian nodes](../l1/guardian-staking.md) and [Participate in mining](../developers/l1-mining.md).

## Zero trust: any node may be malicious

Treat every Layer Minus node as an untrusted host:

- it may drop, delay, or replay traffic;
- it may log client IPs, sizes, and times;
- it may lie about storage or compute results;
- it may collude with other nodes.

L0 therefore **must not** require any node to see business plaintext. A/B/C roles, user-PGP encryption, and hop-sig metering are the live forwarding expression of that rule. They are not a promise that a node is honest.

```text
Do not trust a node with
  ├─ message text, files, or model inputs in the clear
  ├─ a reconstructable whole object
  ├─ the only copy of a secret
  └─ an unverified compute result

Trust only
  ├─ keys the client holds
  ├─ ciphertext the client can re-encrypt or re-split
  └─ results the client can verify or recompute
```

Collusion of A+B or C+B still binds a wallet to an IP. Distinct Guardian addresses are not an operator-domain proof. See [security limits](security-limits.md).

## How developers compose a privacy-first application

A privacy-first app is **not** “pick one honest node.” It is a **combination** of techniques so that a single malicious node cannot read, reconstruct, or silently rewrite the user’s work.

| Technique | What it does | Live anchors |
| --- | --- | --- |
| **Privacy routing** | Sender and listener do not dial mailbox B. Nested PGP can hide the inner key ID from the first hop. Routing and product wallets may be different EOAs. | [Mailbox routing](mailbox-routing.md), [hop-sigs](hop-sigs.md), [split wallets](wallet-address-p2p.md#routing-wallet-versus-sender--recipient-wallets) |
| **Data fragmentation** | Split ciphertext so no node holds a reconstructable whole. Store fragments by hash. Keep the assembly index encrypted to keys the client (or authorized set) controls. | IPFS `storageFragment` / `getFragment`; Chat history index; copyright / DCDN designs |
| **Client-side cryptography** | Encrypt to the recipient **user PGP** (or a session key that B never sees). Sign application objects. Verify compute outputs. | [How to use L0](using-l0.md), [SI developer guide](si-developer-guide.md) |
| **Other application policy** | Split routing / payment identities, consumed nonces, sealed indexes, multi-node reconstruction, challenge windows | Application-owned. Not an L0 header field |

```text
Privacy-first application
  ├─ privacy routing     (A ≠ B, C ≠ B, optional outer wrap, optional routing wallet)
  ├─ fragmentation       (no single node has the whole object)
  └─ other client crypto (encrypt, sign, verify)
        │
        ▼
Layer Minus nodes  (forward / store / compute — all untrusted)
        │
        ▼
Privacy-first surfaces
  communications · storage · compute · decentralized AI
```

## Application surfaces

These are **what developers build**. They are not extra L0 protocols.

| Surface | Composition | Do not |
| --- | --- | --- |
| **Communications** | User-PGP Chat, typed control messages, UDP frames, SilentPass egress | Give mailbox B business plaintext or a UDP `Securitykey` |
| **Storage** | Encrypted fragments + sealed index; mailbox only stores armor it cannot read | Put a reconstructable file on one node in the clear |
| **Compute** | Send a sealed job to one or more nodes (WASM / container / GPU). Verify the result or use redundancy | Treat the host’s stdout as truth |
| **Decentralized AI** | Private prompts and weights as fragments; inference as untrusted compute; results returned encrypted to the user | Upload a model or prompt in the clear to “the AI node” |

Chat, SilentPass, fragment history, and hop **GB** are the current production building blocks. Bulk DCDN, copyright delivery, and a general GPU / AI marketplace remain **application designs** on the same zero-trust cloud. Document them as compositions, not as automatic SI policy.

## What this page does not claim

- A listed Guardian is honest.
- Running an unlisted SI automatically appears in `getAllNodes`.
- Every node offers GPU or WASM.
- Fragmentation by itself is anonymity.
- Decentralized AI is a live CoNET product name.

## Next

- [How to use Layer Minus](using-l0.md) — forwarding primitives and combinations
- [L0 development](../developers/l0.md) — client how-to
- [Zero-trust mailbox routing](mailbox-routing.md) — A/B/C path
- [Security limits](security-limits.md) — what the live plane does not protect
