# Validators

**Evidence level: Production reference.** This page describes the active CoNET L1 consensus role and its operational boundary; it is not a runbook for any specific node.

CoNET L1 validators participate in proof-of-stake consensus on **`chainId 224422`**. Their duties affect the canonical ordering and finality of L1 blocks.

## Consensus role

The current L1 stack separates execution and consensus responsibilities:

- the execution layer validates EVM transactions and maintains state;
- the consensus layer coordinates proof-of-stake block agreement; and
- validator clients perform assigned proposal and attestation duties.

Execution-layer and consensus-layer peer networking remain part of L1 operation. Public JSON-RPC access is an application interface, not the validator network itself.

**Network identity (destination):** CoNET aims to keep BLS validator identity while moving **application-layer** geth / beacon peer location onto wallet-addressed Layer Minus routes ([L1 vision](../developers/l1-node.md#vision-wallet-addressed-consensus-transport)). TCP/IP remains the substrate; a fixed public IP is not required as the long-lived P2P identity. **Today:** permissionless join still documents public hubs; [conet-l0d](../applications/conet-l0d.md) overlay is lab-proven / under development — not a claim that every production proposer already runs L0-only gossip.

The validator client still talks **only** to a **local** beacon. Overlay catch is geth / beacon P2P, never the deposit keystore. Lab hub `.98` (2026-08-20): overlay geth + overlay beacon TCP toward `.82` **accepted**; host still advertises a public IP; **no local `validator`** on that snapshot. [Lab evaluation](../applications/conet-l0d.md#lab-evaluation-2026-08-20-98-overlay-local-validator).

## Validators are not Guardian Nodes

An **L1 validator** participates in proof-of-stake consensus. A **Guardian Node** participates in the DePIN service plane and may provide routing, mailbox, bandwidth, or mining-gossip services.

The roles can be operated by related infrastructure, but they are not interchangeable:

- Guardian registration does not grant consensus voting power.
- Validator status does not automatically register a Guardian service.
- A count of registered Guardians is not a Beacon validator count.
- `ValidatorDepositRedeem.totalStakedValidatorCount()` is not a Beacon validator count.
- A runtime Guardian-miner count is not evidence of L1 consensus participation.

The term **validator committee** also appears in the CoNET-DLE design. That proposed per-ledger L2 committee is a separate protocol role and must not be confused with the validator set of CoNET L1.

## Three counts that are not interchangeable

| Count | Plane | What it measures | Snapshot / evidence |
| --- | --- | --- | --- |
| **Beacon `validator_index`** | L1 consensus (Prysm) | Indexes issued by the consensus-layer validator registry | [Block 169843](https://mainnet.conet.network/block/169843) withdrawals include index **2000** |
| **`totalStakedValidatorCount()`** | Application contract | Records funded through this `ValidatorDepositRedeem` (`fundAndDepositValidators`), used as a 32 CNET principal reserve | **475** at the 2026-08-14 decentralization snapshot |
| **Guardian `getAllNodes` / `getUniqueOwnerCount()`** | L0 DePIN registry | Registered Guardian IPs / owner addresses | **472** at the same snapshot |

The 472–475 band is the **L0 Guardian / VDR-managed** scale. It is not the size of the Prysm active validator set. An issued Beacon index can belong to an exited validator, so **≥ 2000** is a lower bound on registry allocation, not a live headcount. Reproduce the current figures from [L1 decentralization](decentralization.md).

## Network-layer privacy objective

CoNET’s DePIN routing work aims to reduce direct exposure of application communication endpoints. Wallet-address routes carry mailbox traffic through independent entries rather than treating a public IP as the participant’s identity. LayerMinus mining collectors are a separate infrastructure path: they directly attach to target SI nodes to receive signed gossip and must not be used as the application mailbox pattern.

This is a network-layer privacy and censorship-resistance objective. It does not replace proof of stake, eliminate execution/consensus peering, or define a separate algorithm called “stealth consensus.”

## Operator prerequisites

A validator stack is operational only when all of its dependent roles are healthy:

- an execution client is synchronized and connected to its consensus client through the authenticated Engine API;
- the consensus client has reachable consensus peers and a correct execution endpoint;
- the validator client has the intended keys, fee recipient, deposit state, and connectivity to its consensus client;
- the host clock is synchronized;
- the execution-layer P2P TCP/UDP ports and consensus-layer P2P TCP/UDP ports configured for that node are reachable through both host firewall and cloud ACLs; and
- advertised external IPs and peer records match the node that is actually listening.

Loopback-bound JSON-RPC, WebSocket, Engine API, consensus RPC, and monitoring ports are not substitutes for public P2P reachability and should not be exposed merely to make peering work.

To join the live network, download the published `genesis.json`, `genesis.ssz`, and `config.yml`, then follow [Run an L1 node](../developers/l1-node.md). That page lists the current DHT hubs, geth bootnodes, and ports. Do not copy another operator’s systemd units or a stale engineering `genesis.json`.

## Operational boundary

Validator lifecycle, reward, and deposit contracts are protocol implementation details and can evolve through controlled upgrades. Endpoint failures must be diagnosed against the active L1 RPCs:

- primary: `https://rpc1.conet.network`
- backup: `https://publicrpc.conet.network`

`https://rpc.conet.network` is deprecated and must not be used to judge validator state. The canonical Explorer is `https://mainnet.conet.network`.

Running validators are not, by themselves, a decentralization report. Stake units, owner concentration, client families, and upgrade authority are documented separately in [L1 decentralization](decentralization.md).

## Source anchors

- [Chain identity](chain-identity.md) — canonical network and endpoint policy
- [L1 decentralization](decentralization.md) — Beacon index, VDR ledger, Guardian counts, clients, and governance
- [Run an L1 node](../developers/l1-node.md) — genesis downloads, DHT / geth peers, join shape
- [Guardian Nodes](guardian-staking.md) — DePIN role boundary
- [CoNET-DLE overview](../l2/README.md) — distinct L2 committee terminology

## Next

[Decentralization and verifiability →](decentralization.md)
