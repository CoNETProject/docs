# Developers

**Evidence level: mixed.** L0 client surfaces and L1 read/write contracts are implemented or production references. CoNET-DLE remains a normative design. This section is a how-to index, not a claim that every listed path is permissionless or generally available.

Public site: [https://gitbook.conet.network/developers/](https://gitbook.conet.network/developers/)

Use this top-level track when the task is **to build or operate against CoNET**, rather than to read the protocol architecture. Architecture chapters stay under [L0](../l0/README.md), [L1](../l1/README.md), and [L2](../l2/README.md). This section sits after those chapters and before [Applications](../applications/README.md).

A change to the DePIN / L0 **protocol layer** must update **both** those architecture pages and this developer track in the same task. Do not document a new HTTP field, encryption target, or mailbox instruction on only one side.

## Tracks

| Track | What you build or operate | Start here |
| --- | --- | --- |
| **L0 development** | A client against CoNET-SI: `POST /post`, mailbox listen, Chat, UDP, or another application envelope | [L0 development](l0.md) |
| **L1 node** | A permissionless geth + Prysm full node, and optionally a 32 CNET Beacon validator | [Run an L1 node](l1-node.md) |
| **L1 overlay daemon** | Optional Linux TUN + iptables catch so geth / beacon can use Layer Minus as a **static overlay** path. Crate MVP accepted; P1 outbound + inbound decrypt/TUN write-back in-crate; lab binary may run with `[l0]` off; live mailbox SSE not opened | [conet-l0d](conet-l0d.md) |
| **L1 mining** | A Guardian / LayerMinus participant, or a collector that verifies mining gossip | [Participate in mining](l1-mining.md) |
| **L1 ERC-20 ingress** | Use, or request admission for, a foreign ERC-20 through the decentralized Treasury | [Bring an ERC-20 into CoNET](l1-erc20-bridge.md) |
| **L2 development** | Implement or review against the CoNET-DLE specifications | [L2 development](l2.md) |

```text
Developers
  ├─ L0  → SI /post + application compositions (Chat, UDP, SilentPass)
  ├─ L1  → geth + Prysm node  |  optional overlay daemon (conet-l0d)  |  DePIN mining  |  Treasury ERC-20
  └─ L2  → DLE specs, vectors, lab explorer, L1 routing registry, and blocked production gates
```

## Choose the right layer

- **Forward ciphertext by wallet / OpenPGP key ID** → L0. Layer Minus is a permissionless cloud: use it without a license; treat **every node as untrusted**; compose privacy routing and fragmentation. It does not implement Chat, VPN, mining totals, or payments. See [Permissionless cloud](../l0/permissionless-cloud.md).
- **Run geth + Prysm or stake 32 CNET on the Beacon deposit contract** → [Run an L1 node](l1-node.md). That path is permissionless. Genesis files and DHT / geth peers are published there.
- **Optional overlay P2P for NAT / no public IP** → [conet-l0d](conet-l0d.md). The daemon owns TUN and iptables. It does **not** replace public 8400 / 4200 for the 6-second slot. Operator how-to: [Applications — L1 overlay daemon](../applications/conet-l0d.md).
- **Join DePIN mining** → [Participate in mining](l1-mining.md). Guardian registration, the VDR stake ledger, runtime miners, Treasury miners, and L1 Beacon validators are **different sets**. `totalStakedValidatorCount()` (~475) is not the Prysm active set.
- **Move an ERC-20 into the CoNET asset set** → Treasury V3. A token address does not create a route. DLE admission is a later, separate machine and is **not live**.
- **Write a parallel ledger** → L2 specifications. There is no production DLE SDK or production tip API in this book. The lab explorer at [https://dle.conet.network/](https://dle.conet.network/) is Archive inspection (lab M6 **Clusters = 2**; the second Group ID is the G2 L1 register tx). The L1 routing registry is readable for both live groups; Archive Certificate is not a production object.

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
2. [Run an L1 node →](l1-node.md)
3. [conet-l0d overlay daemon →](conet-l0d.md)
4. [Participate in mining →](l1-mining.md)
5. [Bring an ERC-20 into CoNET →](l1-erc20-bridge.md)
6. [L2 development →](l2.md)
