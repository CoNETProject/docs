# CoNET

CoNET is a wallet-addressed stack with three infrastructure layers and
multiple applications:

| Layer | Responsibility | Start here |
|---|---|---|
| **L0 — Layer Minus** | Route encrypted application data by wallet/OpenPGP identity through a permissionless node network | [L0 overview](l0/README.md) · [How to use L0](l0/using-l0.md) |
| **L1 — CoNET Blockchain** | EVM state, identity registries, validators, canonical assets, Treasury, and settlement (`chainId` **224422**) | [L1 overview](l1/README.md) · [Run an L1 node](developers/l1-node.md) |
| **L2 — CoNET-DLE** | Parallel application-ledger classes with explicit archive, finality, and settlement rules | [L2 overview](l2/README.md) · [DLE explorer](l2/explorer.md) |

Applications use only the layers they need. [SilentPass](applications/silentpass-vpn.md)
provides privacy egress, [CoNET Chat](applications/depin-chat.md) provides
relationship-private wallet communication, and [Beamio](applications/beamio.md) provides consumer,
merchant, and POS workflows.

## Wallet-addressed applications

[`web3://`](applications/web3-url.md) is an **application protocol using L0
infrastructure**. It defines wallet-addressed locators, exact identity
resolution, caller-signed requests, correlated encrypted responses,
persistent application streams, and client security rules without adding
another L0 wire command.

Linux servers and clients can use the
[`conet-l0d` runtime](developers/conet-l0d.md). Windows, macOS, Android, iOS,
and browser applications implement the same `web3://` contract in browser or
native client code. See the [protocol contract](l0/web3-application-protocol.md)
for the interoperable URI and envelope rules.

## Layer boundaries

```text
applications ───── encrypted transport ─────► L0
     │                                        │
     ├──────── shared state / settlement ────► L1
     │
     └──────── high-frequency ledger work ───► L2

L0 route identities may be anchored in selected L1 registries.
L0 does not replace L1 consensus or L2 finality.
```

L0 does not remove IP from the Internet. It moves application identity and
routing away from public origin addresses, encrypts data for the intended
recipient, and limits what an intermediary needs to know.

## How to read this book

- Products and application protocols: [Applications](applications/README.md).
- Architecture: [System overview](overview.md), then L0 → L1 → L2.
- `web3://`: [Applications](applications/web3-url.md) →
  [protocol](l0/web3-application-protocol.md) →
  [Linux runtime](developers/conet-l0d.md).
- L1 operations: [Run an L1 node](developers/l1-node.md),
  [RPC and Explorer](l1/rpc-explorer.md), and
  [decentralization evidence](l1/decentralization.md).
- L0 implementation: [L0 development](developers/l0.md),
  [SI developer guide](l0/si-developer-guide.md), and
  [security limits](l0/security-limits.md).
- Current endpoints and repositories: [Resources](resources.md).

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
