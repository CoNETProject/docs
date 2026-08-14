# Guardian Nodes

**Evidence level: Production reference.** The registry contracts are live references; runtime reachability and service participation require separate current evidence.

Guardian Nodes belong to the CoNET DePIN service plane. Their identities and protocol relationships are anchored by contracts on CoNET L1, **`chainId 224422`**, but their service activity occurs through network processes rather than through L1 consensus voting.

## Registry and runtime state

An on-chain Guardian registry records admitted node identities and beneficiary relationships. Registry membership is durable chain state. It does not prove that a node is currently online or serving traffic.

A runtime Guardian service can involve:

- DePIN message routing and mailbox delivery;
- bandwidth or forwarding services, metered and compensated in **GBToken (`GB`)** for relaying ciphertext rather than for reading it;
- signed mining-gossip participation; and
- service accounting tied to a registered identity or beneficiary.

Operational liveness depends on reachable services, valid routing registration, active listeners, and accepted signed messages. Consequently:

> **Registered Guardian count, live Guardian count, and active-miner count are different measurements.**

A temporary difference between those counts is not evidence that L1 consensus has lost validators.

## Separation from validators

Guardian Nodes do not determine the canonical L1 chain merely by being registered. L1 validators are the proof-of-stake participants that propose or attest to blocks.

| Property | L1 validator | Guardian Node |
| --- | --- | --- |
| Primary plane | L1 consensus | DePIN services |
| Canonical-chain voting | Yes, through PoS duties | No, not by Guardian registration |
| Typical identity | Validator credentials and protocol records | Guardian wallet, route, and registry records |
| Runtime evidence | Consensus-client duties | Service liveness and signed service traffic |

One operator may run both roles, but documentation, telemetry, and accounting must keep them separate.

## Staking terminology

“Stake” is not one interchangeable balance across the protocol. At minimum, distinguish:

- L1 validator deposits, which secure proof-of-stake duties;
- Guardian admission or service economics, where applicable; and
- bonds used by separate settlement or L2 roles.

Do not infer one role from a deposit belonging to another ledger. In particular, a settlement bond or Guardian record must not be presented as an L1 validator deposit.

## Network identity

Wallet-address routing is intended to reduce dependence on a fixed public service IP and to improve resistance to targeted blocking. This is a network-layer design objective, not proof that a node is anonymous and not a replacement for L1 proof-of-stake consensus.

Read Guardian-related chain state through `https://rpc1.conet.network`, with `https://publicrpc.conet.network` as backup. Do not use the deprecated `https://rpc.conet.network`. Inspect contracts and transactions at `https://mainnet.conet.network`.

Registry membership is publicly readable. Admission is not permissionless: `addNode` and `removeNode` require `adminList`. Unique owner addresses, region labels, and the difference between those figures and L1 validator stake are recorded in [L1 decentralization](decentralization.md).

## Source anchors

- [`GuardianNodesInfoV6`](https://mainnet.conet.network/address/0xBC6b53065b5647261396d002bDBA0d3396E0722f) at `0xBC6b53065b5647261396d002bDBA0d3396E0722f` — on-chain Guardian registry and node records
- [`ValidatorDepositRedeem`](https://mainnet.conet.network/address/0xc71e246DD78B37C2fABc905D340932F28F503433) at `0xc71e246DD78B37C2fABc905D340932F28F503433` — validator deposits and beneficiary relationships; a separate role from Guardian registration
- `src/CoNET-SI/` — runtime routing, mailbox, and signed service traffic
- [L1 decentralization](decentralization.md) — reproducible Guardian counts, regions, and governance
- [Validators](validators.md) — L1 consensus role
- [Chain identity](chain-identity.md) — chain and endpoint authority
- [CoNET-DLE economics](../l2/economics.md) — separate L2 economic ledgers

## Next

[RPC and Explorer →](rpc-explorer.md)
