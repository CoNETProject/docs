# conet-l0d (L1 overlay & Web3 Enterprise Gateway)

> **Current transport revision (2026-08-20):** the old deterministic
> wallet/port `sessionId` and SSE teardown notices are retired. New code uses
> temporary listen identities and a fresh random opaque `pipe_handle` per
> occupied TCP. `l0_pipe_end` is valid only on that already-bound TCP; it must
> contain only `pipe_handle` and `reason`. SSE must not parse or emit it.

**Evidence level: Under development.** The CLI, config, TUN/iptables lifecycle, and locator grammar are implemented in-crate for the **L1 overlay** path. Overlay TCP over live Layer Minus prefers SI **`l0_listen` / `l0_connect`** occupancy plus application duplex. P1 gossip remains the fallback if the peer app never sends `duplex_accept` or the occupied pipe is missing. There is **no** production SI command named `duplex_*` or `p2p_stream_*` in this revision. `l0_listen` / `l0_connect` **are** current SI.

The **CoNET Web3 Enterprise Gateway** product role (host existing Web/API behind a wallet identity) and the [Web3 Application Protocol](../l0/web3-application-protocol.md) draft are **destination** documentation on the Applications page — not a claim that hosting v1 is shipped.

Public site: [https://gitbook.conet.network/developers/conet-l0d.html](https://gitbook.conet.network/developers/conet-l0d.html)

Operator how-to (both roles): [Applications — conet-l0d](../applications/conet-l0d.md)  
Application protocol draft: [CoNET Web3 Application Protocol](../l0/web3-application-protocol.md)  
L1 ports and public bootnodes: [Run an L1 node](l1-node.md)  
Forwarding plane: [L0 development](l0.md) · [How to use Layer Minus](../l0/using-l0.md)

Whitepaper / `RULES.md` revision **2026-08-18** (application duplex on Chat gossip + P1 gossip when the peer app does not accept; optional per-port `[[l0.channels]]` listen SSE; authorized L0_ONLY `.45` advertises overlay vIP; overlay geth + beacon TCP proven; after the batching binary the limiter is Prysm initial-sync at ~3.2 blocks/s; EL still `0x0`; lab overlay UDP + live discv5 via L0 accepted; DHT drop recovery = flush ghost conntrack first; authorized `.45` `restart-beacon` after dial backoff; **2026-08-20** lab-only static overlay `--peer` after authorized hub-then-spoke `restart-beacon` proves CL catch-up (`head_slot`↑ / `sync_distance`↓); re-apply listen-DNAT not steer; prove geth via `geth.pid`; `ss` public `:4200` is DNAT dest, not a leak; not a production discv5 product; operator watch `scripts/watch-l0-follow.sh`). A change to those files must update **this page and the Applications page** in the same task. Duplex application JSON lives on [duplex-forward](../l0/duplex-forward.md); SI command tables must **not** list `duplex_*`. Do not document `p2p_stream_*` as current SI.

## What you build

An independent Linux binary ([CoNET-project/CoNET-L0D](https://github.com/CoNET-project/CoNET-L0D)). Do not `../..` import SilentPassUI, CoNET-SI, or x402sdk.

```bash
git clone https://github.com/CoNET-project/CoNET-L0D.git
cd CoNET-L0D
cargo test
cargo build --release
# target/release/conet-l0d
```

| Command | OS | Privilege |
| --- | --- | --- |
| `check-config` | Any | None |
| `resolve <uri>` | Any | None |
| `status` | Any | Reads the state file |
| `start` | Linux | `CAP_NET_ADMIN`, `ip`, `iptables` |
| `gateway` | Linux / server | No TUN or iptables privilege; reads configured key files |
| `stop` | Linux | Same; signals the pid in the state file |
| `teardown` | Linux | Same; works if the daemon is already dead |

```bash
conet-l0d check-config --config config/conet-l0d.example.toml
conet-l0d resolve 'web3://0x1111111111111111111111111111111111111111/p2p/geth'
conet-l0d resolve 'web3://CoNET.web3/p2p/geth'   # exact tag; CoNET ≠ CONET
conet-l0d status --config /etc/conet-l0d.toml
sudo conet-l0d start --config /etc/conet-l0d.toml
conet-l0d gateway --config /etc/conet-l0d-gateway.toml
sudo conet-l0d stop --config /etc/conet-l0d.toml
sudo conet-l0d teardown --config /etc/conet-l0d.toml
```

The daemon **owns** TUN and iptables. Do not ship a second operator `iptables` script.

### Gateway mode

`conet-l0d gateway` is an application mode for publishing a loopback HTTP
origin through the existing mailbox A/B/C protocol. It does **not** create a
TUN, install routes, or modify iptables.

```toml
[gateway]
rpc = "https://rpc1.conet.network"
upstream = "http://127.0.0.1:8080"
listen_entries = ["https://<existing-entry-c>.conet.network"]
post_entries = ["https://<existing-entry-a>.conet.network"]
routing_eoa = "0x<gateway-eoa>"
routing_key_file = "/etc/conet-web3-gateway/secrets/gateway-pgp.asc"
routing_eth_key_file = "/etc/conet-web3-gateway/secrets/gateway.eth"
mailbox_route_pgp_file = "/etc/conet-web3-gateway/secrets/mailbox-route.asc"
allowed_methods = ["GET", "HEAD"]
max_body_bytes = 8388608
request_timeout_seconds = 15
```

The gateway listens to a `mining` command with `listenKind: "chat"` encrypted
to its mailbox route. Each inbound user-PGP message must be a signed
`conet_web3_request_v1` request addressed to `routing_eoa`. The gateway
forwards only GET/HEAD (by default) to the loopback `upstream`, limits request
and response bodies, and forwards a small header allowlist. It then encrypts
`conet_web3_response_v1` to the requesting EOA's registered user PGP key and
POSTs it to the requester's mailbox through `post_entries`.

Private keys are file-only inputs and must not be command-line arguments,
environment values, logs, or repository files. The upstream validator rejects
non-loopback origins to avoid turning the mode into an SSRF proxy. A response
is delivered through the requester's mailbox SSE; the gateway's inbound SSE is
receive-only and is never used as a bidirectional HTTP stream.

#### Verified deployment and real fetch (2026-08-20)

The Linux binary was built on the target host and installed as
`conet-l0d-gateway.service` on `conet.network`. The loopback origin adapter is
managed separately as `conet-web3-origin-proxy.service` and proxies
`https://conet.network` to `http://127.0.0.1:8080`. Both units were verified
active.

The acceptance client generated a temporary requester EOA and PGP identity,
registered its route through the real AddressPGP API, submitted through a real
Entry, and fetched:

```text
web3://0xA8386335F1a8C6Fab3798F36cd4F663Ce7bF5A53/
```

The returned response was `200 text/html`, and the SHA-256 digest was exactly
equal to the direct `https://conet.network/` response. This is deployment
evidence for the current gateway path, not a claim that the gateway binds
mailbox port 80 directly or that production multi-Guardian hosting is
complete.

| Crate path | Role |
| --- | --- |
| `config/conet-l0d.example.toml` | Example overlay table |
| `systemd/conet-l0d.service` | `ExecStart=start` / `ExecStop=stop`; `CAP_NET_ADMIN`; no raw iptables |
| `systemd/conet-l0d-gateway.service` | Optional gateway-only unit; no `CAP_NET_ADMIN`, TUN, or iptables |
| `whitepaper/` | Design pair (EN + zh-CN), revision **2026-08-18** |
| `docs/MVP.md` | Accepted crate MVP |
| `docs/P1.md` | Overlay `/post`: application duplex preferred, P1 gossip if the peer app never sends `duplex_accept`; inbound decrypt + TUN write-back; listen workers; optional `[[l0.channels]]`; `[l0]` default off; authorized lab may enable `[l0]`; 2026-08-18: `.45` advertises overlay vIP; overlay geth + beacon TCP; CL initial-sync in progress |
| `docs/P2.md` | Lab overlay UDP / DHT-port comms (echo + `:4300` + public-ENR steer + live discv5 via L0). `L0_DHT` allowlist = overlay then hub `/32` (one CIDR per `--p2p-allowlist`, last wins). Steer DNATs hub ports onto overlay. With a bootstrap ENR, drop overlay `--peer`. If `connected` drops, `overlay-dht-steer.sh apply` first (flush ghost conntrack; no EL/CL restart). Authorized `.45` `restart-beacon` only after dial backoff; do not re-apply steer immediately after start. After DNAT, `.45` `ss` may show hub public `:4200` (original dest, not a leak). First-minute `suitable=0` is expected. **2026-08-19:** if `:4200` `l0_connect` returns HTTP **409** after SI churn, clear mailbox **B** occupy then bounce hub→spoke `conet-l0d` before `restart-beacon`. Not a closed P2 / production product |
| `RULES.md` | Engineering constraints + GitBook lockstep |

L1 join + overlay deploy checklist (English): [Run an L1 node](l1-node.md#optional-overlay-p2p-conet-l0d) (includes beacon `connected=0` recovery). Operator troubleshooting: [Applications — L1 overlay daemon](../applications/conet-l0d.md#troubleshooting-beacon-connected0-while-overlay-syncing).

## Config shape

```toml
tun_name = "conet-l0"
overlay_cidr = "100.64.0.0/10"
local_vip = "100.64.0.5"
iptables_chain = "CONET_L0D"
state_path = "/run/conet-l0d/state.json"
# optional: never capture this uid
# validator_uid = 998

[identity]
locator = "web3://0x1111111111111111111111111111111111111111/p2p/geth"

[[peers]]
locator = "web3://HubTag.web3/p2p/geth"
vip = "100.64.0.1"
tcp_ports = [8400]

[[peers]]
locator = "web3://HubTag.web3/p2p/beacon"
vip = "100.64.0.1"
tcp_ports = [4200]
# udp_ports = [4300]

# Optional P1 client. Default off. Do not POST plaintext as data.
# Encrypt to peer user PGP, wrap { data, NoPush: true } to B route PGP,
# POST only { "data": outerArmor }. Inbound decrypt + TUN write-back is
# in-crate when routing_key_file is an OpenPGP secret cert. Listen HTTP+SSE
# is in-crate when enabled plus listen_entries, mailbox_route_pgp_file
# (this host's B route PUBLIC key), routing_eoa, routing_key_file, and
# routing_eth_key_file (hex secp256k1; must match routing_eoa; not OpenPGP).
# Optional [[l0.channels]]: one routing EOA + SSE per overlay port
# (8400 / 4200 / 4300). Encrypt to the peer user PGP for that port.
# Classify return-path TCP by source port. :4300 is overlay IPv4, not
# udp_relay. listenKind stays "chat". Empty channels keep one EOA.
# Listen is EIP-191 + SI { message, signMessage } base64. Listen ingest
# matches SI gossip JSON { "data": "<armor>" } (Chat handleInbound). Tests
# use wiremock only. Do not put Securitykey in a B-decryptable listen command.
# [l0]
# enabled = false
# rpc = "https://rpc1.conet.network"
# address_pgp = "0x684b0ac760cEE9c9b85de36d69746420648Cf9e2"
# entries = ["https://<existing-guardian>.conet.network"]
# listen_entries = ["https://<existing-guardian>.conet.network"]
# routing_eoa = "0x<dedicated-routing-eoa>"
# routing_key_file = "/etc/conet-l0d/routing.key"
# routing_eth_key_file = "/etc/conet-l0d/routing.eth"
# mailbox_route_pgp_file = "/etc/conet-l0d/self-mailbox-route.asc"
#
# [[l0.channels]]
# ports = [8400]
# routing_eoa = "0x<geth-routing-eoa>"
# routing_key_file = "/etc/conet-l0d/geth.key"
# routing_eth_key_file = "/etc/conet-l0d/geth.eth"
# mailbox_route_pgp_file = "/etc/conet-l0d/geth-mailbox-route.asc"
# listen_entries = ["https://<existing-guardian>.conet.network"]
#
# Per-peer public key files (lab override; do not log contents):
# user_pgp_file = "/etc/conet-l0d/peer-user.asc"
# route_pgp_file = "/etc/conet-l0d/peer-route.asc"
```

`web3://` is a **peer locator**, not ERC-4804 content.

```text
web3://<host>/p2p/<service>
host    = 0x + 40 hex | <exactBeamioTag>.web3
service = geth | beacon
```

Exact tag match only (`CoNET` ≠ `CONET`). Never `search-users` `results[0]`. AA without AddressPGP is not a destination. AddressPGP: [`0x684b0ac760cEE9c9b85de36d69746420648Cf9e2`](https://mainnet.conet.network/address/0x684b0ac760cEE9c9b85de36d69746420648Cf9e2).

## Net objects the process installs

On `start` (dirty state is torn down first):

1. TUN `conet-l0`.
2. `ip addr add <local_vip>/32 dev conet-l0`.
3. `ip route add 100.64.0.0/10 dev conet-l0`.
4. iptables tables `filter` and `mangle`, chain `CONET_L0D`.
5. First rules: `-d 127.0.0.0/8 -j RETURN`, `-s 127.0.0.0/8 -j RETURN`; optional `-m owner --uid-owner <validator_uid> -j RETURN`.
6. Insert jumps `OUTPUT` / `PREROUTING` → `CONET_L0D` only if missing.
7. Write `state_path` (pid, tun, cidr, chain).

On `stop` / signal / `teardown`:

1. `-D` those jumps if present.
2. `-F` and `-X` `CONET_L0D`.
3. Delete overlay route, address, TUN.
4. Remove the state file.

Do not `RETURN` only in documentation and then REDIRECT `0.0.0.0/0:8400` in code.

`CONET_L0D` is a **safety fence** (loopback + optional validator uid `RETURN`). Catch is the overlay **route** into TUN, not a public-P2P `REDIRECT`.

## systemd

Use the crate unit. Do not add `ExecStartPre=iptables …`.

```ini
[Service]
Type=simple
ExecStart=/usr/local/sbin/conet-l0d start --config /etc/conet-l0d.toml
ExecStop=/usr/local/sbin/conet-l0d stop --config /etc/conet-l0d.toml
AmbientCapabilities=CAP_NET_ADMIN
CapabilityBoundingSet=CAP_NET_ADMIN
```

## Client flags (advertise, do not bind overlay)

Toml locators are **wallet-addressed** (`web3://<EOA>/p2p/beacon` / `/p2p/geth`). Geth and Prysm stay unmodified, so they dial overlay VIPs that TUN already maps into L0. **Do not** put the hub **public** IP in Prysm `--peer` or in the overlay geth enode. Spoke beacon:

```text
--p2p-allowlist=100.64.0.0/10 --no-discovery
--peer=/ip4/<hub-vip>/tcp/4200/p2p/<hub-live-peer-id>
```

Fetch `peer_id` from hub `:4100`. Production `.82`: `/ip4/100.64.0.7/tcp/4200/p2p/16Uiu2HAmDJCHuVkXtkPrrL8YykQ9gFZnQkR9Q6WjZZUrmueohPfd`. Identify listing `/ip4/<public>/tcp/4200` plus a gater deny is expected on L0_ONLY. Geth overlay static peers are `enode://…@<hub-vip>:8400` with `--nodiscover --netrestrict 100.64.0.0/10`; `admin_peers` must show `100.64.0.x:8400`, not the public IP. Same node id already on the public enode → `admin_removePeer` first. Full split: [l1-node — two layers](l1-node.md#two-layers-l0-wallet-vs-overlay-vip-flags).

geth `--nat=extip:<local_vip>` and beacon `--p2p-host-ip=<local_vip>` **advertise**. Authorized L0_ONLY `.45` uses overlay vIP `100.64.0.5` plus `--p2p-static-id`. `.98` and production proposers keep the public IP. Production hub `.82` (`100.64.0.7`) accepts **other overlay geth on `:8400`** without changing `--nat` to the VIP: hub toml `[[peers]]` per spoke (unique user PGP); spoke dials overlay `enode://f1e249c9…@100.64.0.7:8400` (`scripts/l0-prod82-hub.env`); `admin_removePeer` the public enode first if the same node id is already connected. listen-DNAT excludes `:8400`. Hub HTTP **`:8889`**. Overlay beacon identity is `--p2p-static-id` via `06_restart_node66.sh` `start_beacon` / systemd boot (`16Uiu2HAmDJCHuVkXtkPrrL8YykQ9gFZnQkR9Q6WjZZUrmueohPfd`); do **not** `systemctl restart` the oneshot unit. Bounce only `conet-l0d`; do not restart geth. **2026-08-20:** `.98` overlay-ESTAB to `.82`; `.45` already overlay to both hubs. Lab hub `.98` DHT-over-L0 toward `.82` is steer dest `216.225.202.82:4300/:4200` → `100.64.0.7` plus `enable-l0-dht` (keep public discv5 hub; **no** last-wins `/32`). **2026-08-20 ~07:13Z** authorized `.98` `restart-beacon`: `--disable-quic` + extra `.82` ENR. Overlay TCP proof = conntrack overlay tuple; `ss` may show public dest. Hybrid hub, **not** L0_ONLY. Listen ports stay `0.0.0.0:8400` / `:4200`. Engine and HTTP stay `127.0.0.1`. Verdict: [Lab evaluation](#lab-evaluation-2026-08-20-98-overlay-local-validator).

Binding `--http.addr`, `--authrpc.addr`, `--p2p-local-ip`, or `--rpc-host` to the vIP is a **startup-failure** risk when the TUN is down. Advertise-only flags are not.

Phase 1 bootnodes are overlay `enode://…@<peer-vip>:8400`. The crate envelope already carries complete IPv4, including UDP. A lab may steer beacon `:4300` onto TUN and run discv5 from a L0_ONLY host to a public DHT server over L0 (`docs/P2.md`): drop static `--peer`, allowlist overlay plus the hub public `/32`, DNAT that dest onto overlay, fail-closed if steer is missing. Operator `overlay-beacon-listen-dnat.sh` maps overlay-VIP tcp/udp (except geth `:8400`) into the public listen. The TUN needs `accept_local` / `route_localnet` / `rp_filter=0` so DNAT to a locally bound public IP reaches the socket. Do not flush overlay geth `:8400` conntrack on apply. If beacon `connected` drops while overlay geth stays ESTAB, re-apply `overlay-dht-steer.sh` first (flush ghost hub conntrack; **do not** restart EL/CL). `restart-beacon` only if Prysm stays in dial backoff after that flush (**~17:28Z** restored `connected=1` and `Processing blocks`). After that restart, do **not** re-apply steer immediately. After DNAT, `.45` `ss` may show ESTAB to hub public `:4200` (original dest, not a leak); overlay proof is TUN VIP + isolate DROP=0. First-minute `suitable=0` then `Processing blocks` is expected. That is not a production discv5 product, is **not** `FOLLOW_OK`, and does not close follow-the-chain. EL may stay `0x0`. Public P2P in [l1-node](l1-node.md) stays the slot-critical path.

## L0 wire (do not invent another)

Until a dedicated SI command exists, any byte-stream work must reuse the live contract:

```http
POST /post HTTP/1.1
Host: {guardian-domain}.conet.network
Content-Type: application/json

{"data":"<OpenPGP armored message>"}
```

| Object | Encrypt to | HTTP entry |
| --- | --- | --- |
| Overlay TCP payload | Peer **user PGP** | Healthy **A ≠ B** |
| Mailbox work (`NoPush`) | Mailbox **B route PGP** | Same `{ "data" }` body — never an HTTP field |
| Listen / control | Mailbox **B route PGP** | Healthy **C ≠ B** |

- No `X-CoNET-Hop-Sigs` on the first client POST.
- No `NoPush` / `beamioNoPush` on HTTP JSON.
- Do not default-dial mailbox B.
- Do not put `Securitykey` in a B-decryptable command.
- Do not reuse SilentPass / `SaaS_Sock5*` (egress `host:port`).
- Do not send UDP `udp_relay` frames and call them OS UDP.

Live overlay duplex is SI **`l0_listen` / `l0_connect`** plus **application** JSON ([Duplex overlay](../l0/duplex-forward.md)). Chat / mining / udp / L0 exclusive pools stay isolated. SI does **not** implement `duplex_*`. Do **not** send `command: "mining"` with `listenKind: "duplex"`. `listenKind: "l1p2p"` / `p2p_stream_*` are **not** current SI.

Crate MVP forwards are a **stub** (accepted): the daemon counts TUN IPv4 packets. When `[l0].enabled = true` and keys + entries exist, the crate prefers duplex: `duplex_offer` (AES key + session `listenWallet`) to the peer **long-lived** user PGP; exclusive `l0_listen`; `l0_connect` occupies; AES `duplex_accept` / `duplex_reject` / `duplex_frame` on the occupied pipe (`payload` = standard base64 of `L0D1||IPv4`). Crate installs outbound `pipe_tx` **only after** occupy HTTP **200** keep-alive (TUN `try_send` before that is P1, not a live AES pipe). SI 409 applies to a **second `l0_connect`**, not Chat gossip. Idle `l0_listen` has no mining epoch — SI must emit SSE comment keepalives **only while idle**, **stop** those comments after occupy, and clear the 60s idle timeout on **client→C** (`sourceSocket.setTimeout(0)`) as well as C→B. Occupied-pipe AES `duplex_accept` may omit `listenUserPgp` (Chat accept still includes it). SSE AES frames complete on `\r\n\r\n`. User-PGP gossip always lands in the Chat pool; idle L0 may get a copy. `duplex_reject` or missing `duplex_accept` or missing pipe keeps **P1 gossip**. After exclusive `l0_listen` HTTP **200** (SSE still live), the crate **rebuilds** outbound `l0_connect` for already-attached sessions and **retries** occupy failures — it must not leave a dead `pipe_tx` installed (TUN then hits queue-full and stays on P1, which cannot complete beacon `:4200` TCP). Rebuild must **not** run after the listen SSE has already ended. Occupy TCP **EOF** (no `l0_pipe_end` JSON) clears `pipe_tx` and retries the same as `Err`. When SI tears down an occupied listen it sends **`l0_pipe_end`** on the inbound TCP and optional **`l0_listen_released`** on SSE; the crate parses both, releases the local pipe, and retries occupy with a shorter backoff. A restarted client's `l0_listen` is **409** while occupy sockets are still live; SI drops ghost occupy (inbound destroyed or SSE stale) so the new process can listen again. Entry `socketForward` must not use 60s receive-idle destroy on long SSE / L0 pipes ([duplex-forward](../l0/duplex-forward.md), [peel-hop-listen](../l0/peel-hop-listen.md)). Crate MVP session listen is the registered per-port channel EOA. Inbound: decrypt user-PGP armor or AES duplex frames → overlay IPv4 queued to TUN when `routing_key_file` is an OpenPGP secret cert. Optional `[[l0.channels]]` is one EOA + SSE per overlay port (8400 / 4200 / 4300). Empty channels keep one EOA. `:4300` is overlay IPv4, not `udp_relay`. `[l0]` defaults **off**. An authorized lab may enable `[l0]`. HTTP 200 on Chat gossip ≠ delivery. Do not claim production mailbox delivery. Do not treat SI `duplex_*` or `p2p_stream_*` as current SI.

## Failure semantics

| Situation | Process result |
| --- | --- |
| Overlay vIP not on a physical NIC; only `--nat=extip` / `--p2p-host-ip` set | geth/beacon **start** |
| Overlay bootnode unreachable | Clients stay up; overlay peer count may be 0 |
| Lab DHT `connected` drops; overlay geth still ESTAB | Re-apply `overlay-dht-steer.sh` (flush ghost hub conntrack). **Do not** restart geth/beacon for NAT repair. `restart-beacon` only if Prysm stays in dial backoff |
| After `restart-beacon`, `ss` shows hub public `:4200` | DNAT original dest, not a leak. Overlay proof is TUN VIP `100.64.0.5` ↔ `100.64.0.6:4200` plus isolate `tcp dpt:4200` DROP = 0 |
| After TUN bounce or a new beacon PID | Re-apply **listen-DNAT** (`overlay-beacon-listen-dnat.sh`). Do **not** immediately `overlay-dht-steer.sh apply` |
| `pgrep -n geth` PID changed | False match (beacon-chain argv contains the geth path). Trust **`geth.pid`**. Lab `.98` geth HTTP may be **`:8889`**, not `:8545` |
| Hub public `connected` briefly 0 after hub `restart-beacon` | Public peers reconnecting. Spoke overlay `connected` is the overlay test |
| First minute after `restart-beacon` logs `suitable=0` | Expected. Wait for `Processing blocks`. Do **not** re-apply steer immediately after start (flushes SYN_SENT) |
| EL stays `0x0` while `head_slot` climbs | CL lag, not overlay down. Overlay CL catch-up proof is `head_slot` **rising** and `sync_distance` **falling** (lab 2026-08-20 ~04:09Z: ~1 min `937984→938207`, `32443→32228`). Do **not** restart `.45` geth while overlay `:8400` is ESTAB |
| Entry A returns HTTP 200 for overlay `POST { data }` | **Not** by itself inbound delivery. Mailbox is store-and-forward. The 2026-08-18 lab wrote inbound IPv4 and completed overlay geth + beacon TCP; crate may batch IPv4 and POST with concurrency 32 / queue 2048. After that binary, overlay is not the limiter; Prysm initial-sync is ~3.2 blocks/s. EL still `0x0`. Watch: `scripts/watch-l0-follow.sh` |
| `start` without `CAP_NET_ADMIN` | `conet-l0d` exits; clients unchanged |
| Dirty state after a crash | Next `start` or `teardown` removes `CONET_L0D` + TUN |
| Bind Engine/HTTP to overlay IP while TUN is down | geth/beacon **may fail to start** — do not do this |

## Dual-hub recovery checklist (2026-08-20)

For a dual-hub spoke such as `.45` (`100.64.0.5`) using `.82`
(`100.64.0.7`) and `.98` (`100.64.0.6`), keep the recovery boundary
explicit:

- `:8400 ESTAB` proves only geth transport; beacon `:4200` and Prysm
  `peer_count` must be checked separately.
- `i/o timeout` and `dial backoff` to `/ip4/<hub-vip>/tcp/4200` usually
  mean the overlay TCP pipe did not complete. Check stale SI occupy,
  DNAT, conntrack, and peer ID before changing client flags.
- A public-advertise hub can listen on its public `:4200`; apply
  `overlay-beacon-listen-dnat.sh` so overlay VIP traffic reaches it.
- HTTP `409` from `l0_connect` is an exclusive-pipe collision. P1 fallback
  or an entry HTTP 200 is not proof of duplex delivery.

Recommended sequence:

1. Read `peer_count`, `identity`, `ss`, TUN VIPs, peer IDs, and
   `conet-l0d` logs.
2. Apply listen-DNAT on both ends, excluding geth `:8400`.
3. On persistent `SYN-SENT` plus 409/404, bounce `conet-l0d` hub first,
   then spoke. Re-apply listen-DNAT after every TUN or beacon-PID change;
   do not immediately apply DHT steer after a beacon restart.
4. If 409 remains, an authorized operator clears the stale mailbox-B SI
   occupy, waits for SI `active`, and repeats the ordered daemon bounce.
5. Restart only the named beacon, and only after explicit authorization,
   when the overlay TCP path is healthy but Prysm remains in dial backoff.
   Verify geth using `geth.pid`; `pgrep -n geth` can match
   `beacon-chain` arguments.

The accepted evidence is spoke `connected >= 1`, overlay `:4200 ESTAB`,
and unchanged geth health. For CL catch-up, `head_slot` must rise while
`sync_distance` falls. `is_syncing=true`, `is_optimistic=true`, and EL
`0x0` can be normal during catch-up. This checklist documents recovery
of the existing SI `l0_listen`/`l0_connect` composition; it adds no SI
command and does not authorize a production slot-critical cutover.

## Lab evaluation (2026-08-20): `.98` overlay geth/beacon, local validator, L1 “mining”

Operator how-to and the full verdict table: [Applications — lab evaluation](../applications/conet-l0d.md#lab-evaluation-2026-08-20-98-overlay-local-validator). L1 join / validator: [Run an L1 node](l1-node.md#lab-evaluation-2026-08-20-98-overlay-local-validator). Do **not** collapse this with Guardian DePIN mining ([Participate in mining](l1-mining.md)).

| Claim | Verdict |
| --- | --- |
| Overlay geth `.98` → `.82` (`:8400`) | **Accepted** |
| Overlay beacon TCP `.98` → `.82` after authorized `restart-beacon` (`--disable-quic`) | **Accepted** (conntrack overlay tuple; `ss` may show public dest) |
| `.98` origin-anonymous / L0_ONLY | **Rejected** (`--p2p-host-ip=198.251.77.98`) |
| `validator` on loopback only | **Architecture accepted**; **no VA process** on this lab hub |
| Slot-critical PoS solely over anonymous L0 | **Not claimed** — [publication gate](l1-node.md#slot-critical-publication-gate) unpublished |
| Crate captures `validator_uid` | **Forbidden** (loopback `RETURN` first) |

Config reminder:

```toml
# optional — that uid is never captured
# validator_uid = 998
```

`--rpc-host=127.0.0.1` / `--grpc-gateway-host=127.0.0.1` stay on loopback. Overlay catch is geth `:8400` and beacon `:4200`/`:4300` only.

## Slot-critical publication gate

Full metric table: [Run an L1 node](l1-node.md#slot-critical-publication-gate) and [Applications](../applications/conet-l0d.md#slot-critical-publication-gate). Crate occupy retry is **not** a published P50 reconnect time and **not** a cutover.

Do **not** treat empty `[[l0.channels]]` (one EOA for every overlay port) as a production default.

## Multi-Guardian and multi-Mailbox

If all L1 overlay traffic hangs on **few mailboxes**, CoNET trades validator **IP** concentration for **Guardian path** concentration. Production must have several independent entries, several mailboxes B, several ASNs, several regions, one routing EOA per overlay port, and automatic reconnect **plus** failover to another B.

| Crate knob | What it does | What it does **not** do |
| --- | --- | --- |
| `listen_entries` (C ≠ B) | Extra HTTP/SSE entries | Does not by itself give multi-ASN mailboxes |
| `[[l0.channels]]` | One routing EOA + listen SSE per `8400` / `4200` / `4300` | Same mailbox B still concentrates occupy |
| Occupy EOF / `l0_pipe_end` retry | Same-B reconnect | Failover to another mailbox / ASN is **not** shipped |

Operator table: [Applications](../applications/conet-l0d.md#multi-guardian-and-multi-mailbox).

## Related

- [Applications — L1 overlay daemon](../applications/conet-l0d.md) — [lab evaluation](../applications/conet-l0d.md#lab-evaluation-2026-08-20-98-overlay-local-validator) · [publication gate](../applications/conet-l0d.md#slot-critical-publication-gate)
- [Run an L1 node](l1-node.md) — [publication gate](l1-node.md#slot-critical-publication-gate) · [multi-Guardian](l1-node.md#multi-guardian-and-multi-mailbox)
- [Participate in mining](l1-mining.md) — DePIN gossip, not PoS overlay
- [L0 development](l0.md)
- [SI developer guide](../l0/si-developer-guide.md)
- [Duplex overlay](../l0/duplex-forward.md)
- [UDP frame forwarding](../l0/udp-forward.md)
- [SilentPass](../applications/silentpass-vpn.md)
- [Developers index](README.md)

## Opaque pipe lifecycle and failure handling

`pipe_handle` is 64 lowercase hexadecimal characters generated randomly by the
endpoint. It is not a hash of a wallet, port, IP, or route. It is an
endpoint-to-endpoint encrypted correlation value; SI treats each local handle
as opaque and hop-local.

```json
{
  "type": "l0_pipe_end",
  "pipe_handle": "<64 lowercase hex>",
  "reason": "transport_closed"
}
```

The control line is accepted only by the occupied TCP that already owns the
same handle. `wallet`, `connector`, `sessionId`, and `session_id` are not part
of the current wire contract. An SSE frame containing this object is not a
teardown signal and must not release another pipe. Before an HTTP keep-alive
response is committed, a dead downstream transport returns `410 Gone` (or
another transport error); afterwards the current TCP is closed with FIN/RST.
The sender stops packet production for that pipe and reconnects only through
bounded retry/backoff.

### Two-minute occupied-pipe liveness

The occupied-pipe sender must transmit application data at least once every
120 seconds. If no overlay IPv4 frame is available, `conet-l0d` sends an
encrypted `duplex_ping` blob every 60 seconds. This is application data, not
an injected IP packet.

The timeout applies only to the exclusive L0 listen SSE. The listener measures
inbound bytes; if none arrive for 120 seconds, it closes the SSE and releases
the occupied writer. The peer observes EOF and must stop using that pipe
incarnation. Once the listener has re-established its own SSE, a bidirectional
client may send a new `l0_connect` with a fresh `pipe_handle`; stale `pipe_tx`
state must not be reused. Chat SSE uses its normal mailbox heartbeat and is
not subject to this timeout.
