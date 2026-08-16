# DLE explorer

This page is the **production reference for the public DLE explorer UI**. It is **not** a production reference for DLE consensus, Archive Certificate, or tip execution. CoNET L1 routing wallets are documented on [Global Archive Routing Registry](routing-registry.md).

The explorer is a read-only inspection surface for the isolated 30-day DLE Archive lab. It does not produce blocks, does not execute `eth_call`, and does not mint or burn assets.

## Network facts

| Field | Canonical value |
| --- | --- |
| Explorer | `https://dle.conet.network` |
| Archives | `https://dle.conet.network/archives` |
| Lab health | `https://dle.conet.network/health` |
| Lab RPC | `https://dle.conet.network/rpc` |
| EIP-155 Chain ID (CoNET-DLE Testnet) | **281669** (`0x44c45`) |
| User-visible Group ID | L1 bootstrap register tx `0x3076a806…6f2ad0` |
| L1 uint `groupId` (storage key) | bootstrap **1** |
| Product name | CoNET-DLE Explorer |
| Source | [CoNET-project/CoNET-DLE `explorer/`](https://github.com/CoNET-project/CoNET-DLE/tree/main/explorer) |
| Same-origin backends | `GET /health`, `POST /rpc`, `GET /api/v2/dle` |
| Lab agent | `dle-30d-lab` |
| Lab runtime | Node.js Archive process, `command: archive` |
| Observed 2026-08-15 | `/health` `ok: true`; **`liveGroupCount`: 1**; Home metric **Clusters** (not Tip height) |

This hostname is an authorized CoNET path. Do **not** invent additional `dle.*` hostnames, and do **not** write explorer hostnames into Solidity constants. Production routing truth is the deployed L1 [Global Archive Routing Registry](routing-registry.md), not this URL.

## What the explorer is

The explorer answers one question: **what is the isolated Archive lab reporting right now?**

It shows:

- whether the proxied Archive process is healthy
- whether that process produces blocks or has a tip VM (**both are false**)
- CoNET-DLE Testnet `eth_chainId` (`0x44c45`) and the bootstrap **Group ID** (L1 register tx) as a hash capsule
- heartbeat / health events
- fixture Archive rows used by the UI
- each Archive’s **participant wallet** (local seed, then a trusted L1 `archivesOf` overlay)
- that a Networked Archive Certificate is **not** produced in this scaffold

It does **not** show:

- a launched DLE tip chain
- Archive Certificate / AC finality
- Treasury lock / mint / burn
- Guardian listing as an honesty proof
- raw lab host inventories as a public API

The Archives page **does** display CoNET L1 `224422` participant wallets for the bootstrap group. That is routing identity, not tip state and not 30-day qualification.

## Pages

These public HTML routes returned `200` on 2026-08-14:

| Path | Role |
| --- | --- |
| [`/`](https://dle.conet.network/) | Home: health, CoNET-DLE Testnet chain id `0x44c45` plus **Group ID** capsule (bootstrap register tx; opens Blockscout `/tx/…`; no “Decimal 281,669. Not CoNET L1 224422.” hint), **Clusters** (\(G_e\); genesis / no fission = 1), certificate status. No Tip height panel |
| [`/events`](https://dle.conet.network/events) | Heartbeat and health events from `/api/v2/dle/events` |
| [`/archives`](https://dle.conet.network/archives) | 5+2 lab roster; each row has a distinct participant wallet (AddressCapsule). L1 `archivesOf(1)` is the trusted overlay |
| [`/certificates`](https://dle.conet.network/certificates) | Certificate page; current payload is `available: false` |

The explorer SPA source also defines `/events/:eventId`, `/archives/:domainId`, and a JSON-RPC probe page at `/rpc`. On the public host, **`POST /rpc` is the Archive JSON-RPC facade**. Do not treat a browser `GET /rpc` as a documented HTML page.

## Same-origin API

The UI talks only to its own origin. nginx proxies those paths to the lab Archive listener. Clients should use the hostname, not unpublished lab IPs.

### `GET /health`

Observed shape on 2026-08-14:

```json
{
  "ok": true,
  "command": "archive",
  "runtime": "nodejs",
  "producesBlocks": false,
  "hasTipVm": false,
  "chainId": 281669,
  "chainIdHex": "0x44c45",
  "chainName": "CoNET-DLE Testnet",
  "port": 27101,
  "agent": "dle-30d-lab",
  "isolatedFromElCl": true,
  "lastQuorumOk": true,
  "lastPeerOk": 6,
  "liveGroupCount": 1,
  "liveGroupIds": ["0x3076a806de71ab75b2d48063cc3f1e7d8f8e3d54cb1d45a7469c75c9276f2ad0"]
}
```

Read this as **lab process health**, not BFT quorum and not Archive Certificate.

### `GET /api/v2/dle`

Schema `DleExplorerApiV1`. The Home page uses **`liveGroupCount` / `liveGroupIds`** for the **Clusters** card (not tip height), plus certificate availability and the allowed JSON-RPC method list. Tip **hash** may still appear as a capsule.

Observed 2026-08-15:

- `liveGroupCount`: `1` (genesis cluster; no fission)
- `liveGroupIds`: `[bootstrap register tx hash]` (legacy lab nodes may still emit `dle.lab.group.v1` until redeployed)
- `tip.height` after AC is typically `"0x1"` and is **not** shown as a Home metric
- `certificate.available`: lab networked AC may be true; still not 30-day qualification

Related reads:

| Path | Schema | Role |
| --- | --- | --- |
| `GET /api/v2/dle/events` | `DleExplorerEventsV1` | Recent heartbeat / health rows |
| `GET /api/v2/dle/certificate` | `DleExplorerCertificateV1` | Explicit empty-certificate document |

### `POST /rpc`

This is a **read-only DLE facade**, not an Ethereum execution RPC.

| Method | Observed 2026-08-14 | Meaning |
| --- | --- | --- |
| `dle_info` | Archive lab info; `producesBlocks: false`; `hasTipVm: false` | Process identity |
| `dle_tip` | Height `0x0`; `finalized: false` | No production tip |
| `dle_getArchiveCertificate` | `available: false` | Certificate not produced |
| `eth_chainId` | `"0x44c45"` | CoNET-DLE Testnet EIP-155 id |
| `eth_blockNumber` | `"0x0"` | No tip blocks |
| `eth_call` | `-32601` | Rejected: no tip VM |
| `eth_estimateGas` | rejected | No tip VM |
| `eth_sendRawTransaction` | rejected | No tip VM |

The explorer Home page states the same rule: DLE has no tip VM, so `eth_call`, `eth_estimateGas`, and `eth_sendRawTransaction` are rejected.

## Three identifiers that must not be mixed

| Identifier | Value | Use |
| --- | --- | --- |
| **CoNET L1 chain id** | `224422` / `0x36ca6` | CoNET L1 RPC, explorer, and contracts. See [RPC and explorer](../l1/rpc-explorer.md). |
| **EIP-155 Chain ID** | `0x44c45` / `281669` | CoNET-DLE Testnet. Wallets / `eth_chainId`. See [Archive plane](archive-plane.md). |
| **Group ID** | L1 register tx `0x3076a806…6f2ad0` | Distinguishes archive groups. Home capsule label **Group ID**. |
| **L1 uint `groupId`** | bootstrap `1` | Solidity storage key only. Not shown as Group ID. |

Do not configure a wallet, bridge, or dapp to `0x44c45` as if it were CoNET L1 or a launched DLE tip chain.

## Lab status the explorer does not upgrade

The public UI being live does **not** close these whitepaper / spec gates:

| Gate | Status |
| --- | --- |
| Isolated 7-host lab + explorer | Deployed; 72-hour warmup started 2026-08-14 |
| 7×7 `/health` mesh | Heartbeat quorum only |
| Participant wallets on `/archives` | Seven distinct EOAs; L1 overlay from `archivesOf(1)` |
| Global Archive Routing Registry | Deployed and verified — [routing registry](routing-registry.md) |
| 30-day qualification | Not qualified (`100` rotations / `30` re-homes / `100` takeovers still at `0`; no `safety-failure` claimed) |
| Networked Tendermint / Archive Certificate | Not claimed |
| `OperatorDomainRegistryV1` / `AssetBurnMintGateway` | Not deployed as production DLE machines |
| Dual TypeScript Archive A/B | Implemented in-repo; does **not** close the independent second-language production blocker |

## What not to do

- Do not treat [https://dle.conet.network/](https://dle.conet.network/) as Blockscout or as `mainnet.conet.network`.
- Do not send asset, swap, or UserOp traffic to `POST /rpc`.
- Do not publish lab host IPs, `billingRef` values, or SSH targets from explorer fixtures.
- Do not write `dle.conet.network` into contract constants.
- Do not treat `0x44c45` as CoNET L1 or as Group ID. Do not display L1 uint `1` as Group ID.

## See also

- [Layer 2 overview](README.md)
- [Global Archive Routing Registry](routing-registry.md)
- [Archive plane](archive-plane.md)
- [Design thesis](design-thesis.md)
- [CoNET L1 RPC and explorer](../l1/rpc-explorer.md)
- [Developer quick start: Layer 2](../developers/l2.md)
