# CoNET

CoNET is a **wallet-addressed stack**: a permissionless Layer Minus cloud that forwards OpenPGP ciphertext by wallet / key ID, an EVM **L1** for settlement and identity, and **L2** parallel application ledgers. The same forwarding plane is intended to carry **L1 consensus peering** and **enterprise Web / API hosts** so durable identity is a wallet (and keys), not a stable public `IP:port`.

This book explains the stack from the transport layer upward. It also distinguishes **today’s production join path** from **destination architecture**, so an architectural goal is not mistaken for a production guarantee.

## The stack

| Layer / face | Primary responsibility | Start here |
| --- | --- | --- |
| **L0 — Layer Minus** | Permissionless decentralized cloud: anyone may use it; participants offer CPU / GPU, forward, and storage for **GB**. Forward OpenPGP ciphertext by wallet / key ID. **Trust no node.** | [L0 overview](l0/README.md) · [Permissionless cloud](l0/permissionless-cloud.md) · [How to use L0](l0/using-l0.md) |
| **Web3 Application Protocol** | Application-layer draft: wallet-addressed URI, signed request / response, session, and Origin isolation for hosts published through L0 — **not** an extra L0 wire command | [Web3 Application Protocol](l0/web3-application-protocol.md) |
| **L1 — CoNET Blockchain** | Production EVM (`chainId` **224422**): validator state, Guardian registry, canonical assets, cross-chain Treasury, settlement anchors. **Destination:** consensus gossip over L0 via [conet-l0d](applications/conet-l0d.md) | [L1 overview](l1/README.md) · [Run an L1 node](developers/l1-node.md) · [Vision](developers/l1-node.md#vision-wallet-addressed-consensus-transport) |
| **L2 — CoNET-DLE** | Parallel atomic ledger classes and archive / finality rules for higher-throughput application activity | [L2 overview](l2/README.md) · [DLE explorer](l2/explorer.md) · [L2 development](developers/l2.md) |
| **Applications** | Product compositions: SilentPass, **Beamio whitepaper** (Consumer / Merchant OS / POS / cash rails), Chat, **conet-l0d** (L1 overlay + intended **Web3 Enterprise Gateway**) | [Applications](applications/README.md) · [Beamio](applications/beamio.md) · [conet-l0d](applications/conet-l0d.md) |
| **Developers** | How-to tracks: L0 clients, L1 node, conet-l0d, DePIN mining, Treasury ERC-20 ingress, DLE specifications | [Developers](developers/README.md) · [L0 development](developers/l0.md) · [conet-l0d](developers/conet-l0d.md) |

```text
applications (Chat, SilentPass, Beamio, Enterprise Gateway destination, …)
                 │
                 ▼
       L2: parallel application ledgers (DLE)
          ├─ messaging / control / host traffic ──► L0: wallet-addressed Layer Minus
          │                                              │ carried by
          │                                              ▼
          │                                         TCP/IP + HTTP(S)
          │
          └─ settle / anchor ──────────────────────► L1: CoNET EVM, chainId 224422

       L0 public identity / route bindings ──► selected L1 registries (e.g. AddressPGP)
       L1 consensus peering today ───────────► documented public hubs / P2P ports
       L1 consensus peering destination ─────► conet-l0d overlay + Layer Minus
       Enterprise host publish destination ──► conet-l0d Role B + Application Protocol
```

L0 does not remove IP from the Internet. It moves **application identity and routing** away from IP addresses, encrypts content for its intended recipient, and limits what intermediate nodes need to know.

**Honest maturity:** CoNET L1 still has its own execution and PoS consensus clients (geth / Prysm). Permissionless join **today** documents public hubs and P2P ports. Carrying consensus gossip (and enterprise hosts) over Layer Minus is **destination / under development** — lab-proven for overlay TCP in authorized labs, **not** a claim that every production proposer has abandoned public listen. See [Run an L1 node — Vision](developers/l1-node.md#vision-wallet-addressed-consensus-transport) and [conet-l0d](applications/conet-l0d.md).

## How to read this book

- **Understand the architecture:** begin with the [System overview](overview.md), then read L0 → L1 → L2.
- **Wallet-addressed hosts / Enterprise Gateway:** [Web3 Application Protocol](l0/web3-application-protocol.md) + [Applications — conet-l0d](applications/conet-l0d.md) (Role B = destination).
- **L1 node today vs L0 overlay destination:** [Run an L1 node](developers/l1-node.md) · [conet-l0d](developers/conet-l0d.md).
- **Integrate with a live network:** use [RPC and Explorer](l1/rpc-explorer.md) and [Resources](resources.md). The [DLE explorer](l2/explorer.md) is a separate lab UI, not CoNET L1.
- **Reproduce L1 decentralization facts:** read [Decentralization and verifiability](l1/decentralization.md). Keep Beacon `validator_index`, the VDR stake ledger, and the L0 Guardian registry as three different counts.
- **Build against the live stack:** start at [Developers](developers/README.md) — [L0](developers/l0.md), [L1 node](developers/l1-node.md), [conet-l0d](developers/conet-l0d.md), [mining](developers/l1-mining.md), [ERC-20 Treasury](developers/l1-erc20-bridge.md), [L2 specs](developers/l2.md).
- **Read L0 limits before claiming privacy:** [Security limits and threat grades](l0/security-limits.md).
- **Follow a cross-chain asset:** read the [decentralized Treasury](l1/cross-chain-treasury.md), the separate [DLE admission boundary](l2/cross-chain-assets.md), and the proposed [miner-matched exchange](applications/miner-orderbook-dex.md).
- **Explore emerging economic models:** read [NFT provenance](use-cases/nft-web-of-trust.md), [decentralized SNS](use-cases/decentralized-sns.md), then [long-form creator media](use-cases/decentralized-youtube.md).
- **Beamio product inventory (Consumer, Merchant OS, POS, USDC rails):** [Beamio whitepaper](applications/beamio.md).

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
