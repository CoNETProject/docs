# Run an L1 node

**Evidence level: Production reference.** The genesis files, peer IPs, and ports below were taken from the live CoNET L1 (`chainId` **224422**) on 2026-08-17. Fetch live ENRs at join time. Do not reuse a stale checkout of `genesis.json` from an engineering script tree.

Public site: [https://gitbook.conet.network/developers/l1-node.html](https://gitbook.conet.network/developers/l1-node.html)

Anyone may run a **geth + Prysm beacon** full node and, after depositing **32 CNET** per validator into the Beacon deposit contract, run a **Prysm validator**. That path is **permissionless**.

It is **not** Guardian `addNode`, **not** LayerMinus mining gossip, and **not** the `ValidatorDepositRedeem` application ledger. Those sets are documented on [Participate in mining](l1-mining.md).

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

Optional static multiaddrs use **TCP 4210** (DHT) or **TCP 4200** (production beacon) plus the matching live `peer_id`. Production beacon `peer_id` on `:4100` is **different** from the DHT sidecar on the same IP. If you pin `--peer`, curl `:4100` / `:4110` first.

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

Pass them to geth as `--bootnodes` (comma-separated) and/or `--nat=extip:<your-public-ip>`. Your advertised IP must match the address peers will dial.

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

The public bootnodes and inbound **8400 / 4200 / 4300** above remain the **production default**. A Linux daemon can add a **static overlay** path (`100.64.0.0/10`) for NAT or hosts without a stable public IP. It does not replace public P2P for the 6-second slot. P1 outbound + inbound decrypt/TUN write-back + EIP-191 listen worker + SI gossip JSON ingest exist in-crate; `[l0]` defaults off; an authorized lab may enable `[l0]`. The 2026-08-18 lab advertises overlay vIP on authorized L0_ONLY `.45`, completed overlay geth + beacon TCP, and is running CL initial-sync; EL still `0x0`. Lab overlay UDP / DHT-port comms accepted; lab discv5 via L0 accepted (`L0_DHT` allowlist = overlay + hub `/32`; packets still DNAT onto L0; after DNAT, `.45` `ss` may show hub public `:4200` — original dest, not a leak; not `FOLLOW_OK`; not a production product).

- Operator how-to: [Applications — L1 overlay daemon](../applications/conet-l0d.md)
- CLI, config, owned TUN / iptables: [Developers — conet-l0d](conet-l0d.md)

Advertise only: geth `--nat extip:<overlay-vIP>` and beacon `--p2p-host-ip=<overlay-vIP>`. Authorized L0_ONLY `.45` uses overlay vIP `100.64.0.5` plus `--p2p-static-id`. `.98` and production proposers keep the public IP. Keep Engine and HTTP on `127.0.0.1`. Do not bind `--http.addr`, `--authrpc.addr`, `--p2p-local-ip`, or `--rpc-host` to the overlay. Do not point SilentPass / `SaaS_Sock5` at these P2P ports.

## Stake a validator (optional)

After the node is synced:

1. Generate validator keystores with a current Ethereum staking-deposit tool or Prysm’s key tools. Keep the mnemonic offline.
2. Submit **32 CNET** per validator to [`0x4242424242424242424242424242424242424242`](https://mainnet.conet.network/address/0x4242424242424242424242424242424242424242) on `chainId` **224422**, using the deposit calldata for those keys.
3. Wait for the eth1 follow distance (**64** blocks) and the voting period (**4** epochs) before expecting the validator to appear.
4. Start `validator` against your local beacon, with **your** suggested fee recipient.

This page does not publish deposit private keys, operator wallets, or a hosted launchpad. A deposit to `ValidatorDepositRedeem` (`0xc71e…`) is a **different** application flow and does not by itself activate a Prysm validator.

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
- [Applications — L1 overlay daemon](../applications/conet-l0d.md)

## Next

[Participate in mining →](l1-mining.md)
