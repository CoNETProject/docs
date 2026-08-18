# Duplex overlay (L0 occupancy pipe + application JSON)

Duplex is two layers:

1. **L0 (SI)** — exclusive occupancy pipe: `l0_listen` (or `mining` + `listenKind: "l0"`) plus `l0_connect`. After the first connect occupies an idle L0 SSE, SI pipes remaining TCP bytes onto that SSE, marks the channel occupied, relinquishes control, and **409**s later inflows to that listen.
2. **Application (conet-l0d)** — `duplex_offer` / `duplex_accept` / `duplex_reject` / `duplex_frame`. Offer stays **user-PGP Chat gossip** so it cannot occupy the exclusive L0 listen. Accept, reject, and IPv4 frames are **AES-256-GCM blobs** on the occupied pipe.

SI does **not** implement `duplex_*` commands and does **not** maintain a duplex pool. Do **not** add `duplexForward.ts` or SI `duplex_*` cases. Do **not** document a live SI command named `p2p_stream_*` or `listenKind: "l1p2p"`. Do **not** send `command: "mining"` with `listenKind: "duplex"`.

Public site: [https://gitbook.conet.network/l0/duplex-forward.html](https://gitbook.conet.network/l0/duplex-forward.html)

**conet-l0d** is the first product that uses this composition for overlay `geth` / `beacon` IPv4.

## Why two own L0 listens (not a guest SSE)

HTTP SSE is server → listener only. One occupied pipe is **one direction**. Duplex therefore uses **two unidirectional occupied pairs**:

```text
I’s W_I L0 SSE  ←  R’s l0_connect (first PGP occupy, then AES)
R’s W_R L0 SSE  ←  I’s l0_connect (then AES)
```

A client must not attach a second listen for someone else's routing EOA on their mailbox B. Each end **owns** its L0 listen wallet.

| Name | Meaning | SI |
| --- | --- | --- |
| Long-lived channel Chat listen | Per overlay port `[[l0.channels]]` routing EOA. Receives **`duplex_offer` only** | Existing `mining` + `listenKind: "chat"` |
| Exclusive L0 listen | Idle until the first `l0_connect`. Then occupied (white mark); SI stops parsing | `l0_listen` or `mining` + `listenKind: "l0"`. Separate pool from Chat / mining / UDP |
| Guest listen on peer B | Forbidden | Would need a second socket on the peer wallet |

**conet-l0d crate MVP** uses the already-registered per-port channel EOA as `W_I` / `W_R` (same EOA may hold Chat SSE **and** `l0_listen` in different pools). The wire still names `listenWallet` / `listenUserPgp` so a later cut can mint a fresh EOA without changing SI.

Idle L0 may still receive **user-PGP gossip** (offers) without occupying. After occupy, **all** later inflows (gossip and connects) are 409. Occupied gossip is write-to-SSE only on idle; never APNs / `saveLocal` onto an occupied L0 SSE.

## What it is

Each duplex session uses **two keys**. Do not mix them.

| Key | Who holds it | Purpose |
| --- | --- | --- |
| Overlay e2e AES-256-GCM | **Both l0d (or app) ends only** | Seal application JSON (`duplex_accept` / `duplex_reject` / `duplex_frame`). Mailbox **B must not** hold it |
| Chat listen `Securitykey` | Mailbox B + the Chat client | **Chat/mining SSE last hop only**. Never put overlay AES on a B-decryptable `l0_listen` / `l0_connect` |

| Actor | Responsibility |
| --- | --- |
| **Initiator** (`own_eoa < peer_eoa`) | Already `l0_listen` on `W_I`. Creates the overlay AES key and `sessionId`. Posts `duplex_offer` (key + `listenWallet: W_I` + `listenUserPgp`) to the peer **long-lived** user PGP |
| **Responder** | Ingests offer on **long-lived Chat** SSE. If it does not support duplex, `l0_connect` occupies `W_I` and the first AES blob is `duplex_reject`. If it agrees, `l0_listen` on `W_R`, `l0_connect` occupies `W_I`, first AES blob is `duplex_accept` (echo key + `W_R`). Initiator then `l0_connect` occupies `W_R` |
| **Mailbox B** | Decrypts `l0_listen` / `l0_connect` (route PGP). After occupy, **pipes** remaining TCP as SSE `data:` lines and stops parsing. Must not learn the overlay AES key |
| **Entries A / C** | Existing A/B/C posts and long SSE; SI-to-SI remains HTTP on port 80 |

Each request uses a healthy entry **different from B**. Occupancy of connect is by **`targetWallet` after decrypt**, not by B route key ID (do not 409 every B-route packet when one L0 listen is occupied — Chat / mining on the same node must continue).

## Encryption and route matrix

| Operation | Contains overlay AES key? | Encrypt to | Transport |
| --- | --- | --- | --- |
| `l0_listen` / `mining` + `listenKind: "l0"` | **No** | Own mailbox **B route PGP** | Long SSE via entry **C ≠ B**. Handshake `{ ok, kind:"l0", wallet, nodeWallet }` |
| `l0_connect` | **No** | **Target** mailbox **B route PGP** | First JSON `{ "data": armor }` on TCP, then extra `\n` + AES blobs. Idle → occupy + pipe. Occupied → **409** `{ error: "occupied" }` |
| `duplex_offer` | **Yes** | Peer **long-lived user PGP** | Entry A ≠ B. Ordinary Chat gossip so the peer's existing Chat SSE can see it |
| `duplex_accept` | **Yes** (echo) | AES on occupied `W_I` pipe | First AES blob after R occupies I’s L0 SSE |
| `duplex_reject` | No | AES on occupied `W_I` pipe | Occupying with reject is intended |
| Overlay IPv4 (`duplex_frame`) | AES outer only | Occupied peer L0 pipe | `payload` = standard base64 of raw `L0D1\|\|IPv4` (**not** a second AES, **not** PGP) |

The key rule is strict: overlay AES must **never** appear in a B-decryptable listen or `l0_connect` command. SI never parses `command: "duplex_offer"`.

After occupy, SI must **not** `response200Html` (that ends inbound TCP). Extra bytes after Content-Length are unshifted by `getDataPOST` and piped as SSE lines.

## Capability probe (application, not HTTP 404)

SI **404** is not the duplex probe. SI **409 occupied** means that L0 listen already has a pipe.

| Peer behaviour | Initiator |
| --- | --- |
| App never parses offer (old crate) | No accept, no reject. Keep **P1 gossip** |
| App parses offer and cannot attach | `l0_connect` + AES `duplex_reject` on `W_I` → P1 immediately |
| App parses offer and agrees | AES `duplex_accept` on `W_I`; initiator occupies `W_R` → AES `duplex_frame` |

HTTP 2xx on `duplex_offer` is **not** proof that the peer attached. An SSE handshake is transport, not duplex ready.

## How it works

```text
Both ends: long-lived Chat listen (channel EOA) — receives duplex_offer
Both ends: exclusive l0_listen on session wallet (crate MVP: channel EOA)

Initiator I (own_eoa < peer_eoa):
  1. sessionId = keccak256(utf8("l0d-duplex-v1|" || min(eoa_I,eoa_R) || "|" || max(...) || "|" || port_be16))
  2. generate 32-byte AES-256-GCM key (memory only)
  3. duplex_offer { Securitykey, listenWallet: W_I, listenUserPgp } → R long-lived user PGP → POST A ≠ B_R

If R never answers → overlay stays P1 gossip.

If R does not support this session:
  l0_connect target=W_I; first AES blob = duplex_reject
  I keeps P1 gossip

If R accepts:
  store overlay key; keep l0_listen W_R
  l0_connect target=W_I; first AES blob = duplex_accept { Securitykey echo, listenWallet: W_R }
  I sees accept on occupied W_I SSE → peer_attached; remembers W_R
  I l0_connect occupies W_R (no required first app JSON)

Data (both directions) — two occupied L0 pipes:
  I → R: AES( duplex_frame JSON ) on I’s l0_connect TCP to W_R
  R → I: AES( duplex_frame JSON ) on R’s l0_connect TCP to W_I
  duplex_frame.payload = standard base64( L0D1 || IPv4 )

conet-l0d sends AES duplex_frame only when it has the overlay key AND peer_attached AND an occupied pipe_tx AND not rejected.
Missing pipe keeps P1 gossip.
```

Initiator election for a given overlay port: `own_eoa < peer_eoa` (lowercase `0x` hex). Both ends compute the same `sessionId`.

A one-time session EOA must be `regiestChatRoute` on mailbox B **before** its L0 listen is useful. Until the daemon registers ephemeral wallets itself, the crate reuses the registered channel EOA.

## Canonical application fields

`duplex_offer` remains signed Chat gossip (user PGP):

```text
signMessage = personal_sign(message)
literal = base64(UTF8(JSON.stringify({ message, signMessage })))
armored = OpenPGP_encrypt(literal, target user PGP)
HTTP POST { "data": armored }
```

`duplex_offer` (encrypt to peer **long-lived** user PGP):

```json
{
  "command": "duplex_offer",
  "walletAddress": "<initiator EOA>",
  "peerWallet": "<responder routing EOA>",
  "listenWallet": "<initiator session listen EOA>",
  "listenUserPgp": "<armored OpenPGP public cert for listenWallet>",
  "sessionId": "<64 hex, no 0x>",
  "algorithm": "aes-256-gcm",
  "Securitykey": "<standard base64 of 32 bytes>",
  "timestamp": 1710000000
}
```

`duplex_accept` / `duplex_reject` / `duplex_frame` after occupy are **not** OpenPGP. Outer wire is standard base64 of `nonce(12) || AES-GCM(utf8(JSON)) || tag(16)`.

`duplex_accept` (must echo `Securitykey`):

```json
{
  "command": "duplex_accept",
  "walletAddress": "<responder EOA>",
  "listenWallet": "<responder session listen EOA>",
  "listenUserPgp": "<armored OpenPGP public cert for listenWallet>",
  "sessionId": "<64 hex, no 0x>",
  "algorithm": "aes-256-gcm",
  "Securitykey": "<same 32-byte key as the offer>",
  "timestamp": 1710000000
}
```

`duplex_reject` (must not contain `Securitykey`):

```json
{
  "command": "duplex_reject",
  "walletAddress": "<responder EOA>",
  "sessionId": "<64 hex, no 0x>",
  "reason": "unsupported",
  "timestamp": 1710000000
}
```

`duplex_frame`:

```json
{
  "type": "duplex_frame",
  "sessionId": "<64 hex>",
  "payload": "<standard base64 of L0D1||IPv4>"
}
```

SI occupy notice (not application JSON; ignore on the client):

```json
{ "type": "l0_occupied", "wallet": "<listen EOA>", "connector": "<connector EOA>" }
```

## Frame format and runtime bounds

| Item | Current rule |
| --- | --- |
| Overlay AES key | 32 bytes; standard base64 inside `duplex_offer` and echoed in `duplex_accept` |
| Data-plane payload | `base64(L0D1 \|\| IPv4)` inside `duplex_frame`; **one** AES layer around the JSON |
| Occupied pipe | Same TCP as `l0_connect` HTTP POST; extra lines after the first `{ "data" }` JSON |
| Capability miss | No answer **or** `duplex_reject` **or** no occupied pipe → keep P1 gossip. Not an SI HTTP 404 |
| L0 pool | `l0ListenPool` — **not** Chat / mining / UDP. Max 256. Idle gossip does not occupy |
| Chat / mining | Unchanged. Same EOA may hold Chat SSE and `l0_listen` |

A receive-only SSE socket can remain writable after its request body has ended. SI therefore does not classify `readableEnded` alone as stale. Peer `'end'` (half-close) must not drop the L0 pool. Do **not** inject mining epoch gossip onto an occupied L0 SSE. Do **not** share chat APNs / wall-clock expire with occupied L0.

## Guarantees and non-guarantees

If `duplex_offer` is encrypted to the peer user key, Chat listen omits the overlay AES key, and `l0_listen` / `l0_connect` omit it too, mailbox B can route and occupy without learning overlay plaintext or the AES key.

After occupy, SI pipes opaque lines. It does not provide raw TCP semantics, congestion control, or proof that geth consumed a datagram. SI HTTP 200 on Chat gossip means the entry accepted armor, not that the peer app attached. SI 409 on `l0_connect` means that listen is already taken.

It also does not hide a client's IP from its entry, defeat a global timing observer, or implement padding. Those are listed as upgrades in [security limits](security-limits.md).

## Implementation anchors

- Overlay AES + `L0D1` + offer / accept / reject / frame + occupied pipe: `src/conet-l0d/src/l0/{aes,frame,duplex,client,pipe,listen}.rs`
- SI exclusive pool: `src/CoNET-SI/src/util/l0Exclusive.ts` (`l0_listen` / `l0_connect`)
- Do not add `src/CoNET-SI/src/util/duplexForward.ts`
- Operator / crate: [Applications — conet-l0d](../applications/conet-l0d.md), [Developers — conet-l0d](../developers/conet-l0d.md)

## Related

- [UDP frame forwarding](udp-forward.md) — SI **does** implement `udp_*` (separate pools). Occupied L0 is a different exclusive pipe
- [Zero-trust mailbox routing](mailbox-routing.md)
- [SI developer guide](si-developer-guide.md) — `l0_listen` / `l0_connect` rows; **no** `duplex_*` command row
- [Security limits](security-limits.md)
