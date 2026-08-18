# Duplex overlay (application composition)

Duplex is an **application composition** of Layer Minus: two **conet-l0d** (or equivalent) clients open **two dedicated Chat SSEs** for one overlay session, then exchange AES-256-GCM overlay frames. SI does **not** implement `duplex_*` commands and does **not** maintain a duplex pool. L0 only forwards OpenPGP ciphertext by wallet / key ID — see [How to use Layer Minus](using-l0.md). It does not create a raw TCP socket to mailbox B and does not change the [TCP/IP underlay](tcp-ip.md).

Public site: [https://gitbook.conet.network/l0/duplex-forward.html](https://gitbook.conet.network/l0/duplex-forward.html)

**conet-l0d** is the first product that uses this composition for overlay `geth` / `beacon` IPv4. Other clients may reuse the same **application JSON** on Chat gossip. Do **not** add `duplexForward.ts` or SI `duplex_*` cases for this product.

Do **not** document a live SI command named `p2p_stream_*` or `listenKind: "l1p2p"`. Do **not** send `command: "mining"` with `listenKind: "duplex"` — that is not a duplex probe, and old SI would classify it as mining.

## Why two own listens (not a guest SSE)

Chat listen is **one wallet, one socket**. A client must not attach a second Chat SSE for someone else's routing EOA on their mailbox B. Each end therefore **owns** one session listen wallet and one Chat SSE (`command: "mining"`, `listenKind: "chat"`). Cross traffic is user-PGP gossip into the peer's session mailbox — not SI `duplex_listen`.

App-layer names:

| Name | Meaning | SI |
| --- | --- | --- |
| Long-lived channel listen | Per overlay port `[[l0.channels]]` routing EOA. Receives **`duplex_offer` only** | Existing Chat SSE |
| Session listen (`duplex_server_listen`) | One-time routing EOA for **this** duplex session. Receives accept / reject / `duplex_frame` | Same Chat command. **Not** an SI command |
| Guest listen on peer B | Forbidden | Would need a second socket on the peer wallet |

**conet-l0d crate MVP** uses the already-registered per-port channel EOA as the session listen identity (it already holds the Chat SSE). The wire still names `listenWallet` / `listenUserPgp` so a later cut can mint a fresh EOA, `regiestChatRoute` it onto the same mailbox B, and spawn a second Chat SSE without changing SI.

## What it is

Each duplex session uses **two keys**. Do not mix them.

| Key | Who holds it | Purpose |
| --- | --- | --- |
| Overlay e2e AES-256-GCM | **Both l0d (or app) ends only** | `L0D1` \|\| IPv4 (or other application bytes). Mailbox **B must not** hold it |
| Chat listen `Securitykey` | Mailbox B + the Chat client | **Last hop of existing chat/mining SSE only**. Offer / accept / reject / AES frames must **not** go in a B-decryptable listen command |

| Actor | Responsibility |
| --- | --- |
| **Initiator** (`own_eoa < peer_eoa`) | Already listening on the session listen wallet. Creates the overlay AES key and `sessionId`. Posts `duplex_offer` (key + session `listenWallet` + `listenUserPgp`) to the peer **long-lived** user PGP |
| **Responder** | Ingests offer on **long-lived** Chat SSE. If it does not support duplex, posts `duplex_reject` to the initiator **session** listen user PGP. If it agrees, starts (or already holds) its own session listen SSE, then posts `duplex_accept` (echo AES key + own `listenWallet` + `listenUserPgp`) to the initiator session listen user PGP |
| **Mailbox B** | Existing Chat mailbox: stores and SSE-forwards **user-PGP** armor. Must not learn the overlay AES key |
| **Entries A / C** | Existing A/B/C posts and long Chat SSE; SI-to-SI remains HTTP on port 80 |

Each request uses a healthy entry **different from B**. The selected entry sees its direct client's IP; B sees the forwarding entry rather than a direct client connection.

## Encryption and route matrix

| Operation | Contains overlay AES key? | Encrypt to | Transport |
| --- | --- | --- | --- |
| `duplex_offer` | **Yes** | Peer **long-lived user PGP** | Entry A ≠ B. Ordinary Chat gossip so the peer's existing SSE can see it |
| `duplex_accept` | **Yes** (echo) | Initiator **session listen user PGP** | Entry A ≠ B. Lands on the initiator's session Chat SSE |
| `duplex_reject` | No | Initiator **session listen user PGP** | Entry A ≠ B. Lands on the initiator's session Chat SSE |
| Overlay IPv4 (`duplex_frame` JSON) | No; AES payload only | Peer **session listen user PGP**, then mailbox-work wrap `{ data, NoPush: true }` to **that wallet's B route PGP** | Entry A ≠ B. Same `{ "data" }` HTTP body as P1 gossip |
| Session / channel listen | No | **Own B route PGP** | Existing `mining` + `listenKind: "chat"` SSE via C ≠ B |

The key rule is strict: `duplex_offer` / `duplex_accept` are **user-PGP business messages**. If B can decrypt them, the client used the wrong key. SI never parses `command: "duplex_offer"`; it only routes Chat gossip by recipient key ID.

## Capability probe (application, not HTTP 404)

SI **404** is not the duplex probe.

| Peer behaviour | Initiator |
| --- | --- |
| App never parses offer (old crate) | No accept, no reject. Keep **P1 gossip** |
| App parses offer and cannot attach | `duplex_reject` on the initiator session SSE → P1 immediately |
| App parses offer and agrees | `duplex_accept` (key echo + responder session listen) on the initiator session SSE → AES `duplex_frame` |

HTTP 2xx on `duplex_offer` is **not** proof that the peer attached. An SSE handshake is Chat transport, not duplex ready.

## How it works

```text
Both ends: long-lived Chat listen (channel EOA) — receives duplex_offer
Initiator I also listens on session listen wallet W_I (crate MVP: W_I = channel EOA)

Initiator I (own_eoa < peer_eoa):
  1. sessionId = keccak256(utf8("l0d-duplex-v1|" || min(eoa_I,eoa_R) || "|" || max(...) || "|" || port_be16))
  2. generate 32-byte AES-256-GCM key (memory only)
  3. duplex_offer { Securitykey, listenWallet: W_I, listenUserPgp } → R long-lived user PGP → POST A ≠ B_R

If R never answers → overlay stays P1 gossip.

If R does not support this session:
  duplex_reject → encrypt to W_I user PGP → I session SSE
  I keeps P1 gossip

If R accepts:
  store overlay key; start / keep session listen W_R
  duplex_accept { Securitykey echo, listenWallet: W_R, listenUserPgp } → W_I user PGP
  I sees accept on W_I SSE → peer_attached; remembers W_R

Data (both directions) — two dedicated Chat SSEs:
  I → R: duplex_frame → W_R user PGP → wrap to B_R
  R → I: duplex_frame → W_I user PGP → wrap to B_I
  payload = standard base64( nonce(12) || AES-GCM( L0D1 || IPv4 ) || tag(16) )

conet-l0d sends AES duplex_frame only when it has the overlay key AND peer_attached AND not rejected.
```

Initiator election for a given overlay port: `own_eoa < peer_eoa` (lowercase `0x` hex). Both ends compute the same `sessionId`.

A one-time session EOA must be `regiestChatRoute` on mailbox B **before** its Chat listen is useful. Until the daemon registers ephemeral wallets itself, the crate reuses the registered channel EOA.

## Canonical application fields

Application JSON is **not** an SI command table. Offer / accept / reject use the signed Chat gossip wrapper:

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

`duplex_accept` (encrypt to initiator **session** listen user PGP; **must** echo `Securitykey`):

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

`duplex_reject` (encrypt to initiator **session** listen user PGP; **must not** contain `Securitykey`):

```json
{
  "command": "duplex_reject",
  "walletAddress": "<responder EOA>",
  "sessionId": "<64 hex, no 0x>",
  "reason": "unsupported",
  "timestamp": 1710000000
}
```

`duplex_frame` (inner plaintext after user-PGP decrypt; then mailbox wrap):

```json
{
  "type": "duplex_frame",
  "sessionId": "<64 hex>",
  "payload": "<standard base64 AES-GCM>"
}
```

## Frame format and runtime bounds

| Item | Current rule |
| --- | --- |
| Overlay AES key | 32 bytes; standard base64 inside `duplex_offer` and echoed in `duplex_accept` |
| Payload | `base64(nonce[12] \|\| ciphertext \|\| tag[16])` of `L0D1` + version + seq + raw IPv4 |
| Transport | Chat gossip + mailbox-work wrap; HTTP `{ "data" }` only |
| Capability miss | No answer **or** `duplex_reject` → keep P1 gossip. Not an SI HTTP 404 |
| Pool | **None.** Chat / mining / UDP pools are unchanged |

A receive-only Chat SSE socket can remain writable after its request body has ended. SI therefore does not classify `readableEnded` alone as stale. Peer `'end'` (half-close) must not drop the chat pool. That rule is existing Chat listen, not a duplex pool.

## Guarantees and non-guarantees

If `duplex_offer` is encrypted to the peer user key and Chat listen omits the overlay AES key, mailbox B can store and SSE-forward gossip without learning overlay plaintext or the AES key.

The composition does not provide raw TCP semantics, congestion control, or proof that geth consumed a datagram. SI HTTP 200 on Chat gossip means the entry accepted armor, not that the peer app attached.

Mailbox B still sees Chat-session metadata: timing, size, and that a user-PGP message arrived. It must not see `duplex_frame` plaintext or the overlay AES key.

It also does not hide a client's IP from its entry, defeat a global timing observer, or implement padding. Those are listed as upgrades in [security limits](security-limits.md).

## Implementation anchors

- Overlay AES + `L0D1` + offer / accept / reject / frame workers: `src/conet-l0d/src/l0/{aes,frame,duplex,client}.rs`
- Existing Chat listen (session + channel SSE): `src/conet-l0d/src/l0/listen.rs` (`mining` + `listenKind: "chat"`)
- SI: **no** `duplex_*` dispatch. Do not add `src/CoNET-SI/src/util/duplexForward.ts`
- Operator / crate: [Applications — conet-l0d](../applications/conet-l0d.md), [Developers — conet-l0d](../developers/conet-l0d.md)

## Related

- [UDP frame forwarding](udp-forward.md) — SI **does** implement `udp_*` (separate pools). Duplex does **not** copy that pattern
- [Zero-trust mailbox routing](mailbox-routing.md)
- [SI developer guide](si-developer-guide.md) — Chat gossip and listen only; no duplex command row
- [Security limits](security-limits.md)
