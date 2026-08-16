# Developers

**Evidence level: mixed.** L0 client surfaces and L1 read/write contracts are implemented or production references. CoNET-DLE remains a normative design. This section is a how-to index, not a claim that every listed path is permissionless or generally available.

Public site: [https://gitbook.conet.network/developers/](https://gitbook.conet.network/developers/)

Use this top-level track when the task is **to build or operate against CoNET**, rather than to read the protocol architecture. Architecture chapters stay under [L0](../l0/README.md), [L1](../l1/README.md), and [L2](../l2/README.md). This section sits after those chapters and before [Applications](../applications/README.md).

## Tracks

| Track | What you build or operate | Start here |
| --- | --- | --- |
| **L0 development** | A client against CoNET-SI: `POST /post`, mailbox listen, Chat, UDP, or another application envelope | [L0 development](l0.md) |
| **L1 mining** | A Guardian / LayerMinus participant, or a collector that verifies mining gossip | [Participate in mining](l1-mining.md) |
| **L1 ERC-20 ingress** | Use, or request admission for, a foreign ERC-20 through the decentralized Treasury | [Bring an ERC-20 into CoNET](l1-erc20-bridge.md) |
| **L2 development** | Implement or review against the CoNET-DLE specifications | [L2 development](l2.md) |

```text
Developers
  ├─ L0  → SI /post + application compositions (Chat, UDP, SilentPass)
  ├─ L1  → DePIN mining gossip  |  Treasury ERC-20 ingress
  └─ L2  → DLE specs, vectors, lab explorer, L1 routing registry, and blocked production gates
```

## Choose the right layer

- **Forward ciphertext by wallet / OpenPGP key ID** → L0. Layer Minus is a permissionless cloud: use it without a license; treat **every node as untrusted**; compose privacy routing and fragmentation. It does not implement Chat, VPN, mining totals, or payments. See [Permissionless cloud](../l0/permissionless-cloud.md).
- **Join DePIN mining or L1 consensus** → L1 mining page. Guardian registration, runtime miners, Treasury miners, and L1 validators are **four different sets**.
- **Move an ERC-20 into the CoNET asset set** → Treasury V3. A token address does not create a route. DLE admission is a later, separate machine and is **not live**.
- **Write a parallel ledger** → L2 specifications. There is no production DLE SDK or production tip API in this book. The lab explorer at [https://dle.conet.network/](https://dle.conet.network/) is Archive inspection (lab M6 **Clusters = 2**; the second Group ID is a laboratory hash, not an L1 register tx). The L1 routing registry is readable for the first group; Archive Certificate is not a production object.

## Constants you will reuse

| Item | Value |
| --- | --- |
| CoNET L1 | `chainId` **224422** |
| Read RPC | `https://rpc1.conet.network` (primary), `https://publicrpc.conet.network` (backup) |
| Explorer | `https://mainnet.conet.network` |
| DLE lab explorer | [https://dle.conet.network/](https://dle.conet.network/) — isolated Archive UI, not CoNET L1 |
| Global Archive Routing Registry | [`0x8B261eAECdFfeE9e7aC9fFe73386B0d6C9E76AfB`](https://mainnet.conet.network/address/0x8B261eAECdFfeE9e7aC9fFe73386B0d6C9E76AfB#code) — L1 routing facade |
| AddressPGP | [`0x684b0ac760cEE9c9b85de36d69746420648Cf9e2`](https://mainnet.conet.network/address/0x684b0ac760cEE9c9b85de36d69746420648Cf9e2) |
| GuardianNodesInfoV6 | [`0xBC6b53065b5647261396d002bDBA0d3396E0722f`](https://mainnet.conet.network/address/0xBC6b53065b5647261396d002bDBA0d3396E0722f) |
| TreasuryBridgeV3 | [`0xa208982212978550594A7FEEB70a61665d129003`](https://mainnet.conet.network/address/0xa208982212978550594A7FEEB70a61665d129003) |

Do not use deprecated `https://rpc.conet.network`. Do not invent a new hostname for SI; use the Guardian **domain** from `getAllNodes`.

## Next

1. [L0 development →](l0.md)
2. [Participate in mining →](l1-mining.md)
3. [Bring an ERC-20 into CoNET →](l1-erc20-bridge.md)
4. [L2 development →](l2.md)
