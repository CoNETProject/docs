# CoNET

CoNET is a three-layer architecture for **wallet-addressed communication**, an **EVM settlement network**, and **parallel application ledgers**.

This book explains the stack from the transport layer upward. It also distinguishes deployed interfaces from evolving protocol work, so an architectural goal is not mistaken for a production guarantee.

## The stack

| Layer | Primary responsibility | Start here |
| --- | --- | --- |
| **L0 — Layer Minus** | Forward OpenPGP ciphertext by wallet / key ID over the public TCP/IP network. Applications combine those primitives; L0 is not Chat, VPN, or payments. | [L0 overview](l0/README.md) · [How to use L0](l0/using-l0.md) · [SI developer guide](l0/si-developer-guide.md) · [Chat developer guide](l0/chat-developer-guide.md) |
| **L1 — CoNET Blockchain** | Provide the production EVM chain, validator state, Guardian-node state, canonical assets, cross-chain Treasury, and settlement anchors | [L1 overview](l1/README.md) |
| **L2 — CoNET-DLE** | Define parallel atomic ledger classes and archive/finality rules for higher-throughput application activity | [L2 overview](l2/README.md) |

```text
applications and economic designs
                 │
                 ▼
       L2: parallel application ledgers
          ├─ messaging / control ──► L0: wallet-addressed Layer Minus
          │                              │ carried by
          │                              ▼
          │                         TCP/IP + HTTP(S)
          │
          └─ settle / anchor ──────► L1: CoNET EVM, chainId 224422

       L0 public identity / route bindings ──► selected L1 registries
       L1 consensus and peering              independent EL / CL network
```

L0 does not remove IP from the Internet. It moves **application identity and routing** away from IP addresses, encrypts content for its intended recipient, and limits what intermediate nodes need to know. L1 consensus does not run “over L0”: CoNET L1 has its own execution, consensus, and validator networking. L0 uses selected L1 registries for durable identity and route bindings, while the CoNET-DLE design composes L0 communication with L1 settlement and anchoring.

## How to read this book

- **Understand the architecture:** begin with the [System overview](overview.md), then read L0 → L1 → L2.
- **Integrate with a live network:** use [RPC and Explorer](l1/rpc-explorer.md) and [Resources](resources.md).
- **Reproduce L1 decentralization facts:** read [Decentralization and verifiability](l1/decentralization.md).
- **Build on the forwarding plane:** read [How to use Layer Minus](l0/using-l0.md), the [SI developer guide](l0/si-developer-guide.md), the [Chat developer guide](l0/chat-developer-guide.md), then [Applications](applications/README.md).
- **Read L0 limits before claiming privacy:** [Security limits and threat grades](l0/security-limits.md).
- **Follow a cross-chain asset:** read the [decentralized Treasury](l1/cross-chain-treasury.md), the separate [DLE admission boundary](l2/cross-chain-assets.md), and the proposed [miner-matched exchange](applications/miner-orderbook-dex.md).
- **Explore emerging economic models:** read [NFT provenance](use-cases/nft-web-of-trust.md), [decentralized SNS](use-cases/decentralized-sns.md), then [long-form creator media](use-cases/decentralized-youtube.md).

## Status and evidence

The documentation uses five evidence levels:

| Evidence level | Meaning |
| --- | --- |
| **Production reference** | A live chain, endpoint, contract, or public application entry point. |
| **Implemented capability** | Behavior represented by current source code, but not necessarily available in every client or deployment. |
| **Under development** | Active implementation or integration work that should not be treated as generally available. |
| **Normative design** | Behavior controlled by a whitepaper or specification. Deployment status is stated separately. |
| **Design study** | A non-normative application or economic composition that may use implemented and specified components without claiming a shipped product. |

Section-specific wording maps to these levels: **Public application** is a production reference, **Integrated capability** is an implemented capability, and **economic design study** is a design study. A production reference is not, by itself, an audit, uptime guarantee, or claim that every feature is enabled.

The [Resources](resources.md) page lists current endpoints, public repositories, and specification anchors. Historical material imported from `doceng.conet.network` is archived and is not the source of truth for this book.
