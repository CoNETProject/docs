# Resources

This page is the operational reference for public endpoints and the **public git map** for independent reproduction.

CoNET protocol components are published under public GitHub organizations. A local engineering checkout may still look like one workspace. Where a public remote exists, this book cites that remote. Workspace paths are leftover checkout labels, not a claim that the source is closed.

## Live CoNET L1 services

CoNET L1 uses `chainId` **224422** (`0x36ca6`).

| Service | Current endpoint | Use |
| --- | --- | --- |
| Primary RPC | https://rpc1.conet.network | Contract reads and submitted transactions |
| Public RPC | https://publicrpc.conet.network | Public reads and fallback |
| Explorer | https://mainnet.conet.network | Blocks, transactions, contracts, and tokens |
| Explorer alias | https://scan.conet.network | Alternate explorer entry point |

`https://rpc.conet.network` is **deprecated**. It may be stale or on a divergent historical network even when it reports the same chain ID. Do not use it to decide whether a contract or transaction exists.

For integration details, see [RPC and Explorer](l1/rpc-explorer.md). To run your own geth + Prysm node, download genesis files from [Run an L1 node](developers/l1-node.md). For Beacon `validator_index`, the VDR stake ledger, Guardian (L0) counts, and governance views, see [L1 decentralization](l1/decentralization.md). Do not treat `totalStakedValidatorCount()` as the Prysm active set.

## DLE lab explorer

[https://dle.conet.network/](https://dle.conet.network/) is the authorized **CoNET-DLE Explorer**. It inspects the isolated Archive lab and shows each node’s participant wallet. It is not Blockscout, not CoNET L1, and not a production tip RPC.

| Path | Use |
| --- | --- |
| [`/`](https://dle.conet.network/) | Home: health, CoNET-DLE Testnet chain id `0x44c45`, Group ID capsule, tip / certificate status |
| [`/archives`](https://dle.conet.network/archives) | 5+2 roster + participant wallets (L1 overlay) |
| [`/events`](https://dle.conet.network/events) [`/certificates`](https://dle.conet.network/certificates) | Lab events; certificate page is empty |
| `GET /health` | Isolated Archive process health |
| `GET /api/v2/dle` | Explorer snapshot (`DleExplorerApiV1`) |
| `POST /rpc` | Read-only DLE facade (`dle_info`, `dle_tip`, `eth_chainId`, …). No tip VM. |

`eth_chainId` `0x44c45` is **CoNET-DLE Testnet** (EIP-155 plane id). User-visible **Group ID** is the bootstrap group’s L1 register transaction hash (whitepaper §5.2.0d). Digest: [DLE explorer](l2/explorer.md).

## Global Archive Routing Registry (CoNET L1)

The §5.2.0d routing facade is deployed and Explorer-verified. Canonical proxy: [`0x8B261eAECdFfeE9e7aC9fFe73386B0d6C9E76AfB`](https://mainnet.conet.network/address/0x8B261eAECdFfeE9e7aC9fFe73386B0d6C9E76AfB#code). Bootstrap `groupId = 1` has seven distinct participant wallets. This is routing identity, not Archive Certificate and not 30-day qualification. Digest: [Global Archive Routing Registry](l2/routing-registry.md).

## Network and storage services

| Service | Endpoint | Boundary |
| --- | --- | --- |
| CoNET website | https://conet.network | Public project site |
| This GitBook | https://gitbook.conet.network | Current technical documentation |
| IPFS fragment service | https://ipfs.conet.network | Content-addressed fragment storage and retrieval |

The historical `doceng.conet.network` export is archived in the documentation repository. It is not maintained as a current protocol reference.

## Application entry points

| Application | Entry point | Status in this book |
| --- | --- | --- |
| Beamio Consumer | https://beamio.app/app/ | Product endpoint |
| Beamio Merchant OS | https://biz.beamio.app | Product endpoint |
| Beamio POS | https://pos.conet.network/ and https://beamio.app/pos/ | Product endpoints |
| Beamio API host | https://beamio.app | Application API and metadata host |
| SilentPass | https://vpn9.conet.network/ | Product entry point |
| SilentPass beta | https://vpn-beta.conet.network/ | Access-controlled beta entry point |
| Miner-matched order-book exchange | No public client endpoint yet | Under development / design study |
| BT over DePIN DCDN | No public client endpoint yet | Under development |
| L1 overlay daemon (conet-l0d) | No public product endpoint; Linux command in the engineering crate | Under development |

Product status and protocol dependencies are documented under [Applications](applications/README.md).

## Public GitHub organizations

These organizations host the independently cloneable CoNET / Beamio sources cited below.

| Organization | Role |
| --- | --- |
| [CoNET-project](https://github.com/CoNET-project) | Layer Minus, SilentPass, CoNET-DLE, chat-sdk, historical platform docs |
| [CoNETProject](https://github.com/CoNETProject) | This GitBook (`docs`) |
| [beamio-APP](https://github.com/beamio-APP) | L1/application contract workspace snapshot, homepage, Consumer Android shell |
| [settleonbase](https://github.com/settleonbase) | Application SDK / Cluster-Master relay (`x402sdk`) |

## Public source and packages

| Component | Public repository | Package or branch |
| --- | --- | --- |
| Layer Minus service node | https://github.com/CoNET-project/CoNET-SI | https://www.npmjs.com/package/@conet.project/mvp-si |
| Layer Minus client/data plane | https://github.com/CoNET-project/CoNET-DL | https://www.npmjs.com/package/@conet.project/mvp-dl |
| CoNET-DLE whitepaper, specs, and TLA | https://github.com/CoNET-project/CoNET-DLE | Default branch `main` |
| Beamio Consumer PWA | https://github.com/CoNET-project/SilentPassUI | Branch [`cashtree`](https://github.com/CoNET-project/SilentPassUI/tree/cashtree) |
| Beamio Merchant OS | https://github.com/CoNET-project/SilentPassUI | Branch [`cashtrees`](https://github.com/CoNET-project/SilentPassUI/tree/cashtrees) |
| Beamio Alliance client | https://github.com/CoNET-project/SilentPassUI | Branch [`Alliance`](https://github.com/CoNET-project/SilentPassUI/tree/Alliance) |
| CoNET Dashboard | https://github.com/CoNET-project/SilentPassUI | Branch [`CoNET/Dashboard`](https://github.com/CoNET-project/SilentPassUI/tree/CoNET/Dashboard) |
| Beamio Consumer Android shell | https://github.com/beamio-APP/Android | WebView shell for `https://beamio.app/app/` |
| Beamio homepage | https://github.com/beamio-APP/homepage | — |
| L1 / application contracts | https://github.com/beamio-APP/BeamioContract | Public snapshot; **current bytecode is Explorer-verified** |
| Beamio application SDK/API | https://github.com/settleonbase/x402sdk | https://www.npmjs.com/package/@settle402/sdk |
| CoNET Chat SDK | https://github.com/CoNET-project/chat-sdk | https://www.npmjs.com/package/@conet.project/chat-sdk |
| GitBook source | https://github.com/CoNETProject/docs | This book: `gitbook/` |
| L1 overlay daemon | https://github.com/CoNET-project/CoNET-L0D | Independent crate (engineering checkout may also keep a working copy) |

Client-specific SilentPass repositories:

- https://github.com/CoNET-project/SilentPass-iOS
- https://github.com/CoNET-project/SilentPass-Android
- https://github.com/CoNET-project/SilentPass-MacOS
- https://github.com/CoNET-project/SilentPassProxy-Mac
- https://github.com/CoNET-project/SilentPassProxy-win
- https://github.com/CoNET-project/vpn2socks

## What is public versus what is unfinished

Public source and a finished product are different claims.

| Topic | Public git / Explorer status | Product status |
| --- | --- | --- |
| L0 SI / DL | Public repositories and npm packages | Production Layer Minus nodes and clients |
| L1 contracts | [beamio-APP/BeamioContract](https://github.com/beamio-APP/BeamioContract) plus Explorer verification | Live `chainId` 224422; GitHub snapshot last pushed **2026-03-10**, so treat Explorer-verified bytecode as current |
| CoNET-DLE design | [CoNET-project/CoNET-DLE](https://github.com/CoNET-project/CoNET-DLE) — bilingual whitepaper (rev **2026-08-16**), three `DLE-*Spec.md` files, TLA model, explorer SPA | Normative design; not a launched production L2. Public lab UI: [dle.conet.network](https://dle.conet.network/) (Testnet `0x44c45` + first-group Group ID hash; lab M6 Clusters = 2). L1 routing facade deployed: [registry](l2/routing-registry.md) |
| Archive second implementation | Listed as an open production blocker in the public Archive spec | Not complete; production archive signing is forbidden until the spec’s blockers close |
| DEX client | No public exchange client repository identified | Design study |
| BT / DCDN client | No CoNET BitTorrent or DCDN client repository identified | Under development; do not treat upstream WebTorrent as the CoNET product |
| L1 overlay daemon | Crate MVP accepted + [Applications](applications/conet-l0d.md) / [Developers](developers/conet-l0d.md) pages | Under development; P1 outbound + inbound decrypt/TUN write-back + EIP-191 listen HTTP+SSE worker in-crate (mock-tested), default off; lab binary may run with `[l0]` off; production SI listen not opened; no live SI `p2p_stream_*` |
| SNS / creator client | No public feed or creator-studio client identified | Economic design studies only |
| POS PWA | Public product endpoints; **no standalone public repository identified** | Live POS PWA |

The remaining reproduction gaps are therefore **unfinished implementations and one unpublished POS client repo**, not a hidden CoNET-DLE specification.

## Normative file map

Paths below are relative to the named **public repository**.

| Topic | Public file |
| --- | --- |
| Developer index | This book: [Developers](developers/README.md) |
| How applications use Layer Minus | This book: [How to use Layer Minus](l0/using-l0.md) |
| L0 client how-to | This book: [L0 development](developers/l0.md) · [SI developer guide](l0/si-developer-guide.md) |
| Chat client how-to | This book: [Chat developer guide](l0/chat-developer-guide.md) |
| L1 node how-to + genesis downloads | This book: [Run an L1 node](developers/l1-node.md) · [genesis.json](https://gitbook.conet.network/l1/network/genesis.json) · [genesis.ssz](https://gitbook.conet.network/l1/network/genesis.ssz) · [config.yml](https://gitbook.conet.network/l1/network/config.yml) |
| L1 overlay operator / developer how-to | This book: [Applications — conet-l0d](applications/conet-l0d.md) · [Developers — conet-l0d](developers/conet-l0d.md) |
| DePIN mining how-to | This book: [Participate in mining](developers/l1-mining.md) |
| ERC-20 Treasury ingress | This book: [Bring an ERC-20 into CoNET](developers/l1-erc20-bridge.md) |
| L2 / DLE how-to | This book: [L2 development](developers/l2.md) · [DLE explorer](l2/explorer.md) · [routing registry](l2/routing-registry.md) |
| L0 threat grades | This book: [Security limits](l0/security-limits.md) |
| Layer Minus node behavior | [CoNET-project/CoNET-SI](https://github.com/CoNET-project/CoNET-SI) |
| Layer Minus client/data plane | [CoNET-project/CoNET-DL](https://github.com/CoNET-project/CoNET-DL) |
| Guardian registry | Explorer [`GuardianNodesInfoV6`](https://mainnet.conet.network/address/0xBC6b53065b5647261396d002bDBA0d3396E0722f); source in [BeamioContract](https://github.com/beamio-APP/BeamioContract) |
| Validator deposits | Explorer [`ValidatorDepositRedeem`](https://mainnet.conet.network/address/0xc71e246DD78B37C2fABc905D340932F28F503433) |
| Cross-chain Treasury | Explorer [`TreasuryBridgeV3`](https://mainnet.conet.network/address/0xa208982212978550594A7FEEB70a61665d129003) (`0xa208…` only; older Treasury addresses are deprecated) |
| CoNET-DLE whitepaper, English | [Decentralization Cluster multi-chain.md](https://github.com/CoNET-project/CoNET-DLE/blob/main/src/whitepaper/Decentralization%20Cluster%20multi-chain.md) |
| CoNET-DLE whitepaper, Chinese | [Decentralization Cluster multi-chain.zh-CN.md](https://github.com/CoNET-project/CoNET-DLE/blob/main/src/whitepaper/Decentralization%20Cluster%20multi-chain.zh-CN.md) |
| DLE normative specifications | [src/whitepaper/DLE-*-Spec.md](https://github.com/CoNET-project/CoNET-DLE/tree/main/src/whitepaper) |
| Current GitBook source | [CoNETProject/docs `gitbook/`](https://github.com/CoNETProject/docs/tree/master/gitbook) |

The paired DLE whitepapers and named `DLE-*-Spec.md` files are the normative design anchors. Canvas snapshots, where present in an engineering checkout, record analysis and review context; they do not override specifications or deployed code.

## Community

| Channel | URL |
| --- | --- |
| X / Twitter | https://twitter.com/CoNET_Network |
| Telegram | https://t.me/conet_network |
| Medium | https://conet.medium.com |
