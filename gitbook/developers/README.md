# Developers

Use this section to build or operate against CoNET. Architecture remains
under [L0](../l0/README.md), [L1](../l1/README.md), and
[L2](../l2/README.md); user-facing products are under
[Applications](../applications/README.md).

A change to an L0 wire contract must update both the architecture and
developer tracks in the same task.

## Tracks

| Track | What you build or operate | Start here |
|---|---|---|
| **L0 development** | A client using `POST /post`, mailbox receive, Chat, UDP, or another encrypted application envelope | [L0 development](l0.md) |
| **`web3://` applications** | Wallet-addressed request/response or persistent application streams | [Protocol](../l0/web3-application-protocol.md) |
| **Linux `web3://` runtime** | Publish or open services with `conet-l0d` | [`conet-l0d`](conet-l0d.md) |
| **L1 node** | A permissionless geth + Prysm full node and optional validator | [Run an L1 node](l1-node.md) |
| **L1 mining** | Guardian / LayerMinus participation and verified mining gossip | [Participate in mining](l1-mining.md) |
| **L1 ERC-20 ingress** | Admit a foreign ERC-20 through TreasuryBridgeV3 | [Bring an ERC-20 into CoNET](l1-erc20-bridge.md) |
| **L2 development** | Implement or review the CoNET-DLE specifications | [L2 development](l2.md) |

## Choose the right track

- Forward ciphertext by wallet or OpenPGP key ID: use
  [L0 development](l0.md).
- Build a wallet-addressed application: implement the
  [`web3://` protocol](../l0/web3-application-protocol.md).
- Host that application on Linux or open it from a Linux client: use
  [`conet-l0d`](conet-l0d.md).
- Implement the client on Windows, macOS, Android, iOS, or in a browser:
  implement the same `web3://` locator, caller-signed request, encrypted
  response correlation, and rendering contract in client code.
- Run geth and Prysm: use [Run an L1 node](l1-node.md). The public P2P path is
  independent of `web3://`.
- Join DePIN mining: use [Participate in mining](l1-mining.md).
- Move an ERC-20 into CoNET: use
  [Treasury ERC-20 ingress](l1-erc20-bridge.md).
- Implement a parallel ledger: use [L2 development](l2.md); do not treat the
  lab explorer as a production DLE SDK.

## Reusable constants

| Item | Value |
|---|---|
| CoNET L1 | `chainId` **224422** |
| Primary RPC | `https://rpc1.conet.network` |
| Backup public RPC | `https://publicrpc.conet.network` |
| Explorer | `https://mainnet.conet.network` |
| AddressPGP | `0x684b0ac760cEE9c9b85de36d69746420648Cf9e2` |
| GuardianNodesInfoV6 | `0xBC6b53065b5647261396d002bDBA0d3396E0722f` |
| TreasuryBridgeV3 | `0xa208982212978550594A7FEEB70a61665d129003` |

Do not use deprecated `https://rpc.conet.network`. Do not invent an SI
hostname; use existing Guardian domains from the live registry.

## Next

1. [L0 development](l0.md)
2. [`web3://` Application Protocol](../l0/web3-application-protocol.md)
3. [`conet-l0d` Linux runtime](conet-l0d.md)
4. [Run an L1 node](l1-node.md)
5. [Participate in mining](l1-mining.md)
6. [Bring an ERC-20 into CoNET](l1-erc20-bridge.md)
7. [L2 development](l2.md)
