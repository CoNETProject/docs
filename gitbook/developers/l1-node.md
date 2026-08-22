# Run an L1 node

**Evidence level: Production reference.** The genesis files, peer IPs, and ports below were taken from the live CoNET L1 (`chainId` **224422**) on 2026-08-17. Fetch live ENRs at join time. Do not reuse a stale checkout of `genesis.json` from an engineering script tree.

Public site: [https://gitbook.conet.network/developers/l1-node.html](https://gitbook.conet.network/developers/l1-node.html)

Anyone may run a **geth + Prysm beacon** full node and, after depositing **32 CNET** per validator into the Beacon deposit contract, run a **Prysm validator**. That path is **permissionless**.

It is **not** Guardian `addNode`, **not** LayerMinus mining gossip, and **not** the `ValidatorDepositRedeem` application ledger. Those sets are documented on [Participate in mining](l1-mining.md).

## Vision: wallet-addressed consensus transport

CoNET L1 keeps **Ethereum-compatible** proof-of-stake consensus (Beacon) and an **EVM** execution environment. The architectural destination is not “a PoS fork with different genesis parameters.” It is:

**A wallet-addressed, privacy-routed EVM proof-of-stake network** — geth and Prysm still speak TCP/UDP to neighbors, but the **long-lived application peer identity** is a wallet / OpenPGP route on [Layer Minus](../l0/using-l0.md), not a stable public `IP:port`.

| Role | Traditional Ethereum | CoNET destination (L1-over-L0) |
| --- | --- | --- |
| Validator identity | BLS public key | BLS public key (unchanged) |
| Application route identity | ENR / libp2p peer ID tied to IP | Routing **EOA** + OpenPGP keys |
| Network location | Public `IP:port` | Dynamic L0 entry / mailbox / occupied pipe |
| Gossip transport | TCP/UDP on the Internet | Encrypted L0 duplex (AES session) over ordinary HTTP(S)+TCP/IP substrate |
| Client code | Native P2P stacks | **Unmodified** geth / Prysm behind TUN + [conet-l0d](conet-l0d.md) |

The critical change is **separating long-lived node identity from network location**. A node can keep the same wallet route while changing ISP, data center, NAT, or Guardian entry — without publishing a stable reachable IP as its consensus neighbor identity.

**Accurate wording:** CoNET still uses TCP/IP underneath. Guardians and entries still need physical connectivity. Overlay VIPs such as `100.64.0.0/10` are **compatibility addresses** for unmodified clients. CoNET does **not** claim “no IP.” It claims that **a fixed public IP is not required as the application-layer P2P identity**.

### Two layers: L0 wallet vs overlay VIP flags

[conet-l0d](conet-l0d.md) maps overlay `(vip, port)` to a **`web3://<EOA>/p2p/…` locator** and the peer’s user PGP. That is the wallet-addressed hop. Unmodified **geth** and **Prysm** never see that EOA; they only dial an overlay IPv4 that the TUN already routes into L0.

| Layer | Identity you configure | Must you know the peer’s public IP? |
| --- | --- | --- |
| **L0** (`conet-l0d` toml) | `locator = "web3://<hub-eoa>/p2p/beacon"` (or `/p2p/geth`) + overlay VIP + user PGP | **No.** Entry / mailbox / occupy hide the origin. |
| **Beacon** (Prysm) | `--peer=/ip4/<hub-overlay-vip>/tcp/4200/p2p/<hub-static-id>` | **No.** Do **not** put `/ip4/<hub-public-ip>/tcp/4200` here. |
| **Geth** | `enode://<hub-nodekey>@<hub-overlay-vip>:8400` plus `--nodiscover --netrestrict 100.64.0.0/10` | **No.** Do **not** add the hub’s public enode (`…@<public-ip>:8400`) as the overlay static peer. |

Production hubs may still **advertise** a public `--p2p-host-ip` / `--nat=extip` so Internet joiners keep working. Prysm Identify can therefore list `/ip4/<public>/tcp/4200`. On an L0_ONLY spoke that is **expected noise**: `--p2p-allowlist=100.64.0.0/10` and `--no-discovery` make the connection gater refuse those public multiaddrs. Overlay proof is `ss` ESTAB `100.64.x.x` ↔ `100.64.y.y:4200` (and `:8400` for geth), not a log line about the hub’s public IP.

**Beacon `--peer` method (static overlay, lab-proven):**

1. Pin the hub beacon with `--p2p-static-id` (keys under `beacondata/network-keys`; backup **outside** `beacondata`). Do **not** wipe those keys or run `restart-beacon-clean`. Canonical IDs live in the crate file `scripts/l1-beacon-static-peers.env`.
2. On the spoke, pass **only** overlay VIP + that pinned id. Do **not** curl `.98` `:4100` `/eth/v1/node/identity` (HTTP 500 / nil ENR when `--no-discovery`). `.82` `:4100` identity works; `.98` id comes from `beacon.log` (`Running node with peer id of …`) or the env file.
   ```text
   --peer=/ip4/100.64.0.7/tcp/4200/p2p/16Uiu2HAmDJCHuVkXtkPrrL8YykQ9gFZnQkR9Q6WjZZUrmueohPfd
   --peer=/ip4/100.64.0.6/tcp/4200/p2p/16Uiu2HAmF1SXGHnne9DQTHGfgGQgje3cBV8pdSLJF25ajYKr2hvS
   ```
   Dual-hub spokes pass both overlay `--peer` flags. Public join uses the same `peer_id` with `216.225.202.82` / `198.251.77.98`. L0_ONLY allowlist refuses those public multiaddrs.
3. Do **not** write a combined `/tcp/4200/udp/4300` multiaddr (libp2p has no transport for that; Prysm then falls through to a public IP).
4. After an authorized `restart-beacon` **without** wiping `network-keys`, the `peer_id` stays the same. Confirm argv still has overlay `--peer` and re-apply `overlay-beacon-listen-dnat.sh`. Do not immediately re-apply DHT steer.

**Geth is not the same bug on a correctly isolated spoke.** `static-nodes.json` / `--bootnodes` must already be `@<hub-vip>:8400`. `admin_peers` `remoteAddress` should be `100.64.0.x:8400`, never the hub public IP. If the **same node id** is already connected on the public enode, `admin_removePeer` that URL first, then `admin_addPeer` the overlay enode. Do **not** change a production hub `--nat` to the overlay VIP (that would break public bootnodes). Hub HTTP for `admin_*` is often **`:8889`**, not `:8545`. Prove geth was not restarted by reading **`geth.pid`**.

### Why this matters

1. **Consensus-plane location privacy** — neighbors and external observers see wallet routes and L0 paths, not a permanent validator `IP:port` map.
2. **Higher cost for targeted DDoS** — attacks must discover and suppress dynamic entries and multiple Guardians, not only hammer one static host.
3. **NAT-friendly full nodes** — inbound public ports are not the only way to keep a static peer; L0 occupy / reverse paths can carry geth and beacon TCP.
4. **Upstream-compatible engineering** — L0 and L1 can be tested separately; public P2P remains a migration and emergency substrate.

### Production honesty (do not collapse vision into “already shipped”)

| Plane | Status in this book |
| --- | --- |
| Permissionless **join** docs | Public hubs, live ENRs, and inbound **8400 / 4200 / 4300** — see below |
| **conet-l0d** overlay | **Under development** / **lab-proven** (geth + beacon TCP, lab discv5 via L0) — not a claim that every production proposer has abandoned public listen |
| Beacon index **≥ 2000** | Consensus-registry allocation evidence ([decentralization](../l1/decentralization.md)) — **not** a census of “validators already on L0-only gossip” |

Until an explicit production cutover note is published with operator evidence (hubs, proposers, and the [slot-critical publication gate](#slot-critical-publication-gate)), treat **wallet-addressed L1 gossip** as the **destination architecture**, and treat **public P2P** as the documented permissionless join path and migration / fallback substrate.

### Slot-critical publication gate

A six-second slot (`SECONDS_PER_SLOT=6`) does not forgive optimistic routing. **Do not** call L0 the sole or primary slot-critical path until the table below is **published against a public-P2P baseline** on a named proposer / attester set. Lab ESTAB / AES / `head_slot` catch-up is **not** that publication.

Prefer **occupied duplex** for steady TCP; keep P1 for setup / wake / control / rare degrade — not the high-volume data plane. Do not collapse many overlay ports onto one public routing wallet.

| Metric (must publish) | Why it is slot-critical | Status in this book |
| --- | --- | --- |
| L0 RTT **P50 / P95 / P99** | Attest / propose gossip must fit inside the slot plus processing | **Unpublished.** 2026-08-18 ~15 min lab snapshot: overlay TCP RTT ~475–750 ms vs ~40–55 ms on `.98` public peers ([QoS note](https://github.com/CoNET-project/CoNET-L0D/blob/main/docs/lab-overlay-qos-2026-08-18.md)). That is **not** P50/P95/P99 and **not** a proposer-set measurement |
| Block propagation to **50%** and **90%** of the measured validator set | Late blocks miss attestations | **Unpublished** |
| Attestation **inclusion delay** | Directly tracks whether overlay gossip is usable for duties | **Unpublished** |
| **Missed slots** | Operator-visible proposer failure | **Unpublished** vs public-P2P baseline |
| **Reorgs** | Extra latency / reordering can widen reorg risk | **Unpublished** vs public-P2P baseline |
| **Duplex reconnect** time | Occupy EOF / `l0_pipe_end` must return AES before the next duty | Crate **retries** occupy; **time unpublished**. Lab recoveries were often manual SI / `conet-l0d` bounce |
| **Guardian failover** time | Entry or mailbox B death must not stall attestations | **Unpublished.** Lab overlay used **one** mailbox B (`217.160.189.159`) |
| UDP / **discv5 loss** | Discovery and `:4300` overlay IPv4 | Lab window: application-layer POST/queue loss **0**; `.98` TUN `tx_dropped=937`. **Not** a published discv5 loss rate vs public UDP |
| **Same metrics on public P2P** (control) | Overlay-only numbers without a control are not a cutover | **Required.** Public listen remains the documented production substrate |

Operator copy of this gate: [Applications — conet-l0d](../applications/conet-l0d.md#slot-critical-publication-gate).

### Multi-Guardian and multi-Mailbox

Hiding a validator’s **stable public `IP:port`** is not enough if overlay traffic then funnels through **few mailboxes**. That trades:

| From | Into |
| --- | --- |
| Validator **IP** concentration (easy to map and DDoS) | **Guardian path** concentration (few B occupy pipes / few ASN) |

Production overlay (when it is allowed to carry slot-critical gossip) **must** include:

| Requirement | Lab / crate today |
| --- | --- |
| Several **independent entries** (A / C), none equal to B | Lab uses existing Guardian `/post`; **not** a published multi-entry SLO |
| Several **mailboxes B** (distinct route keys) | Lab overlay sat on **one** B. Per-port `[[l0.channels]]` on the **same** B does **not** remove mailbox concentration |
| Several **ASNs** | **Not** demonstrated |
| Several **regions** | **Not** demonstrated |
| **One routing EOA per overlay port** (`8400` / `4200` / `4300`) | **In-crate** `[[l0.channels]]`; lab tomls use it. Still do not bind two SSEs of the same pool to one EOA |
| **Automatic reconnect and failover** | Occupy EOF / `l0_pipe_end` **retry** is in-crate. Failover to a **different** mailbox / ASN is **not** a shipped product |

Until that diversity exists, keep **public P2P** as the slot-critical path and treat L0 as NAT / backup / lab overlay.

## What you are joining

| Role | Permission | What it does |
| --- | --- | --- |
| **Execution + consensus node** | Open | Sync and serve the canonical L1 tip; peer on geth and Prysm P2P |
| **Beacon validator** | Open after a 32 CNET deposit | Propose and attest once the deposit is processed |
| **Guardian / DePIN miner** | **Permissioned** (`adminList` on `GuardianNodesInfoV6`) | L0 service plane — [Participate in mining](l1-mining.md) |
| **VDR stake record** | Application contract | `ValidatorDepositRedeem` 32 CNET ledger — **not** the Beacon deposit contract |

Do not treat `totalStakedValidatorCount()` as the Prysm active set. See [Validators](../l1/validators.md).

## Downloads

Host these three files next to your datadir. They are the **production** execution genesis, consensus genesis, and Prysm chain config.

| File | URL | SHA-256 |
| --- | --- | --- |
| `genesis.json` | [https://gitbook.conet.network/l1/network/genesis.json](https://gitbook.conet.network/l1/network/genesis.json) | `bc8e77990a5b76d75b6a2041a2ae4d69c9cda03d120b1434b8ce3e11296fde60` |
| `genesis.ssz` | [https://gitbook.conet.network/l1/network/genesis.ssz](https://gitbook.conet.network/l1/network/genesis.ssz) | `ae0a63e7bf175bb4312d5b728ff1eced7ceb4286ff5d7074cecbfa21dfd7fb46` |
| `config.yml` | [https://gitbook.conet.network/l1/network/config.yml](https://gitbook.conet.network/l1/network/config.yml) | `4bda580c4cfec801ecaed6fa04ad38bb9f1e941833fa7237ed5c6327f3cfbe24` |

Checksum list: [SHA256SUMS](https://gitbook.conet.network/l1/network/SHA256SUMS)

```bash
BASE=https://gitbook.conet.network/l1/network
mkdir -p conet-l1 && cd conet-l1
curl -fsSL -O "$BASE/genesis.json" -O "$BASE/genesis.ssz" -O "$BASE/config.yml" -O "$BASE/SHA256SUMS"
shasum -a 256 -c SHA256SUMS
```

A checksum mismatch means you must not `geth init` or start a beacon. Re-download; do not “fix” the files by hand.

## Chain parameters

Confirm genesis against a live beacon before you treat a local copy as authoritative:

```bash
curl -s http://38.102.126.50:4100/eth/v1/beacon/genesis
```

| Field | Value |
| --- | --- |
| `chainId` / deposit network | **224422** (`0x36ca6`) |
| `genesis_time` | `1781376367` |
| `genesis_fork_version` | `0x20000089` |
| `genesis_validators_root` | `0xacac7566fdf384a1ada45c01dcf9030d7eb0e1e5f5302659101d0b2a5bb59092` |
| Beacon deposit contract | [`0x4242424242424242424242424242424242424242`](https://mainnet.conet.network/address/0x4242424242424242424242424242424242424242) |
| Deposit per validator | **32 CNET** |
| Slot / epoch | `SECONDS_PER_SLOT=6`, `SLOTS_PER_EPOCH=32` |
| Eth1 follow | `ETH1_FOLLOW_DISTANCE=64`, `EPOCHS_PER_ETH1_VOTING_PERIOD=4` |
| Electra | **Disabled** (`ELECTRA_FORK_EPOCH` = `18446744073709551615`) |
| Recommended clients | geth **1.17.x**, Prysm **v7.1.4+** |

`config.yml` uses `PRESET_BASE: interop` and the fork versions above. Keep Electra disabled so the legacy deposit-contract path stays active.

The Beacon deposit contract is **`0x4242…4242`**. It is **not** [`ValidatorDepositRedeem`](https://mainnet.conet.network/address/0xc71e246DD78B37C2fABc905D340932F28F503433) (`0xc71e…`).

## Active L1 hosts

These six public IPs are the current execution / consensus / DHT hubs. Do **not** bootstrap from deprecated hosts (`216.225.192.76`, `207.90.192.71`, `38.102.85.33`, or other retired seeds).

| Public IP | Role |
| --- | --- |
| `38.102.126.30` | Archive RPC, DHT hub, production beacon |
| `38.102.126.50` | Public RPC, DHT hub, production beacon |
| `216.225.202.23` | Full node, validators, DHT hub |
| `216.225.202.22` | Full node, validators, DHT hub |
| `216.225.197.3` | Full node, validators, DHT hub |
| `216.225.202.82` | Full node, validators, DHT hub |

### Ports

| Plane | Port | Protocol | Expose on your host? |
| --- | --- | --- | --- |
| Geth P2P | **8400** | TCP + UDP | Yes, if you want inbound peers |
| Production beacon REST | **4100** | TCP | Read-only on hubs; bind yours to loopback unless you intend a public API |
| Production beacon P2P | **4200** / **4300** | TCP / UDP | Yes, if you want inbound consensus peers |
| DHT ENR API | **4110** | TCP | Optional; you do **not** need to run a DHT hub to join |
| DHT P2P | **4210** / **4310** | TCP / UDP | DHT hub only |

Do **not** expose Engine API (`authrpc`), JWT, geth HTTP/WS, beacon gRPC, or validator RPC to the public Internet. Bind those to `127.0.0.1`. Opening P2P is not the same as opening JSON-RPC.

### DHT servers (consensus bootstrap)

Prefer **live ENRs**. Peer IDs change if a DHT process is rebuilt.

```bash
for ep in \
  38.102.126.30:4110 \
  38.102.126.50:4110 \
  216.225.202.23:4110 \
  216.225.202.22:4110 \
  216.225.197.3:4110 \
  216.225.202.82:4110
do
  echo "== $ep"
  curl -s --connect-timeout 5 "http://${ep}/eth/v1/node/identity" \
    | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(d['peer_id']); print(d['enr'])"
done
```

Pass each `enr:` string to Prysm as `--bootstrap-node`. That is the supported join path.

Snapshot **DHT** `peer_id` values (2026-08-17, port **4110** — not the production beacon):

| Host | DHT `peer_id` (`:4110`) |
| --- | --- |
| `38.102.126.30` | `16Uiu2HAmQoVe9DeBo4gW1WEmXohZLk3ACUkEeRGmBM7B5NAjU4YD` |
| `38.102.126.50` | `16Uiu2HAm3a8Ak19rig7uwDKbWivRnjiwpfZNqZv6SsUeaTcBUPw8` |
| `216.225.202.23` | `16Uiu2HAmN51gXoyK9kyr5HkSWuRYizeA2m1ipW4fn3V3tGo1fCKs` |
| `216.225.202.22` | `16Uiu2HAmBcwKE21Y2WV2guKpwBDkDXvxqQ9hRn1agC1S2Aneg3Nq` |
| `216.225.197.3` | `16Uiu2HAkxR4cZAKjehmczq3teuYCAWqrkDmhsZLabJBa7QPyDj6q` |
| `216.225.202.82` | `16Uiu2HAmGnXxJijMnNHQfrngvNNMvTdESCuJyuzbEQfxPdKMFx3T` |

Optional static multiaddrs use **TCP 4210** (DHT) or **TCP 4200** (production beacon) plus the matching `peer_id`. Production beacon `peer_id` on `:4200` is **different** from the DHT sidecar on the same IP. **Do not** put a `:4110` DHT id (this table, including `.82` `16Uiu2HAmGnXx…`) into production beacon `--peer`. Canonical beacon `--peer` values are in crate `scripts/l1-beacon-static-peers.env`. Do **not** curl `.98` `:4100` for identity.

### Execution-layer bootnodes

Live geth `enode` records (P2P **8400**, 2026-08-17):

```text
enode://e5fe89d9ad924db6e4699480242a12fccba2c00e35772db706e46190c0ded9bb2b7e0d996826f5e46d369e01336213ef263c5038f94552e5f5e6e8ec76573a3f@38.102.126.30:8400
enode://d9243095bca94720f88d38c93ae4ccefc8b67651c66b4c93c915f845f6abfd39a091465db02db32b1a5b8061566c1558d2e6842f75620bf533480bab8a180168@38.102.126.50:8400
enode://5cf9a159e641318cda27e6bc1b4185667c0cdb1b54c3df5b8626eacbacea93af64c243dbdd09b40c62ba24792d0afc571cf17cbc47a5ed5a6207f27054c01d65@216.225.202.23:8400
enode://8e09d44bb4c29543a172e53dd8a74677a2a63d3d98a3d530f9d8b6f6bd6802a542f5b79d509ff737a9a764a66ab44a81403597cb50e350178ddd91f487e28f2d@216.225.202.22:8400
enode://dc0624c81896cdec036af7096886b1629a288b4824a467038df645c5c6b0f7fe75e13758ea80c0c37ba6245b221680db1fb553d564e54b55410eb6063bb64ca0@216.225.197.3:8400
enode://f1e249c97ce861441b3bd4832213cc634dd5c23d1a8722cd9c1aea28492779f6b64e012e8d97d56006d69be5224903ea5a787d8af68e9542db82ac1f76491dd5@216.225.202.82:8400
```

Overlay geth (Layer Minus, **not** a public bootnode): same node id as `.82` above, dest `100.64.0.7:8400`. Hub keeps public `--nat`. See [Applications — production hub `.82`](../applications/conet-l0d.md#4b-production-hub-82--other-geth-over-l0).

```text
enode://f1e249c97ce861441b3bd4832213cc634dd5c23d1a8722cd9c1aea28492779f6b64e012e8d97d56006d69be5224903ea5a787d8af68e9542db82ac1f76491dd5@100.64.0.7:8400
```

Pass the **public** list to geth as `--bootnodes` (comma-separated) and/or `--nat=extip:<your-public-ip>`. Your advertised IP must match the address peers will dial. Overlay spokes `admin_addPeer` the VIP enode after `conet-l0d` is up; do not put `100.64.0.7` in `--bootnodes` for machines without overlay.

Older bootnode lists that still name `216.225.192.76` or the historic `.50` id `206bf64b…` are **stale**. Use the list above.

## Start a full node

This is a shape, not a host rebuild script. Use your own datadir, JWT, and fee recipient. Do not copy another operator’s systemd units or secrets.

1. **Init execution** (once):

```bash
geth init --datadir ./execution ./genesis.json
```

2. **Run geth** with P2P on **8400**, Engine API on loopback, and the bootnodes above. Example flags:

```bash
geth \
  --datadir ./execution \
  --networkid 224422 \
  --port 8400 \
  --discovery.port 8400 \
  --nat extip:<YOUR_PUBLIC_IP> \
  --bootnodes "<enode1>,<enode2>,..." \
  --http --http.addr 127.0.0.1 --http.port 8545 --http.api eth,net,web3 \
  --authrpc.addr 127.0.0.1 --authrpc.port 8551 \
  --authrpc.jwtsecret ./jwtsecret \
  --authrpc.vhosts localhost
```

Use `gcmode=full` for a validator-only machine. Archive mode is optional and heavier.

3. **Run Prysm beacon** with the downloaded `genesis.ssz` and `config.yml`, Engine JWT, and **live** DHT ENRs:

```bash
beacon-chain \
  --accept-terms-of-use \
  --chain-id=224422 \
  --genesis-state=./genesis.ssz \
  --chain-config-file=./config.yml \
  --execution-endpoint=http://127.0.0.1:8551 \
  --jwt-secret=./jwtsecret \
  --deposit-contract=0x4242424242424242424242424242424242424242 \
  --p2p-host-ip=<YOUR_PUBLIC_IP> \
  --p2p-tcp-port=4200 \
  --p2p-udp-port=4300 \
  --rpc-host=127.0.0.1 \
  --grpc-gateway-host=127.0.0.1 \
  --bootstrap-node=<ENR from :4110> \
  --bootstrap-node=<ENR from another :4110>
```

Do not default to `--peer` against a single historic seed. Prefer several `--bootstrap-node` ENRs from the DHT list.

4. **Firewall / security group:** allow inbound **8400/tcp+udp** and **4200/tcp + 4300/udp** on *your* host. Opening only loopback RPC does not make you a peer.

5. **Sync check:** geth `admin.peers` should include at least one of the bootnodes; beacon should show peers and a rising head. Compare `eth_blockNumber` and beacon genesis root with `https://rpc1.conet.network` and a hub `:4100`.

`https://rpc.conet.network` is deprecated and must not be used to judge sync.

## Optional: overlay P2P (`conet-l0d`)

**Destination:** wallet-addressed L0 as the consensus gossip transport ([Vision](#vision-wallet-addressed-consensus-transport)). **Today:** permissionless join still documents **public** hubs and inbound **8400 / 4200 / 4300**. The Linux daemon ([conet-l0d](conet-l0d.md)) adds a **static overlay** (`100.64.0.0/10`) so unmodified geth / Prysm can peer over Layer Minus. Maturity: **Under development** / **lab-proven** (2026-08-18/19). It does **not** yet claim that every production proposer has left public listen.

Operator how-to: [Applications — L1 overlay daemon](../applications/conet-l0d.md)  
CLI / config / TUN ownership: [Developers — conet-l0d](conet-l0d.md)

### Deploy a spoke that peers over overlay

Use this when the host is NAT’d or you want a **fixed overlay peer** to a hub that already runs `conet-l0d`. Evidence level: **lab-proven** (2026-08-18/19); maturity remains **Under development**.

1. **Hub and spoke both run `conet-l0d`** with matching `[[peers]]` / `[[l0.channels]]` (ports **8400** geth, **4200** beacon TCP; optional **4300** UDP). Enable `[l0]` only on authorized host configs. Each overlay port should use its own routing EOA + listen SSE when you use channels.
2. **Start overlay before relying on peers**
   ```bash
   sudo conet-l0d start --config /etc/conet-l0d.toml
   # lab helpers (crate scripts): map VIP listen ↔ public bind; steer hub public dials onto overlay
   ./overlay-beacon-listen-dnat.sh apply
   ./overlay-dht-steer.sh apply   # when dialing a public hub ENR/IP then DNAT onto L0 (L0_ONLY `.45` → `.98`; also public hub `.98` → `.82`, steer-only, no isolate)
   ```
3. **Advertise overlay on the L0_ONLY spoke; keep RPC on loopback**
   ```bash
   # Spoke (example VIP 100.64.0.5) — advertise only; do not bind Engine/HTTP to the VIP
   geth --nat extip:100.64.0.5 --port 8400 --discovery.port 8400 \
     --bootnodes "enode://<hub-key>@100.64.0.6:8400" \
     --nodiscover --netrestrict 100.64.0.0/10 \
     --http.addr 127.0.0.1 --authrpc.addr 127.0.0.1

   beacon-chain --p2p-host-ip=100.64.0.5 --p2p-static-id \
     --p2p-tcp-port=4200 --p2p-udp-port=4300 \
     --p2p-allowlist=100.64.0.0/10 --no-discovery \
     --peer=/ip4/100.64.0.6/tcp/4200/p2p/16Uiu2HAmF1SXGHnne9DQTHGfgGQgje3cBV8pdSLJF25ajYKr2hvS \
     --rpc-host=127.0.0.1 --grpc-gateway-host=127.0.0.1
   ```
   Use the **pinned** hub `peer_id` from crate `scripts/l1-beacon-static-peers.env`. Do **not** curl `.98` `:4100` for identity (HTTP 500 / nil ENR when `--no-discovery`). The `--peer` host **must** be the hub overlay VIP (`100.64.0.6` / `100.64.0.7`), never the hub public IP — see [Two layers: L0 wallet vs overlay VIP flags](#two-layers-l0-wallet-vs-overlay-vip-flags). Production `.82` overlay `--peer` is `/ip4/100.64.0.7/tcp/4200/p2p/16Uiu2HAmDJCHuVkXtkPrrL8YykQ9gFZnQkR9Q6WjZZUrmueohPfd`.
4. **Hub** may keep `--p2p-host-ip=<public-ip>` and public peers. Overlay VIP listen still needs `overlay-beacon-listen-dnat.sh` so packets to `100.64.0.6:4200` (or production `.82` `100.64.0.7:4200`) reach the socket bound on the public IP. Geth `:8400` is **excluded** from that DNAT: overlay peers dial the hub VIP enode (`…@100.64.0.7:8400` for `.82`) while the hub keeps public advertise. Each new overlay geth needs its own hub `[[peers]]` user PGP; if already connected on the public enode of the same node id, `admin_removePeer` that URL first. Do not change production `--nat` to the overlay VIP.
5. **Do not** bind `--http.addr`, `--authrpc.addr`, `--p2p-local-ip`, or `--rpc-host` to the overlay VIP. Do not point SilentPass / `SaaS_Sock5` at these P2P ports.

### Sync check (overlay)

| Check | Healthy |
| --- | --- |
| TUN | `ip -4 addr show conet-l0` shows the spoke/hub VIP |
| Geth | `net_peerCount ≥ 1` and `ss` shows `100.64.x.x` ↔ `100.64.y.y:8400` **ESTAB** |
| Beacon | `GET /eth/v1/node/peer_count` → `connected ≥ 1` and `ss` shows overlay **`:4200` ESTAB** |
| Overlay CL progress | `head_slot` **rising** and `sync_distance` **falling** (lab 2026-08-20 ~04:09Z: ~1 min `937984→938207`, `32443→32228`) |
| Daemon | `duplex_offer accepted` and/or stable `duplex AES frame` on `:8400` / `:4200` (P1 alone is lossy for TCP handshake) |
| Geth still the same process | Read **`geth.pid`**. Do not use `pgrep -n geth` (beacon-chain argv contains the geth path) |

`geth` overlay ESTAB does **not** prove beacon is peered. Always check `:4200` separately. A large `sync_distance` with `is_syncing=true` (and often `is_optimistic=true` while EL is still `0x0`) means the node is catching up — that is not a peer failure. Hub public `connected` may dip to 0 after an authorized hub `restart-beacon`, then recover; the **spoke** overlay `connected` count is the overlay test.

### Beacon `connected=0` over overlay (recovery)

Lab incidents (2026-08-18/20) separated **overlay failure** from **Prysm dial backoff**. **2026-08-20** also proved **static overlay `--peer`** CL catch-up (not the `L0_DHT` / discv5 path):

| Symptom | Typical cause | Fix order |
| --- | --- | --- |
| `dial backoff` / `failed to dial …/tcp/4200` while SYN-SENT never becomes ESTAB | Occupied L0 pipe (**HTTP 409**) or broken DNAT/steer; TCP falls back to lossy P1 | Clear mailbox **B** SI occupy → bounce **`conet-l0d` hub then spoke** → flush tcp **4200** conntrack → re-apply DNAT/steer |
| Overlay geth ESTAB but beacon still `connected=0` | Same as above on the **4200** channel only; or Prysm backoff after failed dials | Fix `:4200` pipe first; then authorized **`restart-beacon` on that host only** |
| After SI fleet rollout, lab floods `l0_connect` / P1 **409** | Mailbox B still holds exclusive `l0_listen` / `l0_connect` | `pkill` SI on **B** (systemd restarts); wait until `active`; then ordered l0d bounce |
| Ghost hub `:4200` conntrack | Steer/DNAT left stale NAT | `overlay-dht-steer.sh apply` / DNAT apply **without** restarting geth/beacon |
| After `restart-beacon`, TUN bounce or a new beacon PID | Overlay listen-DNAT must retarget the new socket | Re-apply **`overlay-beacon-listen-dnat.sh`**. Do **not** immediately `overlay-dht-steer.sh apply` |
| `pgrep -n geth` PID changed, `geth.pid` did not | False match: beacon-chain argv contains the geth path | Trust **`geth.pid` only** |
| Hub public `connected` briefly 0 after hub `restart-beacon` | Public peers reconnecting | Wait; spoke overlay `connected` is the overlay test |

**Authorized recovery sequence (light → heavy):**

1. Confirm hub `peer_id` matches the spoke `--peer` multiaddr.
2. Re-apply `overlay-beacon-listen-dnat.sh` (both ends) and spoke `overlay-dht-steer.sh` if used; flush `conntrack` for tcp sport/dport **4200**.
3. If logs show **409**: soft-restart CoNET-SI on mailbox **B** only (`pkill` `dist/start.js`; do not wipe; do not restart geth/beacon for this step).
4. Bounce **`conet-l0d` on the hub first, then the spoke**; re-apply DNAT/steer after each start.
5. If Prysm still only logs **dial backoff**: restart **beacon only** (spoke: `./start-geth-beacon-only.sh restart-beacon`; hub only if that host is named in the same authorization). Do **not** wipe datadir; do **not** restart geth/validator. After the new beacon PID, re-apply **listen-DNAT**. Do **not** re-apply **steer** immediately after that restart.
6. Accept overlay CL sync: spoke `connected ≥ 1`; overlay `:4200` **ESTAB**; `:4200` AES without 409 flood; **`head_slot` rising and `sync_distance` falling**. EL still `0x0` is catch-up, not overlay failure.

To test **spoke overlay catch-up** (2026-08-20): lab-only toml with channels **8400+4200**; do **not** attach production `.82`, `dual.toml`, or `:4300` / `L0_DHT` for that run. Spoke uses `--no-discovery` plus overlay `--peer=/ip4/<hub-vip>/tcp/4200/p2p/<hub-peer-id>`.

Joining overlay does **not** authorize restarting anyone else’s chain clients. See also the operator page troubleshooting section.

## Stake a validator (optional)

After the node is synced:

1. Generate validator keystores with a current Ethereum staking-deposit tool or Prysm’s key tools. Keep the mnemonic offline.
2. Submit **32 CNET** per validator to [`0x4242424242424242424242424242424242424242`](https://mainnet.conet.network/address/0x4242424242424242424242424242424242424242) on `chainId` **224422**, using the deposit calldata for those keys.
3. Wait for the eth1 follow distance (**64** blocks) and the voting period (**4** epochs) before expecting the validator to appear.
4. Start `validator` against your local beacon, with **your** suggested fee recipient.

This page does not publish deposit private keys. Keep the mnemonic and keystore offline.

The validator client talks **only** to that local beacon (loopback gRPC). `conet-l0d` must not capture its uid or read the deposit keystore. Overlay / public P2P is a **geth + beacon** concern. See [lab evaluation](#lab-evaluation-2026-08-20-98-overlay-local-validator).

## Lab evaluation (2026-08-20): `.98` overlay geth/beacon, local validator, L1 “mining”

Lab hub `.98` can run **geth and beacon over L0 toward `.82`** while remaining a **public discv5 hub**. A Prysm `validator` on that host **would** use only `127.0.0.1`. That composition is **not** origin anonymity and **not** DePIN mining gossip.

| Host role | Overlay geth/beacon | Public advertise | Local `validator` |
| --- | --- | --- | --- |
| L0_ONLY spoke `.45` | Lab-proven toward `.98` / `.82` | Overlay VIP `100.64.0.5` (isolate unsteered public P2P) | Optional; always loopback |
| Hybrid hub `.98` | **Accepted** toward `.82` (`:8400` + `:4200` TCP after ~07:13Z `restart-beacon`) | **Yes** `198.251.77.98` | **Not running** on this snapshot |
| Production hub `.82` | Accepts overlay geth inbound; keeps public `--nat` | **Yes** | Independent; do not overlay the VA |

Full verdict: [Applications — conet-l0d](../applications/conet-l0d.md#lab-evaluation-2026-08-20-98-overlay-local-validator). Developer CLI: [conet-l0d](conet-l0d.md#lab-evaluation-2026-08-20-98-overlay-local-validator).

**Anonymous ETH connection (destination vs this lab):** Vision keeps **BLS identity** and hides **stable public `IP:port`** as the application-layer peer id. Unmodified clients dial overlay VIPs. **`.98` still publishes its public IP**, so neighbors can still map that hub. Use the L0_ONLY spoke pattern if you need overlay as the **spoke** gossip path. Do not claim slot-critical attestations are L0-only until the [publication gate](#slot-critical-publication-gate) is filled vs public P2P. A single mailbox B is [path concentration](#multi-guardian-and-multi-mailbox), not origin anonymity.

## Safety boundary

- Joining does **not** require, and this book does **not** authorize, restarting anyone else’s geth, beacon, or validator.
- Do not wipe `chaindata` / beacon data on a machine that is already producing.
- Do not expose Engine API or validator keys.
- Do not invent a new download hostname; the files live under `https://gitbook.conet.network/l1/network/`.

## Related

- [Validators](../l1/validators.md) — consensus role vs Guardian vs VDR
- [Network identity](../l1/chain-identity.md) — `chainId` and RPC policy
- [RPC and Explorer](../l1/rpc-explorer.md) — application JSON-RPC (not P2P)
- [Participate in mining](l1-mining.md) — permissioned DePIN gossip
- [L1 decentralization](../l1/decentralization.md) — three counts that are not interchangeable
- [conet-l0d](conet-l0d.md) — optional overlay catch (Under development)
- [Applications — L1 overlay daemon](../applications/conet-l0d.md) — [lab evaluation](../applications/conet-l0d.md#lab-evaluation-2026-08-20-98-overlay-local-validator) · [publication gate](../applications/conet-l0d.md#slot-critical-publication-gate)

## Next

[Participate in mining →](l1-mining.md)
