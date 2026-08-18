# conet-l0d (L1 overlay daemon)

**Evidence level: Under development.** The CLI, config, TUN/iptables lifecycle, and locator grammar are implemented in-crate. Overlay TCP over live Layer Minus is an application composition on **existing** `/post` primitives. There is **no** production SI command named `p2p_stream_*` in this revision.

Public site: [https://gitbook.conet.network/developers/conet-l0d.html](https://gitbook.conet.network/developers/conet-l0d.html)

Operator how-to: [Applications — L1 overlay daemon](../applications/conet-l0d.md)  
L1 ports and public bootnodes: [Run an L1 node](l1-node.md)  
Forwarding plane: [L0 development](l0.md) · [How to use Layer Minus](../l0/using-l0.md)

Whitepaper / `RULES.md` revision **2026-08-18** (authorized L0_ONLY `.45` advertises overlay vIP; overlay geth + beacon TCP proven; CL initial-sync in progress; EL still `0x0`). A change to those files must update **this page and the Applications page** in the same task. A **new SI command** must also update L0 protocol pages (`using-l0`, mailbox routing, SI developer guide) — do not document a live command on only one side.

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
| `docs/P1.md` | Overlay `/post` encrypt + mailbox wrap + POST; inbound decrypt + TUN write-back; EIP-191 listen worker; SI gossip JSON ingest; `[l0]` default off; authorized lab may enable `[l0]`; 2026-08-18: `.45` advertises overlay vIP; overlay geth + beacon TCP; CL initial-sync in progress |
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

# Optional P1 client. Default off. Do not POST plaintext as data.
# Encrypt to peer user PGP, wrap { data, NoPush: true } to B route PGP,
# POST only { "data": outerArmor }. Inbound decrypt + TUN write-back is
# in-crate when routing_key_file is an OpenPGP secret cert. Listen HTTP+SSE
# is in-crate when enabled plus listen_entries, mailbox_route_pgp_file
# (this host's B route PUBLIC key), routing_eoa, routing_key_file, and
# routing_eth_key_file (hex secp256k1; must match routing_eoa; not OpenPGP).
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

Phase 1 bootnodes are overlay `enode://…@<peer-vip>:8400`. Do not hijack discv4/discv5 UDP. Public P2P in [l1-node](l1-node.md) stays the slot-critical path.

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

`listenKind: "l1p2p"` is a **design reservation**, not a current SI pool label. Chat / mining / udp pools stay isolated. If you add a real command, update [using-l0](../l0/using-l0.md), [mailbox routing](../l0/mailbox-routing.md), and the [SI developer guide](../l0/si-developer-guide.md) in the same task.

Crate MVP forwards are a **stub** (accepted): the daemon counts TUN IPv4 packets. When `[l0].enabled = true` and the peer has **user PGP** plus **route PGP** files and at least one entry, P1 encrypts the overlay envelope to the peer user PGP, wraps `{ data, NoPush: true }` to mailbox B route PGP, and POSTs only `{ "data": outerArmor }` to a healthy entry A ≠ B. Inbound: decrypt user-PGP armor → overlay envelope → raw IPv4 queued to TUN when `routing_key_file` is an OpenPGP secret cert. Listen HTTP+SSE worker POSTs EIP-191-signed `mining` + `listenKind: "chat"` (no `Securitykey`; SI `{ message, signMessage }` base64) to entry C ≠ B when `listen_entries`, `mailbox_route_pgp_file`, `routing_eoa`, `routing_key_file`, and `routing_eth_key_file` are set. Listen ingest matches SI `forWardPGPMessageToClient` raw JSON `{ "data": "<armor>" }` (Chat `handleInbound`), not only SSE `data: BEGIN PGP` lines. In-crate listen matches SI `checkSign`. `[l0]` defaults **off**. An authorized lab may enable `[l0]` and POST that existing listen to entry C — not a new SI command. **2026-08-17 23:12Z L0-only:** outbound HTTP 200, no inbound TUN write (old SSE-only parser). **23:30Z** (restart only `conet-l0d`): inbound IPv4 on both TUNs and overlay geth TCP (`.45` `100.64.0.5` ↔ `.98` `100.64.0.6:8400`). **2026-08-18:** authorized L0_ONLY `.45` advertises overlay vIP; overlay geth + beacon TCP ESTAB; CL initial-sync in progress; EL still `0x0`. HTTP 200 ≠ delivery. Do not claim production mailbox delivery. Do not treat `p2p_stream_*` as current SI.

## Failure semantics

| Situation | Process result |
| --- | --- |
| Overlay vIP not on a physical NIC; only `--nat=extip` / `--p2p-host-ip` set | geth/beacon **start** |
| Overlay bootnode unreachable | Clients stay up; overlay peer count may be 0 |
| Entry A returns HTTP 200 for overlay `POST { data }` | **Not** by itself inbound delivery. Mailbox is store-and-forward. The 2026-08-18 lab wrote inbound IPv4 and completed overlay geth + beacon TCP; CL initial-sync is in progress; EL still `0x0` |
| `start` without `CAP_NET_ADMIN` | `conet-l0d` exits; clients unchanged |
| Dirty state after a crash | Next `start` or `teardown` removes `CONET_L0D` + TUN |
| Bind Engine/HTTP to overlay IP while TUN is down | geth/beacon **may fail to start** — do not do this |

## Related

- [Applications — L1 overlay daemon](../applications/conet-l0d.md)
- [Run an L1 node](l1-node.md)
- [L0 development](l0.md)
- [SI developer guide](../l0/si-developer-guide.md)
- [UDP frame forwarding](../l0/udp-forward.md)
- [SilentPass](../applications/silentpass-vpn.md)
- [Developers index](README.md)
