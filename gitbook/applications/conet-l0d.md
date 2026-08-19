# conet-l0d — L1 overlay daemon & Web3 Enterprise Gateway

**Maturity: Under development.** Crate MVP is accepted for the **L1 overlay** path (Linux command, TUN/iptables lifecycle, `web3://` locator, packet counters, occupied duplex + P1 fallback). The **CoNET Web3 Enterprise Gateway** product role and the [Web3 Application Protocol](../l0/web3-application-protocol.md) draft extend that daemon toward hosting existing Web / API / AI services behind a wallet identity — that hosting path is **destination architecture**, not a shipped public hosting product. Overlay `/post` prefers SI **`l0_listen` / `l0_connect`** occupancy plus **application duplex** (`duplex_offer` on Chat gossip; accept / reject / AES `duplex_frame` on the occupied pipe); **P1 gossip** remains the fallback if the peer app never sends `duplex_accept` or the pipe is missing. P1 outbound encrypt + mailbox wrap + `POST { data }`, inbound decrypt + TUN write-back, and listen HTTP+SSE workers exist in-crate (`[l0]` default off). Listen ingest matches SI `forWardPGPMessageToClient` raw JSON `{ "data": "<armor>" }` (Chat `handleInbound`) plus duplex JSON frames. In-crate listen matches SI `checkSign`. An authorized lab may enable `[l0]`. Optional `[[l0.channels]]` is one routing EOA + listen SSE per overlay port (8400 / 4200 / 4300); outbound encrypts to the peer user PGP for that port (classify by well-known src or dest port). Empty channels keep one EOA. `:4300` is overlay IPv4, not SI `udp_relay`. The 2026-08-17 23:12Z L0-only lab returned HTTP 200 on outbound `/post` but did not write inbound IPv4 (old SSE-only parser). **23:30Z** (restart only `conet-l0d`) wrote inbound IPv4 on both TUNs and completed overlay geth TCP (`.45` `100.64.0.5` ↔ `.98` `100.64.0.6:8400`). **2026-08-18:** authorized L0_ONLY `.45` advertises overlay vIP `100.64.0.5`; overlay geth + beacon TCP ESTAB; dest-aggregated IPv4 + POST concurrency 32 / queue 2048 (upgrade both lab binaries together). After that binary, overlay queue-full is 0; remaining follow-the-chain limiter is Prysm initial-sync (~3.2 blocks/s, ~15 h). EL still `0x0`. Read-only watch: `scripts/watch-l0-follow.sh`. Follow-the-chain is **not** complete. Lab overlay UDP echo and `:4300` (direct + public-ENR steer) arrived on the peer TUN; lab discv5 via L0 is **accepted** (`L0_DHT` allowlist = overlay + hub `/32`; packets still DNAT onto L0; not `FOLLOW_OK`; not a production product). If beacon `connected` drops, re-apply `overlay-dht-steer.sh` first (flush ghost conntrack; do not restart EL/CL). Authorized `.45` `restart-beacon` is only for Prysm dial backoff (**~17:28Z** restored `connected=1` and `Processing blocks`; do not re-apply steer immediately after start). After DNAT, `.45` `ss` may show hub public `:4200` (original dest, not a leak); overlay proof is TUN VIP + isolate DROP=0. First-minute `suitable=0` is expected. HTTP 200 ≠ delivery. This is **not** a public mailbox product. This label is not a security audit.

Public site: [https://gitbook.conet.network/applications/conet-l0d.html](https://gitbook.conet.network/applications/conet-l0d.html)

Developer CLI and config: [Developers — conet-l0d](../developers/conet-l0d.md)  
Application protocol draft: [CoNET Web3 Application Protocol](../l0/web3-application-protocol.md)  
Design: crate whitepaper revision **2026-08-18** (application duplex on Chat gossip + P1 gossip when the peer app does not accept; optional per-port `[[l0.channels]]` listen SSE; overlay IPv4 batch + POST 32/512; Prysm-bound follow-the-chain; lab overlay UDP + live discv5 via L0 accepted; DHT drop recovery = flush ghost conntrack first; authorized `.45` `restart-beacon` after dial backoff; `ss` public `:4200` is DNAT dest, not a leak; not a production discv5 product) (pair in [CoNET-L0D/whitepaper](https://github.com/CoNET-project/CoNET-L0D/tree/main/whitepaper)).

If that whitepaper or the crate `RULES.md` changes, this page and the Developers page must change in the **same task**.

## Product roles (two compositions, one daemon)

`conet-l0d` is a **Linux userspace daemon**. The same binary (and the same Layer Minus substrate) supports two product roles. Do not collapse them.

| Role | Product name | What it does | Maturity in this book |
| --- | --- | --- | --- |
| **A. L1 overlay daemon** | Consensus peer path | Catch overlay `100.64.0.0/10` so unmodified **geth / Prysm** peer over L0 without patching those clients | **Under development** / **lab-proven** |
| **B. Enterprise host gateway** | **CoNET Web3 Enterprise Gateway** | Publish an existing Web / API / AI / intranet service as a **wallet-addressed** host: origin IP hidden, passwordless wallet auth, L0 privacy routing, protocol adapt | **Destination** — protocol draft on [Web3 Application Protocol](../l0/web3-application-protocol.md); not a public hosting product yet |

**Suggested product one-liner (role B):** publish existing Web, API, AI, and intranet services as wallet-addressed, origin-IP-hidden, passwordless Web3 services.

**Suggested protocol one-liner:** *A wallet-addressed, mutually authenticated and privacy-routed application protocol* — [draft](../l0/web3-application-protocol.md).

It does **not** turn Layer Minus into a second IP network. L0 stays a [PGP / wallet-address forwarding plane](../l0/using-l0.md). Both roles are application combinations of that plane.

### Role A — L1 overlay (what works in lab today)

**Destination:** carry consensus gossip (geth **8400**, beacon **4200/4300**) on wallet-addressed L0 duplex so the long-lived peer identity is a routing EOA + OpenPGP route, not a stable public `IP:port`. See [Run an L1 node — Vision](../developers/l1-node.md#vision-wallet-addressed-consensus-transport).

**Today:** public hub join remains documented; this path is **Under development** / **lab-proven**. Do not claim that every production proposer has abandoned public listen.

You start one command. The daemon:

1. creates TUN `conet-l0` and a route for `100.64.0.0/10`;
2. installs a dedicated iptables chain `CONET_L0D` (loopback is returned first);
3. maps overlay IPs to `web3://` wallet or `@tag.web3` locators;
4. **removes exactly those objects** on `stop`, SIGINT/SIGTERM, or `teardown`.

You do **not** run `iptables` by hand.

### Role B — CoNET Web3 Enterprise Gateway (destination)

Enterprise servers run `conet-l0d` as the **network boundary**. Existing HTTP, REST, GraphQL, WebSocket, or internal APIs need not understand wallets, PGP, or Guardians. The gateway:

| Capability | Target behavior |
| --- | --- |
| Origin hiding | Host **initiates** L0 channels; no public inbound `IP:port` required on the origin |
| Protocol adapt | Map Web3 Application Requests onto local Web / API / TCP |
| Wallet auth | Verify wallet, delegated session keys, nonce, and policy |
| End-to-end crypto | Do not trust entry nodes with business plaintext |
| Stable service identity | Change IP / ISP / cloud / Guardian without changing the **service wallet** |
| Multi-entry resilience | Several entries / mailboxes across ASN and operators |
| Audit | Emit authenticated identity, request ID, policy result |

Example local mapping (destination):

```text
web3://company.web3/       → 127.0.0.1:3000
web3://company.web3/api/   → 10.0.1.20:8080
web3://company.web3/files/ → 10.0.1.30:9000
```

**Backend trust boundary:** the origin must **not** trust client-supplied identity headers. The gateway must strip colliding fields and inject only verified values (for example `X-CoNET-User-Wallet`, session ID, request ID, domain). Backend listen should be loopback, Unix socket, or mTLS only.

**Client side** is a browser extension (or equivalent): intercept `web3://`, resolve service identity from CoNET L1 (not origin IP), sign and encrypt requests, verify host-signed responses, isolate Web3 Origins. That client is **not** documented as a public production app in this book yet.

Do **not** treat overlay Peer Locator completion as “Enterprise Gateway shipped.”

## What it is not

| Other product | Difference |
| --- | --- |
| [SilentPass](silentpass-vpn.md) | Device/app **egress** to a public `host:port` (`SaaS_Sock5*`). Not L1 consensus P2P and not enterprise origin hosting. |
| [Run an L1 node](../developers/l1-node.md) public join path | Documented permissionless hubs still expose geth **8400** and beacon **4200/4300** for Internet peers. Destination architecture: wallet-addressed L0 gossip ([vision](../developers/l1-node.md#vision-wallet-addressed-consensus-transport)). |
| Validator client | `validator` only talks to **local** beacon. Do not capture its uid or read its keystore. |
| Current [UDP forward](../l0/udp-forward.md) | AES frames over HTTP/SSE — not raw OS UDP, not discv4. |
| [Duplex overlay](../l0/duplex-forward.md) | Application AES on two owned L0 occupy pipes. Offer on long-lived Chat listen; accept / reject / frames on occupied pipe. SI does **not** implement `duplex_*`. `duplex_reject` or missing accept keeps P1 gossip. After `l0_listen` reconnect, rebuild `l0_connect` (do not permanent P1). On occupied teardown SI emits **`l0_pipe_end`** (inbound TCP) and optional **`l0_listen_released`** (listen SSE); conet-l0d clears its pipe and retries occupy. |
| Cloudflare Tunnel / Tor Onion / SIWE alone | Related patterns (tunnel, hidden service, wallet login) — CoNET combines **wallet identity + L1 domain target + L0 routing + host gateway**. Comparison belongs in product reviews, not as “already equivalent.” |

Do not point SilentPass or `SaaS_Sock5` at your geth P2P port and call that “wallet-addressed L1 peering.”

## Who should run it

**Role A (L1 overlay):**

- An operator who already follows [Run an L1 node](../developers/l1-node.md).
- A host behind NAT, or without a stable public IP, that still wants a **static overlay peer**.
- A hub that publishes overlay locators as a **backup or primary** path next to (or instead of) public bootnodes as the operator migrates.
- Operators following the [L1-over-L0 vision](../developers/l1-node.md#vision-wallet-addressed-consensus-transport) who keep public listen only as substrate / fallback until cutover evidence is published.

**Role B (Enterprise Gateway) — intended operators (destination):**

- Enterprises that want to publish an internal dashboard / API / private AI endpoint without a stable public origin IP.
- Teams that want **passwordless wallet** (and optional session-key) access with L0 mutual authentication.
- B2B or pay-by-use hosts that later compose payment scopes from the Application Protocol draft.

Permissionless join docs still list **public P2P** hubs. Production proposers should not drop public listen until slot-critical L0 metrics and multi-Guardian path diversity are published. The 2026-08-18 authorized lab on `.45` advertises overlay vIP and runs CL initial-sync over overlay; EL may still show `0x0` while catching up. L0-only peering is the **destination**, not an unmeasured default.

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

## Troubleshooting: beacon `connected=0` while overlay syncing

**geth overlay ESTAB does not mean beacon is peered.** Check `:4200` on its own.

| Symptom | Likely cause | What to do |
| --- | --- | --- |
| Prysm logs `dial backoff` to `/ip4/<hub-vip>/tcp/4200` | Failed dials then backoff; or TCP handshake never completes on overlay | Confirm hub `peer_id` matches `--peer`. Fix L0 occupy / DNAT first (below). Then authorized **`restart-beacon` on that host only** |
| `ss`: overlay SYN-SENT to `:4200`, never ESTAB | `:4200` `l0_connect` **HTTP 409** (pipe occupied) or lossy P1-only path | Soft-restart CoNET-SI on mailbox **B**; bounce **`conet-l0d` hub then spoke**; flush tcp **4200** conntrack; re-apply DNAT/steer |
| After SI fleet update, lab floods `409 Conflict` | B still holds exclusive `l0_listen` / `l0_connect` (ghost occupy after dead pipe) | Upgrade SI with `l0_pipe_end` teardown; `pkill` SI on B if needed; wait `active`; ordered l0d bounce — do not only bounce the spoke |
| Beacon drop while geth stays ESTAB; ghost NAT | Stale hub `:4200` conntrack after steer | `overlay-dht-steer.sh apply` / DNAT apply **without** restarting geth/beacon |
| Entry fake-armor instant “nginx” 404; real PGP hangs 8–15s | SI forward miss left the socket open (fixed in SI `b374d93+`) | Upgrade SI; do not treat the mimic 404 as a dead nginx |

**Recommended order (light → heavy):** DNAT/steer + conntrack → clear B SI occupy → ordered `conet-l0d` bounce → authorized spoke `restart-beacon`. Do **not** wipe chaindata. Do **not** re-apply steer immediately after `restart-beacon`. Full developer checklist: [Run an L1 node — overlay recovery](../developers/l1-node.md#beacon-connected0-over-overlay-recovery).

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

- [CoNET Web3 Application Protocol](../l0/web3-application-protocol.md) — URI / request / session draft for Enterprise Gateway
- [Developers — conet-l0d](../developers/conet-l0d.md)
- [Duplex overlay](../l0/duplex-forward.md)
- [Run an L1 node](../developers/l1-node.md)
- [How to use Layer Minus](../l0/using-l0.md)
- [Wallet-addressed peer identity](../l0/wallet-address-p2p.md)
- [SilentPass](silentpass-vpn.md)
- [L0 development](../developers/l0.md)
- [TCP/IP substrate](../l0/tcp-ip.md)
