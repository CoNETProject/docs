# conet-l0d (L1 overlay daemon)

**Evidence level: Under development.** The CLI, config, TUN/iptables lifecycle, and locator grammar are implemented in-crate. Overlay TCP over live Layer Minus prefers SI **`l0_listen` / `l0_connect`** occupancy plus application duplex. P1 gossip remains the fallback if the peer app never sends `duplex_accept` or the occupied pipe is missing. There is **no** production SI command named `duplex_*` or `p2p_stream_*` in this revision. `l0_listen` / `l0_connect` **are** current SI.

Public site: [https://gitbook.conet.network/developers/conet-l0d.html](https://gitbook.conet.network/developers/conet-l0d.html)

Operator how-to: [Applications — L1 overlay daemon](../applications/conet-l0d.md)  
L1 ports and public bootnodes: [Run an L1 node](l1-node.md)  
Forwarding plane: [L0 development](l0.md) · [How to use Layer Minus](../l0/using-l0.md)

Whitepaper / `RULES.md` revision **2026-08-18** (application duplex on Chat gossip + P1 gossip when the peer app does not accept; optional per-port `[[l0.channels]]` listen SSE; authorized L0_ONLY `.45` advertises overlay vIP; overlay geth + beacon TCP proven; after the batching binary the limiter is Prysm initial-sync at ~3.2 blocks/s; EL still `0x0`; lab overlay UDP + live discv5 via L0 accepted; DHT drop recovery = flush ghost conntrack first; authorized `.45` `restart-beacon` after dial backoff; `ss` public `:4200` is DNAT dest, not a leak; not a production discv5 product; operator watch `scripts/watch-l0-follow.sh`). A change to those files must update **this page and the Applications page** in the same task. Duplex application JSON lives on [duplex-forward](../l0/duplex-forward.md); SI command tables must **not** list `duplex_*`. Do not document `p2p_stream_*` as current SI.

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
| `stop` | Linux | Same; signals the pid in the state file |
| `teardown` | Linux | Same; works if the daemon is already dead |

```bash
conet-l0d check-config --config config/conet-l0d.example.toml
conet-l0d resolve 'web3://0x1111111111111111111111111111111111111111/p2p/geth'
conet-l0d resolve 'web3://CoNET.web3/p2p/geth'   # exact tag; CoNET ≠ CONET
conet-l0d status --config /etc/conet-l0d.toml
sudo conet-l0d start --config /etc/conet-l0d.toml
sudo conet-l0d stop --config /etc/conet-l0d.toml
sudo conet-l0d teardown --config /etc/conet-l0d.toml
```

The daemon **owns** TUN and iptables. Do not ship a second operator `iptables` script.

| Crate path | Role |
| --- | --- |
| `config/conet-l0d.example.toml` | Example overlay table |
| `systemd/conet-l0d.service` | `ExecStart=start` / `ExecStop=stop`; `CAP_NET_ADMIN`; no raw iptables |
| `whitepaper/` | Design pair (EN + zh-CN), revision **2026-08-18** |
| `docs/MVP.md` | Accepted crate MVP |
| `docs/P1.md` | Overlay `/post`: application duplex preferred, P1 gossip if the peer app never sends `duplex_accept`; inbound decrypt + TUN write-back; listen workers; optional `[[l0.channels]]`; `[l0]` default off; authorized lab may enable `[l0]`; 2026-08-18: `.45` advertises overlay vIP; overlay geth + beacon TCP; CL initial-sync in progress |
| `docs/P2.md` | Lab overlay UDP / DHT-port comms (echo + `:4300` + public-ENR steer + live discv5 via L0). `L0_DHT` allowlist = overlay then hub `/32` (one CIDR per `--p2p-allowlist`, last wins). Steer DNATs hub ports onto overlay. With a bootstrap ENR, drop overlay `--peer`. If `connected` drops, `overlay-dht-steer.sh apply` first (flush ghost conntrack; no EL/CL restart). Authorized `.45` `restart-beacon` only after dial backoff; do not re-apply steer immediately after start. After DNAT, `.45` `ss` may show hub public `:4200` (original dest, not a leak). First-minute `suitable=0` is expected. Not a closed P2 / production product |
| `RULES.md` | Engineering constraints + GitBook lockstep |

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

geth `--nat=extip:<local_vip>` and beacon `--p2p-host-ip=<local_vip>` **advertise**. Authorized L0_ONLY `.45` uses overlay vIP `100.64.0.5` plus `--p2p-static-id`. `.98` and production proposers keep the public IP. Listen ports stay `0.0.0.0:8400` / `:4200`. Engine and HTTP stay `127.0.0.1`.

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

Crate MVP forwards are a **stub** (accepted): the daemon counts TUN IPv4 packets. When `[l0].enabled = true` and keys + entries exist, the crate prefers duplex: `duplex_offer` (AES key + session `listenWallet`) to the peer **long-lived** user PGP; exclusive `l0_listen`; `l0_connect` occupies; AES `duplex_accept` / `duplex_reject` / `duplex_frame` on the occupied pipe (`payload` = standard base64 of `L0D1||IPv4`). `duplex_reject` or missing `duplex_accept` or missing pipe keeps **P1 gossip**. Crate MVP session listen is the registered per-port channel EOA. Inbound: decrypt user-PGP armor or AES duplex frames → overlay IPv4 queued to TUN when `routing_key_file` is an OpenPGP secret cert. Optional `[[l0.channels]]` is one EOA + SSE per overlay port (8400 / 4200 / 4300). Empty channels keep one EOA. `:4300` is overlay IPv4, not `udp_relay`. `[l0]` defaults **off**. An authorized lab may enable `[l0]`. HTTP 200 ≠ delivery. Do not claim production mailbox delivery. Do not treat SI `duplex_*` or `p2p_stream_*` as current SI.

## Failure semantics

| Situation | Process result |
| --- | --- |
| Overlay vIP not on a physical NIC; only `--nat=extip` / `--p2p-host-ip` set | geth/beacon **start** |
| Overlay bootnode unreachable | Clients stay up; overlay peer count may be 0 |
| Lab DHT `connected` drops; overlay geth still ESTAB | Re-apply `overlay-dht-steer.sh` (flush ghost hub conntrack). **Do not** restart geth/beacon for NAT repair. `restart-beacon` only if Prysm stays in dial backoff |
| After `restart-beacon`, `ss` shows hub public `:4200` | DNAT original dest, not a leak. Overlay proof is TUN VIP `100.64.0.5` ↔ `100.64.0.6:4200` plus isolate `tcp dpt:4200` DROP = 0 |
| First minute after `restart-beacon` logs `suitable=0` | Expected. Wait for `Processing blocks`. Do **not** re-apply steer immediately after start (flushes SYN_SENT) |
| EL stays `0x0` while `head_slot` climbs | CL lag, not overlay down. Do **not** restart `.45` geth while overlay `:8400` is ESTAB |
| Entry A returns HTTP 200 for overlay `POST { data }` | **Not** by itself inbound delivery. Mailbox is store-and-forward. The 2026-08-18 lab wrote inbound IPv4 and completed overlay geth + beacon TCP; crate may batch IPv4 and POST with concurrency 32 / queue 2048. After that binary, overlay is not the limiter; Prysm initial-sync is ~3.2 blocks/s. EL still `0x0`. Watch: `scripts/watch-l0-follow.sh` |
| `start` without `CAP_NET_ADMIN` | `conet-l0d` exits; clients unchanged |
| Dirty state after a crash | Next `start` or `teardown` removes `CONET_L0D` + TUN |
| Bind Engine/HTTP to overlay IP while TUN is down | geth/beacon **may fail to start** — do not do this |

## Related

- [Applications — L1 overlay daemon](../applications/conet-l0d.md)
- [Run an L1 node](l1-node.md)
- [L0 development](l0.md)
- [SI developer guide](../l0/si-developer-guide.md)
- [Duplex overlay](../l0/duplex-forward.md)
- [UDP frame forwarding](../l0/udp-forward.md)
- [SilentPass](../applications/silentpass-vpn.md)
- [Developers index](README.md)
