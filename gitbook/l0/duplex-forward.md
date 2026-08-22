# Duplex overlay (L0 occupancy pipe + application JSON)

Duplex is two layers:

1. **L0 (SI)** — exclusive occupancy pipe: `l0_listen` (or `mining` + `listenKind: "l0"`) plus `l0_connect`. After the first connect occupies an idle L0 SSE, SI writes **HTTP 200 keep-alive** on the occupy TCP (must **not** `socket.end()`), **stops idle comment keepalives** on that SSE, pipes remaining TCP bytes onto that SSE, and marks the channel occupied. A **second `l0_connect`** to that wallet is **409**. User-PGP Chat / mining gossip on the same node **must continue** (do not 409 those). Idle L0 SSE has no mining epoch heartbeat; SI must write SSE comment keepalives **only while idle** and clear the 60s socket idle timeout.
2. **Application (conet-l0d)** — `duplex_offer` / `duplex_accept` / `duplex_reject` / `duplex_frame`. Offer stays **user-PGP Chat gossip** so it cannot occupy the exclusive L0 listen. During socket bootstrap, accept is also signed user-PGP control addressed to the Initiator's temporary identity. Once both occupied pipes are ready, stream frames are **AES-256-GCM blobs** on those pipes.

SI does **not** implement `duplex_*` commands and does **not** maintain a duplex pool. Do **not** add `duplexForward.ts` or SI `duplex_*` cases. Do **not** document a live SI command named `p2p_stream_*` or `listenKind: "l1p2p"`. Do **not** send `command: "mining"` with `listenKind: "duplex"`.

Public site: [https://gitbook.conet.network/l0/duplex-forward.html](https://gitbook.conet.network/l0/duplex-forward.html)

**conet-l0d** is the first product that uses this composition for overlay `geth` / `beacon` IPv4.

**Current transport revision:** 2026-08-22 — per-socket temporary routes and
listen SSEs are ready-gated before control exchange; `firstChunk` /
`responseChunk` bootstrap occurs before either paused application socket is
resumed.

> **2026-08-20 protocol revision — supersedes the deterministic-session teardown
> text below.** New implementations must use a fresh random `pipe_handle` per
> pipe incarnation, temporary listen wallet/PGP identities, and hop-local SI
> handles. Do not derive a session value from wallets, ports, IPs, or route
> keys. Do not emit `l0_pipe_end` or `l0_listen_released` on an SSE. The
> normative teardown rules are in the section “Opaque attachment and teardown”
> below; the older deterministic-session examples are historical and are not
> compatible requirements.

## Opaque attachment and teardown (current)

The endpoint creates a temporary listen identity for this attachment and a
random 32-byte `pipe_handle`. The handle is shared only inside the encrypted
endpoint-to-endpoint handshake. Mailbox and entry SI components see only their
own local waiting-pool entry and local socket lifecycle. They must not correlate
handles between hops, reveal wallet/connector identities, or receive the
end-to-end AES key.

The only `l0_pipe_end` object accepted by `conet-l0d` is a line on the already
occupied `l0_connect` TCP:

```json
{
  "type": "l0_pipe_end",
  "pipe_handle": "<64 lowercase hex>",
  "reason": "transport_closed"
}
```

`wallet`, `connector`, `sessionId`, and `session_id` are forbidden. The line is
accepted only when its handle equals the handle bound to that TCP. Missing,
malformed, or mismatched handles are ignored/rejected. SSE input never parses
this object and there is no SSE-side same-name release event.

If SI detects that the downstream SSE disappeared before HTTP is committed, it
returns `410 Gone` with `error: "l0_peer_disconnected"` (or an equivalent
non-success transport response). After a keep-alive response is committed, a
second HTTP response is invalid, so SI closes the current TCP with FIN/RST.
The sender must inspect the `l0_connect` response head, stop its packet loop on
`410` or EOF, and reconnect only after clearing the dead pipe generation.
Reconnect uses a
bounded retry/backoff and occupancy limits; a listener cannot use an application
message to make another healthy sender emit packets.

The Rust implementation generates the handle with `duplex::new_pipe_handle()`
and validates it in `pipe::run_occupied_pipe`. `client::apply_inbound_armor`
does not process teardown objects from SSE. This is a transport safety rule,
not an application gossip event.

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

Idle L0 may receive a **copy** of user-PGP gossip (offers) without occupying. The Chat / mining pool **always** gets that gossip — do not deliver only to idle L0 (if that SSE dies, the initiator never sees `duplex_accept`). After occupy, a second **`l0_connect`** is 409. Never write JSON gossip onto an occupied raw-AES SSE, and never APNs / `saveLocal` onto that SSE. A replacement `l0_listen` while occupied is also 409 **if the occupy inbound TCP and listen SSE are still live** (do not tear down a live pipe). If inbound is destroyed or the SSE is stale, SI must `dropL0Listen` and accept the replacement so a restarted client is not stuck on 409 until mailbox B is pkill'd.

## What it is

Each duplex session uses **two keys**. Do not mix them.

| Key | Who holds it | Purpose |
| --- | --- | --- |
| Overlay e2e AES-256-GCM | **Both l0d (or app) ends only** | Seal application JSON (`duplex_accept` / `duplex_reject` / `duplex_frame`). Mailbox **B must not** hold it |
| Chat listen `Securitykey` | Mailbox B + the Chat client | **Chat/mining SSE last hop only**. Never put overlay AES on a B-decryptable `l0_listen` / `l0_connect` |

| Actor | Responsibility |
| --- | --- |
| **Initiator** | Creates a fresh temporary listen wallet/PGP identity, a random opaque `pipe_handle`, and the overlay AES key. The encrypted endpoint handshake carries these values; none is derived from the public wallet or port |
| **Responder** | Uses only a temporary listen identity pre-allocated by an explicit `mainWallet:port` new-line request, then accepts or rejects on the occupied TCP. It never allocates a line merely because an offer arrived |
| **Mailbox B** | Decrypts `l0_listen` / `l0_connect` (route PGP). After occupy, **pipes** remaining TCP as SSE `data:` lines and stops parsing. Must not learn the overlay AES key |
| **Entries A / C** | Existing A/B/C posts and long SSE; SI-to-SI remains HTTP on port 80 |

Each request uses a healthy entry **different from B**. Occupancy of connect is by **`targetWallet` after decrypt**, not by B route key ID (do not 409 every B-route packet when one L0 listen is occupied — Chat / mining on the same node must continue).

## Encryption and route matrix

| Operation | Contains overlay AES key? | Encrypt to | Transport |
| --- | --- | --- | --- |
| `l0_listen` / `mining` + `listenKind: "l0"` | **No** | Own mailbox **B route PGP** | Long SSE via entry **C ≠ B**. Handshake `{ ok, kind:"l0", wallet, nodeWallet }` |
| `l0_connect` | **No** | **Target** mailbox **B route PGP** | First JSON `{ "data": armor }` on TCP. Idle → occupy, write HTTP **200** keep-alive (no `end()`), then extra `\n` + AES blobs. Second connect → **409**. Connector installs `pipe_tx` only after that 200. |
| `duplex_offer` | **Yes** | Peer **long-lived user PGP** | Entry A ≠ B. Ordinary Chat gossip so the peer's existing Chat SSE can see it |
| `duplex_accept` | **Yes** (echo) | AES on occupied `W_I` pipe | First AES blob after R occupies I’s L0 SSE |
| `duplex_reject` | No | AES on occupied `W_I` pipe | Occupying with reject is intended |
| Overlay IPv4 (`duplex_frame`) | AES outer only | Occupied peer L0 pipe | `payload` = standard base64 of raw `L0D1\|\|IPv4` (**not** a second AES, **not** PGP) |

The key rule is strict: overlay AES must **never** appear in a B-decryptable listen or `l0_connect` command. SI never parses `command: "duplex_offer"`.

After occupy, SI must **not** `response200Html` (that ends inbound TCP). Extra bytes after Content-Length are unshifted by `getDataPOST` and piped as SSE lines.

### Offer matching is attach-only

Temporary line creation is a control-plane operation owned by the explicit
`mainWallet:port` new-line request. The responder must first find a
pre-registered session by exact opaque `pipe_handle` or temporary
`listenWallet`. A `mainWallet:port` match alone is insufficient. Replayed,
stale, or ambiguous offers are rejected without allocating a wallet, creating
a `DuplexSession`, or issuing another `l0_connect`. This keeps one local socket
handle mapped to one duplex line and avoids SI `409 Conflict` loops.

## Capability probe (application, not HTTP 404)

SI **404** is not the duplex probe (usually no idle listen). SI **409 occupied** on **`l0_connect`** means that L0 listen already has a pipe. SI **409** on Chat gossip after occupy is a bug.

| Peer behaviour | Initiator |
| --- | --- |
| App never parses offer (old crate) | No accept, no reject. Keep **P1 gossip** |
| App parses offer and cannot attach | `l0_connect` + AES `duplex_reject` on `W_I` → P1 immediately |
| App parses offer and agrees | AES `duplex_accept` on `W_I`; initiator occupies `W_R` → AES `duplex_frame` |

HTTP 2xx on `duplex_offer` is **not** proof that the peer attached. An SSE handshake is transport, not duplex ready.

## Historical deterministic flow (retired; reference only)

The following section is retained only to explain older lab traces. It is not a
current implementation requirement and must not be copied into new clients.

## How it worked

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
Missing pipe keeps P1 gossip until the pipe is rebuilt — not forever after a transient occupy failure.
```

Initiator election for a given overlay port: `own_eoa < peer_eoa` (lowercase `0x` hex). Both ends compute the same `sessionId`.

### Pipe durability (normative)

| Layer | Rule |
| --- | --- |
| Entry `socketForward` | Clear **client→C** `sourceSocket` 60s idle **and** do not 60s-kill **C→B** long pipes (SSE / occupied L0). See [Peel, hop-sig, and listen timeouts](peel-hop-listen.md). |
| SI idle `l0_listen` | SSE comment keepalive (~15s, `\r\n\r\n`) + `setTimeout(0)` on the listen socket. **Occupied** L0 must **clear** that timer and never write comments (AES `data:` keeps the socket). Occupied inbound + SSE use a **180s inactivity watchdog** above the conet-l0d ping cadence; a timeout releases the occupy and destroys both sockets. |
| SI occupy HTTP | After attaching the inbound `data` handler, write HTTP 200 keep-alive headers. Never `response200Html` (it `end()`s the TCP). |
| conet-l0d | Install outbound `pipe_tx` only after occupy HTTP 200. For a configured duplex session, TUN frames before 200 are suppressed, not sent through P1 fallback and not installed on a dead pipe. |
| conet-l0d | After exclusive `l0_listen` SSE reconnects successfully, **rebuild** outbound `l0_connect` for duplex sessions that already have `peer_attached`. Do **not** only clear `pipe_tx` and stay on P1. |
| conet-l0d | If `l0_connect` / occupy fails (e.g. peer listen not idle yet), **retry** with a short delay while `peer_attached` remains true. |

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

`duplex_accept` / `duplex_reject` / `duplex_frame` after occupy are **not** OpenPGP. Outer wire is standard base64 of `nonce(12) || AES-GCM(utf8(JSON)) || tag(16)`. Occupied-pipe AES `duplex_accept` may omit `listenUserPgp` (empty string); the initiator already has the overlay key from the offer. Chat-gossip `duplex_accept` still includes the armored listen cert. SSE AES `data:` frames complete on `\r\n\r\n` only so an idle comment `\n\n` cannot truncate a half-received blob.

`duplex_accept` (must echo `Securitykey`):

```json
{
  "command": "duplex_accept",
  "walletAddress": "<responder EOA>",
  "listenWallet": "<responder session listen EOA>",
  "listenUserPgp": "<Chat: armored OpenPGP public cert. Occupied-pipe AES accept may be empty>",
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

### Pipe teardown (current)

The deterministic-session teardown is retired. Each pipe incarnation uses a
temporary listen identity and a fresh random opaque `pipe_handle`. It is never
derived from wallet, connector, port, IP, or route data.

There is no SSE-side `l0_pipe_end` or `l0_listen_released` event. The only
accepted control line is on the occupied inbound TCP already bound to the same
handle:

```json
{
  "type": "l0_pipe_end",
  "pipe_handle": "<64 lowercase hex>",
  "reason": "transport_closed"
}
```

`wallet`, `connector`, `sessionId`, and `session_id` are forbidden. Missing,
malformed, or mismatched handles are rejected. The Rust client validates this
in `run_occupied_pipe`; SSE ingestion deliberately does not parse the object.

If an entry detects that the downstream SSE has disappeared before keep-alive
is committed, it returns `410 Gone` or an equivalent transport error. After
keep-alive, it closes the current TCP with FIN/RST. The sender stops its packet
loop and reconnects only through bounded retry/backoff. SI may propagate the
failure internally with local opaque handles, but never exposes cross-hop
correlation or the AES key.

### Occupied-pipe liveness timeout

The sender owns the liveness obligation: it must send application data within
each 120-second window. When there is no IPv4 frame, the crate sends an
encrypted `duplex_ping` application blob every 60 seconds. The listener
counts inbound bytes, so any valid application blob satisfies the window.

If the exclusive L0 listener receives no bytes for 180 seconds, SI closes its
SSE and releases the occupied writer. The peer observes EOF and stops using
that pipe incarnation. An `end` on the occupied inbound TCP is also an
immediate teardown signal. After its own listen SSE has ended and a replacement
SSE is established, a bidirectional client may issue a new `l0_connect` with a
fresh `pipe_handle`. It must not reuse stale `pipe_tx` state. Normal Chat SSE
is excluded and retains mailbox heartbeat semantics.

## Frame format and runtime bounds

| Item | Current rule |
| --- | --- |
| Overlay AES key | 32 bytes; standard base64 inside `duplex_offer` and echoed in `duplex_accept` |
| Data-plane payload | `base64(L0D1 \|\| IPv4)` inside `duplex_frame`; **one** AES layer around the JSON |
| Occupied pipe | Same TCP as `l0_connect` HTTP POST; extra lines after the first `{ "data" }` JSON |
| Capability miss | No answer **or** `duplex_reject` **or** no occupied pipe → keep P1 gossip. Not an SI HTTP 404 |
| L0 pool | `l0ListenPool` — **not** Chat / mining / UDP. Max 256. Idle gossip does not occupy |
| Chat / mining | Unchanged. Same EOA may hold Chat SSE and `l0_listen`; Chat is excluded from the L0 timeout |

## Socket-scoped bootstrap

For `--clientDuplex`, each local TCP accept event is the unique session
handle. The client reads the initial application bytes and places them in
`duplex_offer.firstChunk` before creating that line's temporary wallet/PGP.
The proxy allocates a line only after an explicit `mainWallet:port` match to
its configured `--proxyDuplex` port. It opens the configured upstream TCP
client, forwards `firstChunk`, and returns the first upstream bytes as
`duplex_accept.responseChunk`. Later bytes reuse the same opaque
`pipe_handle`; unmatched offers cannot allocate temporary lines.

A receive-only SSE socket can remain writable after its request body has ended. SI therefore does not classify `readableEnded` alone as stale. Peer `'end'` on a mining or Chat SSE must not drop those pools; an `end` on the occupied L0 inbound TCP is different and releases that L0 pipe. Do **not** inject mining epoch gossip onto an occupied L0 SSE. Do **not** share chat APNs / wall-clock expire with occupied L0.

## Guarantees and non-guarantees

If `duplex_offer` is encrypted to the peer user key, Chat listen omits the overlay AES key, and `l0_listen` / `l0_connect` omit it too, mailbox B can route and occupy without learning overlay plaintext or the AES key.

After occupy, SI pipes opaque lines. It does not provide raw TCP semantics, congestion control, or proof that geth consumed a datagram. SI HTTP 200 on Chat gossip means the entry accepted armor, not that the peer app attached. SI HTTP 200 on occupy TCP means the connector may write the first AES blob. SI 409 on `l0_connect` means that listen is already taken. Bytes arriving after an occupied peer SSE is released are discarded; they are never saved offline or rerouted to Chat/mining gossip.

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
