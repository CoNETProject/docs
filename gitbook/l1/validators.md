# Validators

**Evidence level: Production reference.** This page describes the active CoNET L1 consensus role and its operational boundary; it is not a runbook for any specific node.

CoNET L1 validators participate in proof-of-stake consensus on **`chainId 224422`**. Their duties affect the canonical ordering and finality of L1 blocks.

## Consensus role

The current L1 stack separates execution and consensus responsibilities:

- the execution layer validates EVM transactions and maintains state;
- the consensus layer coordinates proof-of-stake block agreement; and
- validator clients perform assigned proposal and attestation duties.

Execution-layer and consensus-layer peer networking remain part of L1 operation. Public JSON-RPC access is an application interface, not the validator network itself.

## Validators are not Guardian Nodes

An **L1 validator** participates in proof-of-stake consensus. A **Guardian Node** participates in the DePIN service plane and may provide routing, mailbox, bandwidth, or mining-gossip services.

The roles can be operated by related infrastructure, but they are not interchangeable:

- Guardian registration does not grant consensus voting power.
- Validator status does not automatically register a Guardian service.
- A count of registered Guardians is not a validator count.
- A runtime Guardian-miner count is not evidence of L1 consensus participation.

The term **validator committee** also appears in the CoNET-DLE design. That proposed per-ledger L2 committee is a separate protocol role and must not be confused with the validator set of CoNET L1.

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

Loopback-bound JSON-RPC, WebSocket, Engine API, consensus RPC, and monitoring ports are not substitutes for public P2P reachability and should not be exposed merely to make peering work. Exact ports, peer records, and startup commands are deployment-specific and must be taken from the current node configuration rather than copied from another node.

## Operational boundary

Validator lifecycle, reward, and deposit contracts are protocol implementation details and can evolve through controlled upgrades. Endpoint failures must be diagnosed against the active L1 RPCs:

- primary: `https://rpc1.conet.network`
- backup: `https://publicrpc.conet.network`

`https://rpc.conet.network` is deprecated and must not be used to judge validator state. The canonical Explorer is `https://mainnet.conet.network`.

Running validators are not, by themselves, a decentralization report. Stake units, owner concentration, client families, and upgrade authority are documented separately in [L1 decentralization](decentralization.md).

## Source anchors

- [Chain identity](chain-identity.md) — canonical network and endpoint policy
- [L1 decentralization](decentralization.md) — reproducible counts, stake, clients, and governance
- [Guardian Nodes](guardian-staking.md) — DePIN role boundary
- [CoNET-DLE overview](../l2/README.md) — distinct L2 committee terminology

## Next

[Decentralization and verifiability →](decentralization.md)
