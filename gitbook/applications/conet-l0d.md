# L1 overlay daemon (conet-l0d)

**Maturity: Under development.** Crate MVP is accepted (Linux command, TUN/iptables lifecycle, `web3://` locator, packet counters). P1 outbound encrypt + mailbox wrap + `POST { data }` and inbound decrypt + TUN write-back exist in-crate (`[l0]` default off). A lab host may run that binary with `[l0]` still off. Live mailbox SSE and a Layer Minus byte-stream on production SI are **not** a public end-to-end service yet. This label is not a security audit.

Public site: [https://gitbook.conet.network/applications/conet-l0d.html](https://gitbook.conet.network/applications/conet-l0d.html)

Developer CLI and config: [Developers — conet-l0d](../developers/conet-l0d.md)  
Design: crate whitepaper revision **2026-08-17** (milestone eval 21:50Z: crate MVP accepted; P1 outbound + inbound decrypt/TUN write-back in-crate; live mailbox SSE not opened; lab binary `[l0]` off) (pair in [CoNET-L0D/whitepaper](https://github.com/CoNET-project/CoNET-L0D/tree/main/whitepaper)).

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

Do not point SilentPass or `SaaS_Sock5` at your geth P2P port and call that “wallet-addressed L1 peering.”

## Who should run it

- An operator who already follows [Run an L1 node](../developers/l1-node.md).
- A host behind NAT, or without a stable public IP, that still wants a **static overlay peer**.
- A hub that publishes overlay locators as a **backup** path next to public bootnodes.

Production proposers should keep **public P2P** for the 6-second slot. L0-only peering is unmeasured and must not be the default.

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

**Do not** switch `--nat=extip` or `--p2p-host-ip` to the overlay vIP until a bidirectional overlay frame is proven on the peer TUN. A local TUN that only counts IPv4 is not enough. Lab hosts keep the **public IP** until then.

These flags **advertise** the vIP. They do not bind Engine or HTTP to it.

```bash
geth --nat extip:100.64.0.5 --bootnodes "enode://<peer-key>@100.64.0.1:8400" \
  --http.addr 127.0.0.1 --authrpc.addr 127.0.0.1 --port 8400

beacon-chain --p2p-host-ip=100.64.0.5 --p2p-tcp-port=4200 --p2p-udp-port=4300 \
  --rpc-host=127.0.0.1 --grpc-gateway-host=127.0.0.1
```

Keep `--http.addr`, `--authrpc.addr`, `--rpc-host`, and `--p2p-local-ip` on loopback. Binding them to the overlay vIP can fail startup if the TUN is down.

Advertise-only flags do **not** stop geth/beacon when the TUN is absent; you simply have no overlay peers until `conet-l0d` is up.

Phase 1: use **static** overlay bootnodes. Do not expect discv4/discv5 to ride L0.

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

MVP `resolve` parses the URI against the config table. AddressPGP `searchKey` ABI helpers exist in-crate. P1 encrypt + mailbox wrap + `POST { data }` exist in-crate when `[l0]` is on and peer user+route PGP files plus an entry are set; inbound decrypt + TUN write-back exist when `routing_key_file` is an OpenPGP secret cert. They stay **off** by default. A lab host may install that binary without enabling `[l0]`. Live mailbox SSE is **not** opened.

## Safety

- First iptables rule: `RETURN` `127.0.0.0/8` (Engine JWT, beacon gRPC, local RPC).
- Never capture a configured validator uid.
- Never REDIRECT `0.0.0.0/0:8400` or the whole public P2P space.
- Do not restart anyone’s geth, beacon, or validator from this product.
- Do not invent a new documentation or API hostname.

## What exists today

| Surface | Status |
| --- | --- |
| Crate [CoNET-L0D](https://github.com/CoNET-project/CoNET-L0D) | MVP accepted: TUN + iptables lifecycle; locator parse; example TOML; systemd unit. P1 outbound encrypt + mailbox wrap + `POST { data }` and inbound decrypt + TUN write-back exist in-crate (`[l0]` default off). A lab host may run that binary with `[l0]` still off. Live mailbox SSE and production mailbox delivery are **not** shipped |
| Two-host lab (`.45` / `.98`) | 2026-08-17 21:50Z: TUN up; `[l0]` off; public-IP geth + beacon peering after `.98` geth recovery; no validator; advertise stays public IP |
| Public operator / developer pages | This page and [Developers — conet-l0d](../developers/conet-l0d.md) |
| Production SI `p2p_stream_*` / `listenKind: "l1p2p"` | **Not** a live command. Do not treat it as current SI. |
| Measured L0 hop RTT for attestations | **Not** measured. Keep public P2P for slot-critical gossip. |

## Related

- [Developers — conet-l0d](../developers/conet-l0d.md)
- [Run an L1 node](../developers/l1-node.md)
- [How to use Layer Minus](../l0/using-l0.md)
- [Wallet-addressed peer identity](../l0/wallet-address-p2p.md)
- [SilentPass](silentpass-vpn.md)
- [L0 development](../developers/l0.md)
- [TCP/IP substrate](../l0/tcp-ip.md)
