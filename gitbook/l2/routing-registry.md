# Global Archive Routing Registry

**Evidence level: Production reference** for the CoNET L1 routing facade and the public explorer display. This page is **not** evidence that Archive Certificate, tip execution, asset ingress, or 30-day lab qualification are live.

Whitepaper §5.2.0d requires a CoNET L1 registry of every live archive group, every participating archive **wallet**, and every hosted chain NFT id. That facade is deployed and Explorer-verified.

Public UI: [https://dle.conet.network/](https://dle.conet.network/) and [https://dle.conet.network/archives](https://dle.conet.network/archives). Digest of the lab explorer: [DLE explorer](explorer.md).

Do **not** write `dle.conet.network` into Solidity. The registry stores wallets, uint `groupId` keys, and NFT ids. The user-visible Group ID is this group’s L1 register tx hash.

## Network facts

Observed and verified **2026-08-14**. Canonical address is the **UUPS proxy**.

| Field | Canonical value |
| --- | --- |
| Routing registry | [`0x8B261eAECdFfeE9e7aC9fFe73386B0d6C9E76AfB`](https://mainnet.conet.network/address/0x8B261eAECdFfeE9e7aC9fFe73386B0d6C9E76AfB#code) |
| Implementation | [`0x65691CFc82D55eFbe03cE91f6Ab6109b6c73ab9d`](https://mainnet.conet.network/address/0x65691CFc82D55eFbe03cE91f6Ab6109b6c73ab9d#code) |
| L1 `chainId` | **224422** (`0x36ca6`) |
| EIP-155 Chain ID (CoNET-DLE Testnet) | **281669** (`0x44c45`) — not stored on this registry |
| User-visible Group ID | this group’s **register tx** (below) |
| L1 uint `groupId` (storage key) | bootstrap **1** |
| Registry read RPC | `https://rpc1.conet.network` |
| Backup RPC | `https://publicrpc.conet.network` |
| L1 Explorer | `https://mainnet.conet.network` |
| DLE explorer | `https://dle.conet.network` |
| Archives | `https://dle.conet.network/archives` |
| Proxy name on Explorer | `DLEERC1967Proxy` (`is_verified` and `is_partially_verified`) |
| Implementation name | `GlobalArchiveRoutingRegistryV1` (`is_verified` and `is_partially_verified`) |
| Deploy / bootstrap block | `840617` |
| Owner | `0x87cAeD4e51C36a2C2ece3Aaf4ddaC9693d2405E1` |
| Bootstrap group | `groupId = 1`, `membershipEpoch = 1`, `keyEpoch = 1` |
| Register tx | [`0x3076a806de71ab75b2d48063cc3f1e7d8f8e3d54cb1d45a7469c75c9276f2ad0`](https://mainnet.conet.network/tx/0x3076a806de71ab75b2d48063cc3f1e7d8f8e3d54cb1d45a7469c75c9276f2ad0) |

Read this contract on `https://rpc1.conet.network` or `https://publicrpc.conet.network`. Do not use deprecated `https://rpc.conet.network`.

## What is live versus what is not

| Live | Not implied |
| --- | --- |
| L1 registry proxy + verified implementation | Full DLE tip production |
| Bootstrap `groupId = 1` with seven distinct participant EOAs | Archive Certificate / AC finality |
| Explorer `/archives` shows each node’s participant wallet | 30-day qualification (`100` rotations / `30` re-homes / `100` takeovers remain `0`) |
| Clients may `eth_call` `liveGroupIds()` and `archivesOf(1)` | `OperatorDomainRegistryV1`, `AssetBurnMintGateway`, or a production tip RPC |

A wallet listed here is a **routing identity**. It is not a Guardian honesty proof and not a 30-day qualification claim.

## Required views (whitepaper §5.2.0d)

| View | Returns | Use |
| --- | --- | --- |
| `liveGroupIds()` | Live L1 uint keys (Solidity). Archive HTTP facade maps them to **Group ID hashes** | Enumerate groups |
| `archivesOf(groupId)` | Five active + two standby EOAs | Who belongs to that group. Solidity takes uint `1`; UI shows the register tx as Group ID |
| `chainsOf(groupId)` | Hosted chain NFT ids | Which tips this **group** hosts |
| `route(chainNftId)` | L1 uint on-chain; protocol facade returns the **Group ID hash** | Chain routing to a group — not EIP-155 |
| `historyProviders(chainNftId)` | `archivesOf(route(chainNftId))` | Authoritative history providers |

`route` and `historyProviders` revert `UnknownChain` until a chain NFT is bound. Bootstrap group `1` currently has a roster and **no** bound tip NFT.

To locate a bound tip: facade `route(nftId)` returns the **Group ID hash**, then contact `historyProviders(nftId)`. A wallet not listed for that group at the relevant membership epoch is not the canonical host.

## Bootstrap roster (`archivesOf(1)`)

Each archive **must** have its own participant wallet. The seven addresses below are distinct. Slot order is `archivesOf(1)[0]` … `[6]`.

| Slot | Lab `domainId` | Role | Participant wallet |
| --- | --- | --- | --- |
| 0 | `fd-01-ionos-45` | active | [`0xB7D3541290b6Ca21C94427D738b1C250c1Cb9d14`](https://mainnet.conet.network/address/0xB7D3541290b6Ca21C94427D738b1C250c1Cb9d14) |
| 1 | `fd-02-ionos-189` | active | [`0x6da445Bd5ffC8a68A09b132e0AD5Eb5416fBe9B9`](https://mainnet.conet.network/address/0x6da445Bd5ffC8a68A09b132e0AD5Eb5416fBe9B9) |
| 2 | `fd-03-ionos-98` | active | [`0xf264D0EA6A78D3a35EDb1F6A6358088d02D0a626`](https://mainnet.conet.network/address/0xf264D0EA6A78D3a35EDb1F6A6358088d02D0a626) |
| 3 | `fd-04-hosthatch-tokyo1` | active | [`0x7C162b6A2e6d81f80163666ddAE3Cf368bDCA026`](https://mainnet.conet.network/address/0x7C162b6A2e6d81f80163666ddAE3Cf368bDCA026) |
| 4 | `fd-05-hosthatch-tokyo2` | active | [`0x02480639F3A87309a1EeC4BcC1A10B7AE13e7f7a`](https://mainnet.conet.network/address/0x02480639F3A87309a1EeC4BcC1A10B7AE13e7f7a) |
| 5 | `fd-06-ionos-174` | standby | [`0xb25932EBB7460B40741aA9431798b0f18331fE7a`](https://mainnet.conet.network/address/0xb25932EBB7460B40741aA9431798b0f18331fE7a) |
| 6 | `fd-07-ionos-207` | standby | [`0xc97BBcF81C793e32d385337eccD1f211DF4757a5`](https://mainnet.conet.network/address/0xc97BBcF81C793e32d385337eccD1f211DF4757a5) |

The [Archives page](https://dle.conet.network/archives) renders these wallets as address capsules. The UI seeds from a local roster, then overlays a trusted `archivesOf(1)` read from CoNET L1 RPC. A failed RPC must not clear a previously trusted wallet.

Do not publish lab host IPs, SSH targets, or signing keys from this page.

## Read `archivesOf(1)`

```bash
curl -s https://rpc1.conet.network \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":"0x8B261eAECdFfeE9e7aC9fFe73386B0d6C9E76AfB","data":"0xd3a448be0000000000000000000000000000000000000000000000000000000000000001"},"latest"]}'
```

Selector `archivesOf(uint64)` is `0xd3a448be`. The result is seven left-padded addresses in slot order. `liveGroupIds()` is `0x7e847d92`.

## Identifiers that must not be mixed

| Identifier | Value | Use |
| --- | --- | --- |
| CoNET L1 `chainId` | `224422` / `0x36ca6` | This registry lives here |
| EIP-155 Chain ID | CoNET-DLE Testnet `0x44c45` / `281669` | Wallets / `eth_chainId`. Not this registry’s storage key |
| User-visible Group ID | L1 register tx `0x3076a806…6f2ad0` | Distinguishes archive groups (whitepaper §5.2.0d) |
| L1 uint `groupId` | bootstrap `1` | Solidity storage key only |

## See also

- [DLE explorer](explorer.md) — [https://dle.conet.network/](https://dle.conet.network/)
- [Archive plane](archive-plane.md) — production versus archive certification
- [CoNET L1 RPC and Explorer](../l1/rpc-explorer.md)
- [L2 development](../developers/l2.md)
