# conet-l0d — L1 overlay daemon & Web3 Enterprise Gateway

**Maturity: Under development.** Crate MVP is accepted for the **L1 overlay** path (Linux command, TUN/iptables lifecycle, `web3://` locator, packet counters, occupied duplex + P1 fallback). The **CoNET Web3 Enterprise Gateway** product role and the [Web3 Application Protocol](../l0/web3-application-protocol.md) draft extend that daemon toward hosting existing Web / API / AI services behind a wallet identity — that hosting path is **destination architecture**, not a shipped public hosting product. Overlay `/post` prefers SI **`l0_listen` / `l0_connect`** occupancy plus **application duplex** (`duplex_offer` on Chat gossip; accept / reject / AES `duplex_frame` on the occupied pipe); **P1 gossip** remains the fallback if the peer app never sends `duplex_accept` or the pipe is missing. P1 outbound encrypt + mailbox wrap + `POST { data }`, inbound decrypt + TUN write-back, and listen HTTP+SSE workers exist in-crate (`[l0]` default off). Listen ingest matches SI `forWardPGPMessageToClient` raw JSON `{ "data": "<armor>" }` (Chat `handleInbound`) plus duplex JSON frames. In-crate listen matches SI `checkSign`. An authorized lab may enable `[l0]`. Optional `[[l0.channels]]` is one routing EOA + listen SSE per overlay port (8400 / 4200 / 4300); outbound encrypts to the peer user PGP for that port (classify by well-known src or dest port). Empty channels keep one EOA. `:4300` is overlay IPv4, not SI `udp_relay`. The 2026-08-17 23:12Z L0-only lab returned HTTP 200 on outbound `/post` but did not write inbound IPv4 (old SSE-only parser). **23:30Z** (restart only `conet-l0d`) wrote inbound IPv4 on both TUNs and completed overlay geth TCP (`.45` `100.64.0.5` ↔ `.98` `100.64.0.6:8400`). **2026-08-18:** authorized L0_ONLY `.45` advertises overlay vIP `100.64.0.5`; overlay geth + beacon TCP ESTAB; dest-aggregated IPv4 + POST concurrency 32 / queue 2048 (upgrade both lab binaries together). After that binary, overlay queue-full is 0; remaining follow-the-chain limiter is Prysm initial-sync (~3.2 blocks/s, ~15 h). EL still `0x0`. Read-only watch: `scripts/watch-l0-follow.sh`. Follow-the-chain is **not** complete. Lab overlay UDP echo and `:4300` (direct + public-ENR steer) arrived on the peer TUN; lab discv5 via L0 is **accepted** (`L0_DHT` allowlist = overlay + hub `/32`; packets still DNAT onto L0; not `FOLLOW_OK`; not a production product). If beacon `connected` drops, re-apply `overlay-dht-steer.sh` first (flush ghost conntrack; do not restart EL/CL). Authorized `.45` `restart-beacon` is only for Prysm dial backoff (**~17:28Z** restored `connected=1` and `Processing blocks`; do not re-apply steer immediately after start). After DNAT, `.45` `ss` may show hub public `:4200` (original dest, not a leak); overlay proof is TUN VIP + isolate DROP=0. First-minute `suitable=0` is expected. HTTP 200 ≠ delivery. This is **not** a public mailbox product. This label is not a security audit.

Public site: [https://gitbook.conet.network/applications/conet-l0d.html](https://gitbook.conet.network/applications/conet-l0d.html)

Developer CLI and config: [Developers — conet-l0d](../developers/conet-l0d.md)  
Application protocol draft: [CoNET Web3 Application Protocol](../l0/web3-application-protocol.md)  
Design: crate whitepaper revision **2026-08-18** (application duplex on Chat gossip + P1 gossip when the peer app does not accept; optional per-port `[[l0.channels]]` listen SSE; overlay IPv4 batch + POST 32/512; Prysm-bound follow-the-chain; lab overlay UDP + live discv5 via L0 accepted; DHT drop recovery = flush ghost conntrack first; authorized `.45` `restart-beacon` after dial backoff; **2026-08-20** lab-only static overlay `--peer` after authorized hub-then-spoke `restart-beacon` proves CL catch-up (`head_slot`↑ / `sync_distance`↓); re-apply listen-DNAT not steer; prove geth via `geth.pid`; `ss` public `:4200` is DNAT dest, not a leak; not a production discv5 product) (pair in [CoNET-L0D/whitepaper](https://github.com/CoNET-project/CoNET-L0D/tree/main/whitepaper)).

If that whitepaper or the crate `RULES.md` changes, this page and the Developers page must change in the **same task**.

## Product roles (two compositions, one daemon)

`conet-l0d` is a **Linux userspace daemon**. The same binary (and the same Layer Minus substrate) supports two product roles. Do not collapse them.

The gateway role is available in the crate as the isolated
`conet-l0d gateway` subcommand. It shares the mailbox protocol implementation
with the overlay role, but it never creates a TUN or changes iptables.

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

#### Gateway mode (crate implementation)

Run the gateway on the host that owns the service:

```bash
conet-l0d gateway --config /etc/conet-l0d-gateway.toml
```

The TOML `[gateway]` section points `upstream` at a loopback HTTP service and
provides separate existing Entry pools for mailbox listen and response POST.
The gateway decrypts only requests addressed to its configured service EOA,
verifies the requester's EIP-191 signature and expiry, and resolves the
requester's user PGP key from AddressPGP before encrypting the response.
Responses are posted through an Entry to the requester mailbox, where the
requester's own SSE receives them. SSE is therefore receive-only on each side;
it is not a socket carrying the upstream HTTP response directly.

The default policy permits only `GET` and `HEAD`, strips unapproved headers,
limits bodies to 8 MiB, and requires a loopback upstream. Keep the gateway
PGP and EOA keys in local `0600` files or systemd credentials. Do not pass
secret material as CLI arguments or environment variables.

Do **not** treat overlay Peer Locator completion as “Enterprise Gateway shipped.”

#### Verified `conet.network` deployment (2026-08-20)

The crate gateway was built natively for Linux and deployed on
`conet.network` as `conet-l0d-gateway.service`. The host also runs the
separate `conet-web3-origin-proxy.service`, which exposes the existing
`https://conet.network` origin only through loopback HTTP at
`127.0.0.1:8080`. Both services were verified active.

An end-to-end production-path smoke test used a fresh requester EOA/PGP
identity, the real AddressPGP registration endpoint, and a real Entry node.
The request target was:

```text
web3://0xA8386335F1a8C6Fab3798F36cd4F663Ce7bF5A53/
```

The response was HTTP `200` with `text/html`, and its SHA-256 matched a direct
fetch of `https://conet.network/` exactly. This validates the deployed
mailbox request/response path and origin adapter. It is not a direct public
port-80 mailbox, a new SI command, or evidence of production
multi-Guardian hosting.

## What it is not

| Other product | Difference |
| --- | --- |
| [SilentPass](silentpass-vpn.md) | Device/app **egress** to a public `host:port` (`SaaS_Sock5*`). Not L1 consensus P2P and not enterprise origin hosting. |
| [Run an L1 node](../developers/l1-node.md) public join path | Documented permissionless hubs still expose geth **8400** and beacon **4200/4300** for Internet peers. Destination architecture: wallet-addressed L0 gossip ([vision](../developers/l1-node.md#vision-wallet-addressed-consensus-transport)). |
| Validator client | `validator` only talks to **local** beacon. Do not capture its uid or read its keystore. |
| Current [UDP forward](../l0/udp-forward.md) | AES frames over HTTP/SSE — not raw OS UDP, not discv4. |
| [Duplex overlay](../l0/duplex-forward.md) | Application AES on two owned L0 occupy pipes. Offer on long-lived Chat listen; accept / reject / frames on occupied pipe. SI does **not** implement `duplex_*`. Occupy TCP must get HTTP **200** keep-alive (crate installs `pipe_tx` only after that). Second `l0_connect` is 409; Chat gossip must continue. Idle L0 needs SSE keepalives (no mining epoch); **occupied** L0 must **stop** comment keepalives. Occupied-pipe AES `duplex_accept` may omit `listenUserPgp`. User-PGP gossip always hits the Chat pool (idle L0 may get a copy). `duplex_reject` or missing accept keeps P1 gossip. After `l0_listen` **HTTP 200** (SSE still live), rebuild `l0_connect` (do not rebuild after the listen has already died). Occupy TCP EOF must clear `pipe_tx` and retry; leftover `pipe_tx` falls to P1 and cannot complete beacon `:4200`. On occupied teardown SI emits **`l0_pipe_end`** (inbound TCP) and optional **`l0_listen_released`** (listen SSE); conet-l0d clears its pipe and retries occupy. Restarted client: SI accepts a new `l0_listen` only if the previous occupy sockets are dead/stale; live occupy stays 409. |
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

Authorized **L0_ONLY `.45`** switches `--nat=extip` and `--p2p-host-ip` to the overlay vIP (`100.64.0.5`) and uses `--p2p-static-id`. **`.98` and production proposers keep the public IP.** Production hub **`.82`** (`100.64.0.7`) can still **accept other overlay geth on `:8400`** without changing `--nat` to the VIP. Overlay geth TCP alone was not enough; the 2026-08-18 lab also completed overlay beacon TCP.

These flags **advertise** the vIP. They do not bind Engine or HTTP to it.

L0 locators in toml are **wallet-addressed** (`web3://<EOA>/p2p/beacon` / `/p2p/geth`). Geth and Prysm still need an overlay IPv4 because they are unmodified. Point them at the **hub overlay VIP**, never the hub public IP. Full split: [Run an L1 node — two layers](../developers/l1-node.md#two-layers-l0-wallet-vs-overlay-vip-flags).

```bash
geth --nat extip:100.64.0.5 --port 8400 --discovery.port 8400 \
  --bootnodes "enode://<hub-key>@100.64.0.7:8400" \
  --nodiscover --netrestrict 100.64.0.0/10 \
  --http.addr 127.0.0.1 --authrpc.addr 127.0.0.1

beacon-chain --p2p-host-ip=100.64.0.5 --p2p-static-id \
  --p2p-tcp-port=4200 --p2p-udp-port=4300 \
  --p2p-allowlist=100.64.0.0/10 --no-discovery \
  --peer=/ip4/100.64.0.7/tcp/4200/p2p/<hub-live-peer-id> \
  --rpc-host=127.0.0.1 --grpc-gateway-host=127.0.0.1
```

Fetch `<hub-live-peer-id>` from the hub `:4100` identity API. Example production hub `.82`: VIP `100.64.0.7`, pinned id `16Uiu2HAmDJCHuVkXtkPrrL8YykQ9gFZnQkR9Q6WjZZUrmueohPfd`. Do **not** use `/ip4/<public-ip>/tcp/4200`. Identify may still list the hub public multiaddr; the allowlist gater refusing that address is expected, not a reason to put the public IP in `--peer`. If `admin_peers` already shows the **same geth node id** on `…@<public-ip>:8400`, `admin_removePeer` that URL first, then add the overlay enode.

Keep `--http.addr`, `--authrpc.addr`, `--rpc-host`, and `--p2p-local-ip` on loopback. Binding them to the overlay vIP can fail startup if the TUN is down.

Advertise-only flags do **not** stop geth/beacon when the TUN is absent; you simply have no overlay peers until `conet-l0d` is up.

### 4b. Production hub `.82` — other geth over L0

Hub `216.225.202.82` keeps the **public** geth enode (`…@216.225.202.82:8400`). Overlay VIP is `100.64.0.7`. Do **not** set hub `--nat` to that VIP. listen-DNAT **excludes** `:8400`; overlay TCP to `100.64.0.7:8400` hits the existing `*:8400` listen. Overlay beacon `--peer` is pinned with `--p2p-static-id` in `06_restart_node66.sh` `start_beacon` (systemd `ExecStart` → `start`; also `restart-beacon`). Keys: `consensus/beacondata/network-keys`. Current id: `16Uiu2HAmDJCHuVkXtkPrrL8YykQ9gFZnQkR9Q6WjZZUrmueohPfd`. Do **not** `systemctl restart conet-node66.service` (would bounce geth+validator).

Other overlay geth dial:

```text
enode://f1e249c97ce861441b3bd4832213cc634dd5c23d1a8722cd9c1aea28492779f6b64e012e8d97d56006d69be5224903ea5a787d8af68e9542db82ac1f76491dd5@100.64.0.7:8400
```

On the hub toml add a `[[peers]]` row for **that spoke** (locator + VIP + port `8400` + the spoke’s own geth user PGP — do not reuse hub `self-user.asc`). Bounce **only** `conet-l0d` hub then spoke. If the spoke is already peered to the **same node id** on the public enode, `admin_removePeer` the public URL first, then `admin_addPeer` the overlay enode. Hub / `.98` geth HTTP is **`:8889`**. Do **not** restart geth. Proof: overlay `ss` ESTAB to `100.64.0.7:8400`, duplex AES, **`geth.pid` unchanged**. **2026-08-20:** `.45` and `.98` overlay-ESTAB to `.82`. This does **not** mean every production proposer has left public listen. Crate notes: `docs/operator-flags.md`, `scripts/l0-prod82-hub.env`.

Lab hub **`.98` DHT-over-L0 toward `.82`** is **steer-only**: DNAT dest `216.225.202.82:4300`/`:4200` onto `100.64.0.7`. `.98` stays a public discv5 hub for `.45` — do **not** L0_ONLY isolate or last-wins allowlist `/32`. `start-shared-beacon-98.sh enable-l0-dht` writes env and does **not** restart EL/CL. **2026-08-20 ~07:13Z** authorized `.98` `restart-beacon` (geth untouched): `--disable-quic` + extra `.82` ENR. Overlay proof is **conntrack** reply `100.64.0.7` ↔ `100.64.0.6:4200`; `ss` may still show the public dest `216.225.202.82:4200` (DNAT original dest, not a leak). REST `last_seen` may list `/ip4/216.225.202.82/tcp/4200`. **Not** VIP↔VIP `ss` as the only proof. **Not** `FOLLOW_OK`. **Not** L0_ONLY anonymity on `.98`. Full verdict: [Lab evaluation](#lab-evaluation-2026-08-20-98-overlay-local-validator).

Phase 1: use **static** overlay bootnodes. The crate envelope already carries IPv4 including UDP. A lab may prove overlay UDP / DHT-port comms and live discv5 via L0 (`docs/P2.md` in the crate): `L0_DHT` drops static `--peer`, allowlists overlay plus the hub public `/32`, and DNATs that dest onto overlay (isolate still drops unsteered public P2P). Public-advertise and L0_ONLY beacons still bind the host public IP, so operator `overlay-beacon-listen-dnat.sh` maps overlay-VIP tcp/udp (except geth `:8400`) into that listen. The TUN needs `accept_local` / `route_localnet` / `rp_filter=0` so DNAT to a locally bound public IP reaches the socket; apply must not flush overlay geth `:8400`. discv5 / libp2p ephemeral replies must un-SNAT. If beacon `connected` later drops while overlay geth stays ESTAB, re-apply `overlay-dht-steer.sh` **first** (flushes ghost hub `:4200/:4300` conntrack; **do not** restart geth or beacon for that). Authorized `.45` `restart-beacon` is only for Prysm dial backoff after that flush (**~17:28Z** restored `connected=1` and `Processing blocks`). After that restart, do **not** re-apply steer immediately. After DNAT, `.45` `ss` may show ESTAB to hub public `:4200` (original dest, not a leak); overlay proof is TUN VIP + isolate DROP=0. First-minute `suitable=0` then `Processing blocks` is expected. That is not a production discv5 product, is **not** `FOLLOW_OK`, and does not close follow-the-chain. EL may stay `0x0`.

### 5. Stop — TUN and iptables go away

```bash
sudo conet-l0d stop --config /etc/conet-l0d.toml
# if the process died:
sudo conet-l0d teardown --config /etc/conet-l0d.toml
conet-l0d status --config /etc/conet-l0d.toml
```

Stop deletes only jumps into `CONET_L0D`, then the chain, then the overlay route/address/TUN. Foreign iptables rules stay.

## Lab evaluation (2026-08-20): `.98` overlay geth/beacon, local validator, L1 “mining”

**Question:** can lab hub `.98` (`198.251.77.98`, overlay VIP `100.64.0.6`) carry **geth `:8400` + Prysm beacon `:4200`** over Layer Minus, keep the **validator on the local beacon only**, and treat that as **anonymous ETH access to CoNET L1 consensus**?

**Answer in one line:** overlay geth and overlay beacon **TCP toward `.82` are accepted** after the authorized restart. The **validator client must stay on loopback**. This host is **not** origin-anonymous. This is **not** Guardian / LayerMinus DePIN mining ([Participate in mining](../developers/l1-mining.md)).

**Evidence:** authorized `.98` `restart-beacon` at **2026-08-20 ~07:13Z**. `geth.pid` stayed **3420373**. Beacon pid `3538592` → `3545184`. Then `overlay-beacon-listen-dnat.sh apply` (not steer). Live REST/RPC after that restart.

### Verdict

| Claim | Verdict |
| --- | --- |
| Overlay geth `.98` → `.82` | **Accepted** (`100.64.0.6` ↔ `100.64.0.7:8400` ESTAB + duplex AES) |
| Overlay beacon TCP `.98` → `.82` | **Accepted** (`--disable-quic`; extra `.82` ENR; conntrack overlay tuple) |
| `.98` stays a public discv5 hub for `.45` | **Accepted** (by design) |
| Origin-anonymous / L0_ONLY on `.98` | **Rejected** (still `--nat` / `--p2p-host-ip=198.251.77.98`) |
| Validator uses only the local beacon | **Architecture accepted**; **no `validator` process** on this hub (`validator.pid` missing; remote VA retired) |
| Anonymous origin as the **sole** slot-critical PoS path | **Not claimed** — public P2P still on; [publication gate](#slot-critical-publication-gate) unpublished |
| DePIN SI `command: mining` over this overlay | **Out of scope** |

### Planes (do not mix)

```text
validator (BLS keys)
  └─ loopback gRPC → local beacon  (--rpc-host=127.0.0.1)
       └─ Engine JWT → local geth
            ├─ public Internet   ← this `.98` still advertises 198.251.77.98
            └─ L0 overlay TUN    ← wallet locators; ports 8400 / 4200 (/ 4300 steer)
```

- `conet-l0d` **never captures** a configured `validator_uid`. The first iptables rule is `RETURN` `127.0.0.0/8`.
- Attest / propose gossip is **beacon + geth P2P**, not the validator binary.
- L0_ONLY **`.45`** advertises overlay VIP `100.64.0.5` and isolates unsteered public P2P. **`.98` is a dual-homed public hub** that *also* has overlay paths to `.82`.

Developer flags and spoke pattern: [Run an L1 node](../developers/l1-node.md#lab-evaluation-2026-08-20-98-overlay-local-validator). CLI notes: [Developers — conet-l0d](../developers/conet-l0d.md#lab-evaluation-2026-08-20-98-overlay-local-validator).

### Live snapshot (after ~07:13Z)

| Item | Value |
| --- | --- |
| Public / overlay VIP | `198.251.77.98` / `100.64.0.6` |
| geth HTTP | `:8889` — `eth_blockNumber` `0xe0661`; `net_peerCount` 9 including overlay `100.64.0.7:8400` and `100.64.0.5` |
| Beacon REST | `connected=14`; `sync_distance=0`; `el_offline=false`; `--disable-quic` |
| `.82` beacon TCP | steer DNAT `:4200` onto overlay; REST `last_seen` may still show the `.82` public IP |
| Validator | **Not running** |

Beacon `peer_id` (static): `16Uiu2HAmF1SXGHnne9DQTHGfgGQgje3cBV8pdSLJF25ajYKr2hvS`.

### What “anonymous ETH connection” means

The [L1 vision](../developers/l1-node.md#vision-wallet-addressed-consensus-transport) keeps **BLS validator identity** and moves **application-layer peer location** onto wallet / OpenPGP routes. Unmodified geth and Prysm only dial overlay VIPs; `conet-l0d` maps those to `web3://` locators.

On **this `.98` run**: geth/beacon **can** use L0 toward `.82`, and a validator **would** only talk to `127.0.0.1`. The host **still publishes** `198.251.77.98`. That is a **hybrid hub**, not origin anonymity.

To run permissionless L1 consensus with overlay as the **spoke** path: use the L0_ONLY pattern, keep `validator` on loopback, and **do not** treat this `.98` snapshot as that proof.

## Slot-critical publication gate

Lab ESTAB / AES / CL catch-up is **not** a cutover. **Do not** run overlay as the sole or primary 6-second slot-critical path until the table is **published against a public-P2P baseline** on a named proposer / attester set. Canonical engineering copy: [Run an L1 node](../developers/l1-node.md#slot-critical-publication-gate).

Prefer occupied duplex for steady TCP. Keep P1 for setup / wake / control / rare degrade. Do not collapse overlay ports onto one public routing wallet.

| Metric (must publish) | Why it is slot-critical | Status in this book |
| --- | --- | --- |
| L0 RTT **P50 / P95 / P99** | Attest / propose gossip must fit inside the slot plus processing | **Unpublished.** 2026-08-18 ~15 min lab snapshot: overlay TCP RTT ~475–750 ms vs ~40–55 ms on `.98` public peers ([QoS note](https://github.com/CoNET-project/CoNET-L0D/blob/main/docs/lab-overlay-qos-2026-08-18.md)). Not P50/P95/P99; not a proposer-set measurement |
| Block propagation to **50%** and **90%** of the measured validator set | Late blocks miss attestations | **Unpublished** |
| Attestation **inclusion delay** | Directly tracks whether overlay gossip is usable for duties | **Unpublished** |
| **Missed slots** | Operator-visible proposer failure | **Unpublished** vs public-P2P baseline |
| **Reorgs** | Extra latency / reordering can widen reorg risk | **Unpublished** vs public-P2P baseline |
| **Duplex reconnect** time | Occupy EOF / `l0_pipe_end` must return AES before the next duty | Crate **retries** occupy; **time unpublished**. Lab recoveries were often manual SI / `conet-l0d` bounce |
| **Guardian failover** time | Entry or mailbox B death must not stall attestations | **Unpublished.** Lab overlay used **one** mailbox B (`217.160.189.159`) |
| UDP / **discv5 loss** | Discovery and `:4300` overlay IPv4 | Lab window: application-layer POST/queue loss **0**; `.98` TUN `tx_dropped=937`. Not a published discv5 loss rate vs public UDP |
| **Same metrics on public P2P** (control) | Overlay-only numbers without a control are not a cutover | **Required.** Public listen remains the documented production substrate |

## Multi-Guardian and multi-Mailbox

Hiding a validator’s stable public `IP:port` is not enough if overlay traffic then funnels through **few mailboxes**. That trades validator **IP** concentration for **Guardian path** concentration.

Production overlay (when it is allowed to carry slot-critical gossip) **must** include:

| Requirement | Lab / crate today |
| --- | --- |
| Several **independent entries** (A / C), none equal to B | Lab uses existing Guardian `/post`; not a published multi-entry SLO |
| Several **mailboxes B** (distinct route keys) | Lab overlay sat on **one** B. Per-port `[[l0.channels]]` on the **same** B does **not** remove mailbox concentration |
| Several **ASNs** | **Not** demonstrated |
| Several **regions** | **Not** demonstrated |
| **One routing EOA per overlay port** (`8400` / `4200` / `4300`) | **In-crate** `[[l0.channels]]`; lab tomls use it. Do not bind two SSEs of the same pool to one EOA |
| **Automatic reconnect and failover** | Occupy EOF / `l0_pipe_end` **retry** is in-crate. Failover to a **different** mailbox / ASN is **not** a shipped product |

Until that diversity exists, keep **public P2P** as the slot-critical path. Developer mapping: [conet-l0d](../developers/conet-l0d.md#multi-guardian-and-multi-mailbox).

## Install as a systemd unit

Ship the crate unit `systemd/conet-l0d.service` (or copy it to `/etc/systemd/system/`). It already uses `ExecStart=conet-l0d start` and `ExecStop=conet-l0d stop` with `CAP_NET_ADMIN`. Do not put raw `iptables` in the unit.

```bash
sudo cp systemd/conet-l0d.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now conet-l0d
```

## 2026-08-20 dual-hub recovery record

The lab spoke `.45` uses overlay VIP `100.64.0.5` and static hubs `.82`
(`100.64.0.7`) and `.98` (`100.64.0.6`). The run confirmed that geth
`:8400` and beacon `:4200` are independent TCP planes: geth `ESTAB` does
not prove that Prysm is peered.

When Prysm reports `i/o timeout` followed by `dial backoff` to an overlay
`:4200` peer, first treat it as an overlay pipe, DNAT, conntrack, or stale
mailbox-occupy problem. A public-advertise hub can listen on its public
beacon address while the overlay peer dials its VIP, so
`overlay-beacon-listen-dnat.sh apply` is required. Repeated `l0_connect`
HTTP `409` means an exclusive SI occupy/pipe collision; P1 fallback logs
are not proof of duplex delivery.

Use this recovery order:

1. Read `peer_count`, `identity`, `ss -tn` for `:4200` and `:8400`, TUN
   VIPs, peer IDs, and `conet-l0d` logs.
2. Apply `overlay-beacon-listen-dnat.sh` on the hub and spoke. It must not
   flush geth `:8400`.
3. If `:4200` remains `SYN-SENT` with 409/404, bounce only `conet-l0d`,
   hub first and spoke second; re-apply listen-DNAT after each TUN or
   beacon-PID change. Do not immediately apply DHT steer after a beacon
   restart.
4. If 409 persists, an authorized operator may clear the stale SI occupy
   on mailbox B, wait for SI to become active, and repeat the ordered
   daemon bounce. Bouncing only the spoke is insufficient.
5. Only after the overlay TCP path is healthy, and only with explicit
   authorization, restart the named beacon if Prysm remains in dial
   backoff. Verify geth with `geth.pid`, not `pgrep -n geth`.

Accept recovery when the spoke has `connected >= 1`, overlay `:4200`
is `ESTAB`, and geth remains healthy. During CL catch-up, rising
`head_slot` and falling `sync_distance` are the progress proof;
`is_syncing=true`, `is_optimistic=true`, or EL `0x0` alone is not an
overlay failure. The recorded run restored `.45 → .82:4200 ESTAB` and
beacon `connected=1` after hub-then-spoke `conet-l0d` bounces, with the
geth PID unchanged. This is an operational recovery record, not a new SI
command or a production slot-critical cutover.

## Troubleshooting: beacon `connected=0` while overlay syncing

**geth overlay ESTAB does not mean beacon is peered.** Check `:4200` on its own.

| Symptom | Likely cause | What to do |
| --- | --- | --- |
| Prysm logs `dial backoff` to `/ip4/<hub-vip>/tcp/4200` | Failed dials then backoff; or TCP handshake never completes on overlay | Confirm hub `peer_id` matches `--peer`. Fix L0 occupy / DNAT first (below). Then authorized **`restart-beacon` on that host only** |
| `ss`: overlay SYN-SENT to `:4200`, never ESTAB | `:4200` `l0_connect` **HTTP 409** (pipe occupied) or lossy P1-only path | Soft-restart CoNET-SI on mailbox **B**; bounce **`conet-l0d` hub then spoke**; flush tcp **4200** conntrack; re-apply DNAT/steer |
| After SI fleet update, lab floods `409 Conflict` | B still holds exclusive `l0_listen` / `l0_connect` (ghost occupy after dead pipe) | SI must drop occupied listen when inbound/SSE is already dead, then accept the restarted client's `l0_listen`. If the SI on B is older: `pkill` SI on B; wait `active`; ordered l0d bounce hub then spoke — do not only bounce the spoke |
| Overlay `:8400` never duplex AES; hub `l0_listen` SSE ends ~every 64s; spoke `l0_connect` 404 then 409 | Idle L0 has no mining heartbeat so Entry/mailbox **60s socket idle** kills the listen; Chat gossip must not 409 after occupy; occupy TCP must write HTTP 200 keep-alive; occupied SSE must **stop** comment keepalives or AES first blob decrypts as garbage | Deploy SI idle keepalive + occupy `clearKeepalive` + `sourceSocket.setTimeout(0)` + occupy HTTP 200 + Chat-not-409; crate `pipe_tx` only after 200; AES accept blob omits bulky `listenUserPgp`. Prove **one** channel (`:8400`) ESTAB + bidirectional AES before beacon |
| Beacon drop while geth stays ESTAB; ghost NAT | Stale hub `:4200` conntrack after steer | `overlay-dht-steer.sh apply` / DNAT apply **without** restarting geth/beacon |
| After `restart-beacon` or TUN bounce, overlay `:4200` SYN-SENT | New beacon PID needs listen-DNAT retarget | Re-apply **`overlay-beacon-listen-dnat.sh`**. Do **not** immediately `overlay-dht-steer.sh apply` |
| `pgrep -n geth` looks like geth restarted | False match: beacon-chain argv contains the geth path | Read **`geth.pid` only** |
| Hub public `connected` briefly 0 after hub `restart-beacon` | Public peers reconnecting | Wait; spoke overlay `connected` is the overlay test |
| EL still `0x0` while `head_slot` rises | CL catch-up (`is_optimistic` common) | Do **not** restart geth. Proof of overlay CL sync is `head_slot`↑ and `sync_distance`↓ |
| Entry fake-armor instant “nginx” 404; real PGP hangs 8–15s | SI forward miss left the socket open (fixed in SI `b374d93+`) | Upgrade SI; do not treat the mimic 404 as a dead nginx |

**Recommended order (light → heavy):** DNAT/steer + conntrack → clear B SI occupy → ordered `conet-l0d` bounce → authorized `restart-beacon` (hub then spoke if both named). After a new beacon PID, re-apply **listen-DNAT**, not steer. Do **not** wipe chaindata. Overlay CL catch-up proof: `connected≥1` + overlay `:4200` ESTAB + **`head_slot` rising / `sync_distance` falling**. Full developer checklist: [Run an L1 node — overlay recovery](../developers/l1-node.md#beacon-connected0-over-overlay-recovery).

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
- The crate must not restart anyone’s geth, beacon, or validator. An authorized **operator** script may restart **only** the named lab host (`.45` L0_ONLY; `.98` `restart-beacon` only when that host is named in the same message). After authorized `restart-beacon`, re-apply **listen-DNAT**, not steer. Prove geth via **`geth.pid`**. Never wipe. Never mutate the daemon-owned `CONET_L0D` chain; public-P2P isolate uses `CONET_L0D_P2P_ISOLATE` / `_OUT`. Do not restart `.98` geth unless that host is authorized in the same message.
- Do not invent a new documentation or API hostname.

## What exists today

| Surface | Status |
| --- | --- |
| Crate [CoNET-L0D](https://github.com/CoNET-project/CoNET-L0D) | MVP accepted: TUN + iptables lifecycle; locator parse; example TOML; systemd unit. Overlay prefers **application duplex** on Chat gossip; P1 gossip if the peer app never sends `duplex_accept`. P1 outbound encrypt + mailbox wrap + `POST { data }`, inbound decrypt + TUN write-back, and listen HTTP+SSE workers exist in-crate (`[l0]` default off; listen is mock-tested and matches SI `checkSign`). Listen ingest matches SI gossip JSON `{ "data": "<armor>" }` plus duplex frames. An authorized lab may enable `[l0]`. Production mailbox delivery is **not** shipped |
| Production hub `.82` overlay geth inbound (`:8400`) | **2026-08-20:** hub `216.225.202.82` keeps public advertise; overlay VIP `100.64.0.7`. Other overlay geth dial `enode://f1e249c9…@100.64.0.7:8400` after a hub `[[peers]]` row with **that spoke’s** user PGP. Bounce only `conet-l0d` (hub then spoke). Do **not** change `--nat` to the VIP. listen-DNAT excludes `:8400`. If already connected on the public enode of the same node id, `admin_removePeer` first. Hub HTTP `:8889`. **`geth.pid` unchanged.** Overlay beacon `--p2p-static-id` via `06_restart_node66.sh` / systemd boot; peer `16Uiu2HAmDJCHuVkXtkPrrL8YykQ9gFZnQkR9Q6WjZZUrmueohPfd`. Lab `.45` and `.98` overlay-ESTAB to `.82`. **Not** a claim that every production proposer left public listen. Lab hub `.98` DHT-over-L0 toward `.82`: steer + **2026-08-20 ~07:13Z** authorized `restart-beacon` (`--disable-quic`). Overlay TCP proof = conntrack overlay tuple; `ss` may show public dest. Hybrid hub, **not** L0_ONLY. Validator on `.98` **not running**. See [Lab evaluation](#lab-evaluation-2026-08-20-98-overlay-local-validator) and [operator-flags](https://github.com/CoNET-project/CoNET-L0D/blob/main/docs/operator-flags.md) |
| Two-host lab (`.45` / `.98`) | **2026-08-18:** authorized L0_ONLY `.45` advertises overlay vIP `100.64.0.5`; overlay geth + beacon TCP ESTAB; both lab `conet-l0d` upgraded together for IPv4 batch + POST concurrency 32 (restart **only** l0d). After that binary, overlay queue-full is 0. Remaining limiter is Prysm initial-sync (~3.2 blocks/s, ~15 h). EL still `0x0`. Lab overlay UDP echo and `:4300` (direct + public-ENR steer) arrived on the peer TUN; lab discv5 via L0 is **accepted** (`.45` abandoned static `--peer`; bootstrap `.98` ENR; allowlist overlay then hub `/32` as two flags, last wins; overlay TCP/UDP steer DNAT; isolate drops unsteered public P2P; not `FOLLOW_OK`; not a production product). After DNAT, `.45` `ss` may show hub public `:4200` (original dest, not a leak); overlay proof is TUN VIP + isolate DROP=0. If beacon `connected` drops while overlay geth stays ESTAB, re-apply `overlay-dht-steer.sh` first (flush ghost conntrack; **do not** restart EL/CL). `restart-beacon` only after that flush if Prysm stays in dial backoff (**~17:28Z** restored `connected=1` and `Processing blocks`; do not re-apply steer immediately after start; first-minute `suitable=0` is expected). Read-only watch on `.45`: `scripts/watch-l0-follow.sh` (`FOLLOW_OK` = overlay ESTAB + peers + CL `is_syncing=false` / `sync_distance≤64` + EL leaves `0x0`). `.98` stays on public advertise and stays synced. **2026-08-20 ~04:09Z:** lab-only static overlay `--peer` (channels 8400+4200; no prod `.82`, no `:4300`/`L0_DHT` this run) after authorized hub-then-spoke `restart-beacon`: spoke `connected=1` outbound `/ip4/100.64.0.6/tcp/4200`; overlay ESTAB + AES on both ports; ~1 min `head_slot` `937984→938207` and `sync_distance` `32443→32228`. Re-apply **listen-DNAT** after TUN bounce / new beacon PID; do **not** immediately `overlay-dht-steer.sh apply`. Confirm geth unchanged via **`geth.pid`** (not `pgrep -n geth`). Hub public `connected` may drop to 0 then recover (`peer_id` static). EL still `0x0` + `is_optimistic=true` = catch-up. Restore `.45` public P2P with `stop-isolate` then a normal restart (no wipe) |
| Public operator / developer pages | This page and [Developers — conet-l0d](../developers/conet-l0d.md) |
| Application duplex | SI `l0_listen` / `l0_connect` occupancy pipe; offer / accept / frame as in [Duplex overlay](../l0/duplex-forward.md). **Not** SI `duplex_*` |
| Production SI `p2p_stream_*` / `listenKind: "l1p2p"` | **Not** a live command. Do not treat it as current SI. |
| Slot-critical overlay metrics vs public P2P | **Unpublished** as a cutover. See [publication gate](#slot-critical-publication-gate). Lab 15 min overlay RTT snapshot is not P50/P95/P99 |
| Multi-Guardian / multi-Mailbox | Lab overlay used **one** mailbox B. Per-port `[[l0.channels]]` ≠ path diversity. See [multi-Guardian](#multi-guardian-and-multi-mailbox) |

## Related

- [CoNET Web3 Application Protocol](../l0/web3-application-protocol.md) — URI / request / session draft for Enterprise Gateway
- [Developers — conet-l0d](../developers/conet-l0d.md)
- [Duplex overlay](../l0/duplex-forward.md)
- [Run an L1 node](../developers/l1-node.md) — [lab evaluation](../developers/l1-node.md#lab-evaluation-2026-08-20-98-overlay-local-validator) · [publication gate](../developers/l1-node.md#slot-critical-publication-gate)
- [Participate in mining](../developers/l1-mining.md) — DePIN gossip is a different plane
- [How to use Layer Minus](../l0/using-l0.md)
- [Wallet-addressed peer identity](../l0/wallet-address-p2p.md)
- [SilentPass](silentpass-vpn.md)
- [L0 development](../developers/l0.md)
- [TCP/IP substrate](../l0/tcp-ip.md)

## Current opaque transport teardown (2026-08-20)

The deterministic wallet/port `sessionId` design is retired. Each attachment
uses temporary listen wallet/PGP material and a fresh random opaque
`pipe_handle`; neither is derived from a public wallet, port, IP, or route.
Mailbox and entry SI components keep only hop-local handles and their own
waiting/occupied sockets. They do not receive the end-to-end AES key or a
cross-hop session map.

Only an occupied `l0_connect` TCP may carry this control line:

```json
{
  "type": "l0_pipe_end",
  "pipe_handle": "<64 lowercase hex>",
  "reason": "transport_closed"
}
```

No wallet, connector, `sessionId`, or `session_id` field is allowed. The
handle must match the handle already bound to that TCP. SSE does not emit or
interpret `l0_pipe_end`; there is no SSE-side same-name release event.

When an entry discovers that the downstream SSE is gone, it returns a transport
error such as `410 Gone` before keep-alive is committed, or closes the
already-established TCP with FIN/RST. The sender stops its packet loop and
reconnects only under bounded retry/backoff and occupancy limits. This prevents
a malicious listener from turning a healthy peer into a packet/DDoS amplifier.

### Two-minute occupied-pipe liveness

The occupied-pipe sender is responsible for putting application data on the
pipe at least once every 120 seconds. When no IPv4 traffic exists, `conet-l0d`
sends an encrypted `duplex_ping` application blob every 60 seconds; this is
not a fabricated IP packet and is not exposed to mailbox B.

The SSE listener measures inbound bytes, not only parsed IPv4 frames. If no
bytes arrive for 120 seconds, it treats the pipe as abandoned, closes its SSE,
and drops the local occupied writer. Closing the SSE lets the opposite
occupied TCP observe EOF and request its own bounded reconnect. After the
listener successfully posts a replacement SSE, a bidirectional client may
issue a fresh `l0_connect` request; stale `pipe_tx` state must never be reused.
