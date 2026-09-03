# CoNET

## From infrastructure to applications

CoNET is a wallet-addressed infrastructure stack. Three infrastructure
layers supply cloud resources, shared state, and specialized ledgers.
**Layer Minus** uses the L0 cloud to route OpenPGP-encrypted application
traffic by wallet-linked identity. Application protocols and products then
combine only the capabilities they need.

| Plane | Responsibility | Start here |
|---|---|---|
| **L0 — Decentralized Cloud** | Permissionless forwarding, ciphertext storage, service hosting, contributed CPU/GPU capacity, and GB metering | [L0 overview](l0/README.md) |
| **Layer Minus — Privacy Protocol** | Wallet/OpenPGP-addressed routing, zero-trust entry and mailbox roles, and HTTP(S)-shaped encrypted transport on L0 | [Layer Minus](l0/layer-minus.md) · [How to use it](l0/using-l0.md) |
| **L1 — CoNET Blockchain** | EVM state, identity registries, validators, canonical assets, Treasury, and settlement (`chainId` **224422**) | [L1 overview](l1/README.md) · [Run an L1 node](developers/l1-node.md) |
| **L2 — CoNET-DLE** | Specialized parallel application-ledger classes with explicit archive, finality, availability, and settlement rules | [L2 overview](l2/README.md) · [DLE explorer](l2/explorer.md) |

```text
L0 cloud resources
        │
        ▼
Layer Minus privacy routing ───────┐
                                   │
L1 shared state and settlement ────┼──► application protocols ───► applications
                                   │
DLE L2 specialized ledgers ────────┘
```

This is a dependency map, not a mandatory pipeline. [SilentPass](applications/silentpass-vpn.md)
focuses on privacy-oriented Internet access, [CoNET Chat](applications/depin-chat.md)
on relationship-private wallet communication, and [Beamio](applications/beamio.md)
on consumer, merchant, and POS workflows.

## Wallet-addressed applications

[`web3://`](applications/web3-url.md) is an **application protocol using Layer
Minus on L0 infrastructure**. It defines wallet-addressed locators, exact
identity resolution, caller-signed requests, correlated encrypted responses,
persistent application streams, and client security rules without adding
another L0 wire command.

Linux servers and clients can use the
[`conet-l0d` runtime](developers/conet-l0d.md). Windows, macOS, Android, iOS,
and browser applications implement the same `web3://` contract in browser or
native client code. See the [protocol contract](l0/web3-application-protocol.md)
for interoperable URI and envelope rules.

## Privacy boundary

Layer Minus does not remove TCP/IP from the Internet and does not promise
absolute anonymity. OpenPGP protects application plaintext, while role
separation reduces the need for one intermediary to observe both endpoints.
An entry can still observe the connecting client, a mailbox can observe route
activity, and traffic timing and size remain metadata. Ordinary HTTP-shaped
transport can reduce dependence on a distinctive custom carrier or TLS
handshake, but it is not guaranteed to be indistinguishable from all Web
traffic.

## How to read this book

- Architecture: [System overview](overview.md), then
  [L0](l0/README.md) → [Layer Minus](l0/layer-minus.md) →
  [L1](l1/README.md) → [L2](l2/README.md).
- Application protocol: [`web3://`](applications/web3-url.md) →
  [protocol contract](l0/web3-application-protocol.md) →
  [Linux runtime](developers/conet-l0d.md).
- Products: [Applications](applications/README.md).
- L0 and Layer Minus implementation: [L0 development](developers/l0.md),
  [SI developer guide](l0/si-developer-guide.md), and
  [security limits](l0/security-limits.md).
- L1 operations: [Run an L1 node](developers/l1-node.md),
  [RPC and Explorer](l1/rpc-explorer.md), and
  [decentralization evidence](l1/decentralization.md).
- Current endpoints, repositories, and evidence: [Resources](resources.md).

## Status and evidence

| Evidence level | Meaning |
|---|---|
| **Production reference** | Live chain, endpoint, contract, or public application entry |
| **Implemented capability** | Present in source, but not necessarily enabled in every deployment |
| **Under development** | Active implementation or integration work |
| **Normative design** | Controlled by a specification; deployment status is separate |
| **Design study** | Non-normative application or economic proposal |

A production reference is not by itself an audit, uptime guarantee, or claim
that every feature is enabled. Historical imported documentation is not the
source of truth for this book.
