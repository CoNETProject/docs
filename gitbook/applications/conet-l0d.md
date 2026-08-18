# L1 overlay daemon (conet-l0d)

**Maturity: Under development.** Crate MVP is accepted (Linux command, TUN/iptables lifecycle, `web3://` locator, packet counters). Overlay `/post` prefers SI **`l0_listen` / `l0_connect`** occupancy plus **application duplex** (`duplex_offer` on Chat gossip; accept / reject / AES `duplex_frame` on the occupied pipe); **P1 gossip** remains the fallback if the peer app never sends `duplex_accept` or the pipe is missing. P1 outbound encrypt + mailbox wrap + `POST { data }`, inbound decrypt + TUN write-back, and listen HTTP+SSE workers exist in-crate (`[l0]` default off). Listen ingest matches SI `forWardPGPMessageToClient` raw JSON `{ "data": "<armor>" }` (Chat `handleInbound`) plus duplex JSON frames. In-crate listen matches SI `checkSign`. An authorized lab may enable `[l0]`. Optional `[[l0.channels]]` is one routing EOA + listen SSE per overlay port (8400 / 4200 / 4300); outbound encrypts to the peer user PGP for that port (classify by well-known src or dest port). Empty channels keep one EOA. `:4300` is overlay IPv4, not SI `udp_relay`. The 2026-08-17 23:12Z L0-only lab returned HTTP 200 on outbound `/post` but did not write inbound IPv4 (old SSE-only parser). **23:30Z** (restart only `conet-l0d`) wrote inbound IPv4 on both TUNs and completed overlay geth TCP (`.45` `100.64.0.5` ↔ `.98` `100.64.0.6:8400`). **2026-08-18:** authorized L0_ONLY `.45` advertises overlay vIP `100.64.0.5`; overlay geth + beacon TCP ESTAB; dest-aggregated IPv4 + POST concurrency 32 / queue 2048 (upgrade both lab binaries together). After that binary, overlay queue-full is 0; remaining follow-the-chain limiter is Prysm initial-sync (~3.2 blocks/s, ~15 h). EL still `0x0`. Read-only watch: `scripts/watch-l0-follow.sh`. Follow-the-chain is **not** complete. Lab overlay UDP echo and `:4300` (direct + public-ENR steer) arrived on the peer TUN; lab discv5 via L0 is **accepted** (`L0_DHT` allowlist = overlay + hub `/32`; packets still DNAT onto L0; not `FOLLOW_OK`; not a production product). If beacon `connected` drops, re-apply `overlay-dht-steer.sh` first (flush ghost conntrack; do not restart EL/CL). Authorized `.45` `restart-beacon` is only for Prysm dial backoff (**~17:28Z** restored `connected=1` and `Processing blocks`; do not re-apply steer immediately after start). After DNAT, `.45` `ss` may show hub public `:4200` (original dest, not a leak); overlay proof is TUN VIP + isolate DROP=0. First-minute `suitable=0` is expected. HTTP 200 ≠ delivery. This is **not** a public mailbox product. This label is not a security audit.

Public site: [https://gitbook.conet.network/applications/conet-l0d.html](https://gitbook.conet.network/applications/conet-l0d.html)

Developer CLI and config: [Developers — conet-l0d](../developers/conet-l0d.md)  
Design: crate whitepaper revision **2026-08-18** (application duplex on Chat gossip + P1 gossip when the peer app does not accept; optional per-port `[[l0.channels]]` listen SSE; overlay IPv4 batch + POST 32/512; Prysm-bound follow-the-chain; lab overlay UDP + live discv5 via L0 accepted; DHT drop recovery = flush ghost conntrack first; authorized `.45` `restart-beacon` after dial backoff; `ss` public `:4200` is DNAT dest, not a leak; not a production discv5 product) (pair in [CoNET-L0D/whitepaper](https://github.com/CoNET-project/CoNET-L0D/tree/main/whitepaper)).

If that whitepaper or the crate `RULES.md` changes, this page and the Developers page must change in the **same task**.

## Product role

`conet-l0d` is a **Linux userspace daemon** for CoNET L1 node operators. It lets `geth` and Prysm `beacon-chain` use Layer Minus as an **overlay peer path** without patching those clients.

You start one command. The daemon:

1. creates TUN `conet-l0` and a route for `100.64.0.0/10`;
2. installs a dedicated iptables chain `CONET_L0D` (loopback is returned first);
3. maps overlay IPs to `web3://` wallet or `@tag.web3` locators;
4. **removes exactly those objects** on `stop`, SIGINT/SIGTERM, or `teardown`.

You do **not** run `iptables` by hand.

It does **not** turn Layer Minus into a second IP network. L0 stays a [PGP / wallet-address forwarding plane](../l0/using-l0.md). This product is one application combination.

## What it is not

| Other product | Difference |
| --- | --- |
| [SilentPass](silentpass-vpn.md) | Device/app **egress** to a public `host:port` (`SaaS_Sock5*`). Not L1 consensus P2P. |
| [Run an L1 node](../developers/l1-node.md) public P2P | geth **8400** and beacon **4200/4300** on the Internet remain the production default. |
| Validator client | `validator` only talks to **local** beacon. Do not capture its uid or read its keystore. |
| Current [UDP forward](../l0/udp-forward.md) | AES frames over HTTP/SSE — not raw OS UDP, not discv4. |
| [Duplex overlay](../l0/duplex-forward.md) | Application AES on two owned Chat SSEs. Offer on long-lived listen; accept / reject / frames on session listen. SI does **not** implement `duplex_*`. `duplex_reject` or missing accept keeps P1 gossip. |

Do not point SilentPass or `SaaS_Sock5` at your geth P2P port and call that “wallet-addressed L1 peering.”

## Who should run it

- An operator who already follows [Run an L1 node](../developers/l1-node.md).
- A host behind NAT, or without a stable public IP, that still wants a **static overlay peer**.
- A hub that publishes overlay locators as a **backup** path next to public bootnodes.

Production proposers should keep **public P2P** for the 6-second slot. The 2026-08-18 authorized lab on `.45` advertises overlay vIP and is running CL initial-sync over overlay; EL is still `0x0`. L0-only peering must not be the default.

## How to use (operator)

### 1. Build the command

The crate is the independent repository [CoNET-project/CoNET-L0D](https://github.com/CoNET-project/CoNET-L0D). It must not import sibling apps.

```bash
git clone https://github.com/CoNET-project/CoNET-L0D.git
cd CoNET-L0D
cargo test
cargo build --release
sudo install -m 0755 target/release/conet-l0d /usr/local/sbin/conet-l0d
```

`check-config` and `resolve` work on any OS. `start` / `stop` / `teardown` need Linux, `ip`, `iptables`, and `CAP_NET_ADMIN` (usually `sudo`).

### 2. Write a config (no iptables script)

Copy `config/conet-l0d.example.toml`. Set:

- `local_vip` — this host’s overlay IPv4 (example `100.64.0.5`);
- `overlay_cidr` — default `100.64.0.0/10`;
- `identity.locator` — `web3://<yourRoutingEoa>/p2p/geth` or `web3://<tag>.web3/p2p/geth`;
- `[[peers]]` — static overlay table: locator + `vip` + TCP ports (`8400` and/or `4200`);
- optional `validator_uid` — that uid is **never** captured.

The routing wallet is **not** the deposit keystore and **not** the fee recipient.

Validate on any OS before you copy the file to the node:

```bash
conet-l0d check-config --config config/conet-l0d.example.toml
conet-l0d resolve 'web3://0x1111111111111111111111111111111111111111/p2p/geth' \
  --config config/conet-l0d.example.toml
```

### 3. Start the daemon (it owns the net)

```bash
sudo conet-l0d check-config --config /etc/conet-l0d.toml
sudo conet-l0d start --config /etc/conet-l0d.toml
```

On start the daemon tears down a leftover dirty state first, then creates TUN, address, route, and `CONET_L0D`. You should not add a second `iptables -A` of your own for this overlay.

### 4. Point geth / beacon at the overlay (advertise only)

Authorized **L0_ONLY `.45`** switches `--nat=extip` and `--p2p-host-ip` to the overlay vIP (`100.64.0.5`) and uses `--p2p-static-id`. **`.98` and production proposers keep the public IP.** Overlay geth TCP alone was not enough; the 2026-08-18 lab also completed overlay beacon TCP.

These flags **advertise** the vIP. They do not bind Engine or HTTP to it.

```bash
geth --nat extip:100.64.0.5 --bootnodes "enode://<peer-key>@100.64.0.1:8400" \
  --http.addr 127.0.0.1 --authrpc.addr 127.0.0.1 --port 8400

beacon-chain --p2p-host-ip=100.64.0.5 --p2p-static-id --p2p-tcp-port=4200 --p2p-udp-port=4300 \
  --rpc-host=127.0.0.1 --grpc-gateway-host=127.0.0.1
```

Keep `--http.addr`, `--authrpc.addr`, `--rpc-host`, and `--p2p-local-ip` on loopback. Binding them to the overlay vIP can fail startup if the TUN is down.

Advertise-only flags do **not** stop geth/beacon when the TUN is absent; you simply have no overlay peers until `conet-l0d` is up.

Phase 1: use **static** overlay bootnodes. The crate envelope already carries IPv4 including UDP. A lab may prove overlay UDP / DHT-port comms and live discv5 via L0 (`docs/P2.md` in the crate): `L0_DHT` drops static `--peer`, allowlists overlay plus the hub public `/32`, and DNATs that dest onto overlay (isolate still drops unsteered public P2P). Public-advertise and L0_ONLY beacons still bind the host public IP, so operator `overlay-beacon-listen-dnat.sh` maps overlay-VIP tcp/udp (except geth `:8400`) into that listen. The TUN needs `accept_local` / `route_localnet` / `rp_filter=0` so DNAT to a locally bound public IP reaches the socket; apply must not flush overlay geth `:8400`. discv5 / libp2p ephemeral replies must un-SNAT. If beacon `connected` later drops while overlay geth stays ESTAB, re-apply `overlay-dht-steer.sh` **first** (flushes ghost hub `:4200/:4300` conntrack; **do not** restart geth or beacon for that). Authorized `.45` `restart-beacon` is only for Prysm dial backoff after that flush (**~17:28Z** restored `connected=1` and `Processing blocks`). After that restart, do **not** re-apply steer immediately. After DNAT, `.45` `ss` may show ESTAB to hub public `:4200` (original dest, not a leak); overlay proof is TUN VIP + isolate DROP=0. First-minute `suitable=0` then `Processing blocks` is expected. That is not a production discv5 product, is **not** `FOLLOW_OK`, and does not close follow-the-chain. EL may stay `0x0`.

### 5. Stop — TUN and iptables go away

```bash
sudo conet-l0d stop --config /etc/conet-l0d.toml
# if the process died:
sudo conet-l0d teardown --config /etc/conet-l0d.toml
conet-l0d status --config /etc/conet-l0d.toml
```

Stop deletes only jumps into `CONET_L0D`, then the chain, then the overlay route/address/TUN. Foreign iptables rules stay.

Ship the crate unit `systemd/conet-l0d.service` (or copy it to `/etc/systemd/system/`). It already uses `ExecStart=conet-l0d start` and `ExecStop=conet-l0d stop` with `CAP_NET_ADMIN`. Do not put raw `iptables` in the unit.

```bash
sudo cp systemd/conet-l0d.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now conet-l0d
```

## Locator (`web3://`)

This URI is a **peer locator**, not an ERC-4804 content URL.

```text
web3://0x<40-hex>/p2p/geth
web3://YourExactTag.web3/p2p/beacon
```

`@beamioTag` must match **exactly** (`CoNET` ≠ `CONET`). Do not take `search-users` `results[0]`. An AA without AddressPGP is not a destination.

MVP `resolve` parses the URI against the config table. AddressPGP `searchKey` ABI helpers exist in-crate. P1 encrypt + mailbox wrap + `POST { data }` exist in-crate when `[l0]` is on and peer user+route PGP files plus an entry are set; inbound decrypt + TUN write-back exist when `routing_key_file` is an OpenPGP secret cert; an EIP-191 listen HTTP+SSE worker exists when enabled plus `listen_entries`, `mailbox_route_pgp_file` (this host's B route **public** key), `routing_eoa`, `routing_key_file`, and `routing_eth_key_file` (hex secp256k1; recovered address must match `routing_eoa`; not OpenPGP). Optional `[[l0.channels]]` is one EOA + SSE per overlay port. Listen ingest matches SI `forWardPGPMessageToClient` raw JSON `{ "data": "<armor>" }` (Chat `handleInbound`). In-crate listen matches SI `checkSign`. `[l0]` stays **off** by default. An authorized lab may enable `[l0]` and POST existing `mining` + `listenKind: "chat"` to entry C — not a new SI command. HTTP 200 on entry A is **not** by itself inbound TUN write-back. The 2026-08-18 lab wrote inbound IPv4, completed overlay geth + beacon TCP, and is running CL initial-sync over overlay. After the batching binary, overlay queue-full is 0; remaining limiter is Prysm initial-sync (~3.2 blocks/s). EL is still `0x0`. Lab overlay UDP echo and `:4300` (direct + public-ENR steer) arrived on the peer TUN; lab discv5 via L0 is **accepted** (`L0_DHT` allowlist = overlay + hub `/32`; packets still DNAT onto L0; not `FOLLOW_OK`; not a production product). Read-only watch: `scripts/watch-l0-follow.sh`. Authorized L0_ONLY `.45` advertises the overlay vIP; production proposers keep public P2P.

## Safety

- First iptables rule: `RETURN` `127.0.0.0/8` (Engine JWT, beacon gRPC, local RPC).
- Never capture a configured validator uid.
- Never REDIRECT `0.0.0.0/0:8400` or the whole public P2P space.
- The crate must not restart anyone’s geth, beacon, or validator. An authorized **operator** script may restart **only** the named lab host (`.45` L0_ONLY). Never wipe. Never mutate the daemon-owned `CONET_L0D` chain; public-P2P isolate uses `CONET_L0D_P2P_ISOLATE` / `_OUT`. Do not restart `.98` unless that host is authorized in the same message.
- Do not invent a new documentation or API hostname.

## What exists today

| Surface | Status |
| --- | --- |
| Crate [CoNET-L0D](https://github.com/CoNET-project/CoNET-L0D) | MVP accepted: TUN + iptables lifecycle; locator parse; example TOML; systemd unit. Overlay prefers **application duplex** on Chat gossip; P1 gossip if the peer app never sends `duplex_accept`. P1 outbound encrypt + mailbox wrap + `POST { data }`, inbound decrypt + TUN write-back, and listen HTTP+SSE workers exist in-crate (`[l0]` default off; listen is mock-tested and matches SI `checkSign`). Listen ingest matches SI gossip JSON `{ "data": "<armor>" }` plus duplex frames. An authorized lab may enable `[l0]`. Production mailbox delivery is **not** shipped |
| Two-host lab (`.45` / `.98`) | **2026-08-18:** authorized L0_ONLY `.45` advertises overlay vIP `100.64.0.5`; overlay geth + beacon TCP ESTAB; both lab `conet-l0d` upgraded together for IPv4 batch + POST concurrency 32 (restart **only** l0d). After that binary, overlay queue-full is 0. Remaining limiter is Prysm initial-sync (~3.2 blocks/s, ~15 h). EL still `0x0`. Lab overlay UDP echo and `:4300` (direct + public-ENR steer) arrived on the peer TUN; lab discv5 via L0 is **accepted** (`.45` abandoned static `--peer`; bootstrap `.98` ENR; allowlist overlay then hub `/32` as two flags, last wins; overlay TCP/UDP steer DNAT; isolate drops unsteered public P2P; not `FOLLOW_OK`; not a production product). After DNAT, `.45` `ss` may show hub public `:4200` (original dest, not a leak); overlay proof is TUN VIP + isolate DROP=0. If beacon `connected` drops while overlay geth stays ESTAB, re-apply `overlay-dht-steer.sh` first (flush ghost conntrack; **do not** restart EL/CL). `restart-beacon` only after that flush if Prysm stays in dial backoff (**~17:28Z** restored `connected=1` and `Processing blocks`; do not re-apply steer immediately after start; first-minute `suitable=0` is expected). Read-only watch on `.45`: `scripts/watch-l0-follow.sh` (`FOLLOW_OK` = overlay ESTAB + peers + CL `is_syncing=false` / `sync_distance≤64` + EL leaves `0x0`). `.98` stays on public advertise and stays synced. Restore `.45` public P2P with `stop-isolate` then a normal restart (no wipe) |
| Public operator / developer pages | This page and [Developers — conet-l0d](../developers/conet-l0d.md) |
| Application duplex | SI `l0_listen` / `l0_connect` occupancy pipe; offer / accept / frame as in [Duplex overlay](../l0/duplex-forward.md). **Not** SI `duplex_*` |
| Production SI `p2p_stream_*` / `listenKind: "l1p2p"` | **Not** a live command. Do not treat it as current SI. |
| Measured L0 hop RTT for attestations | **Not** measured. Keep public P2P for slot-critical gossip. |

## Related

- [Developers — conet-l0d](../developers/conet-l0d.md)
- [Duplex overlay](../l0/duplex-forward.md)
- [Run an L1 node](../developers/l1-node.md)
- [How to use Layer Minus](../l0/using-l0.md)
- [Wallet-addressed peer identity](../l0/wallet-address-p2p.md)
- [SilentPass](silentpass-vpn.md)
- [L0 development](../developers/l0.md)
- [TCP/IP substrate](../l0/tcp-ip.md)
