# L0 — Decentralized Cloud

**Maturity: Implemented capability.** A permissionless CoNET-SI fleet,
LayerMinus workers, storage services, and application integrations use L0
resources today. Resource availability, operator diversity, capacity, and
client coverage remain deployment-specific.

## Resource plane

L0 is CoNET's decentralized cloud resource plane. Participants can contribute
measurable infrastructure rather than placing every application behind one
stable platform origin.

| Resource | L0 role | Application responsibility |
|---|---|---|
| **Network forwarding** | Carry encrypted traffic between entries, routes, mailboxes, egresses, and application hosts | Select routes, encrypt for the correct recipient, authenticate responses, and handle failure |
| **Ciphertext storage** | Retain encrypted mailbox or fragment material | Define keys, fragmentation, redundancy, recovery, deletion, and availability checks |
| **Service hosting** | Expose wallet-addressed Web, API, AI, or TCP services through contributed hosts | Define the application protocol, authorization, isolation, and output verification |
| **Compute** | Contribute CPU/GPU capacity where an application defines work | Verify results and avoid trusting a single unproven provider |
| **Metering** | Measure eligible resource use in **GB** | Define who pays, what completion means, and how disputes are resolved |

L0 runs above the existing TCP/IP Internet. It is not a replacement IP
network, a new physical transport, or proof that participating machines are
independently controlled.

## Layer Minus uses L0

[Layer Minus](layer-minus.md) is the privacy-routing protocol built on these
resources. It binds durable wallet identity to OpenPGP and mailbox routes,
forwards recipient-encrypted traffic through separated entry and mailbox
roles, and uses HTTP(S)-shaped carriers.

The distinction is important:

- **L0 supplies decentralized cloud resources.**
- **Layer Minus specifies how wallet/OpenPGP-addressed ciphertext is routed
  across those resources.**
- **Application protocols** such as [`web3://`](web3-application-protocol.md)
  define request, response, stream, authorization, and rendering semantics.
- **Products** such as SilentPass, CoNET Chat, and Beamio compose these
  capabilities into user-facing behavior.

Layer Minus is not synonymous with L0, and an application using L0 does not
become an L0 wire command.

## Permissionless does not mean trusted

Any L0 participant may be unavailable, malicious, colluding, or incorrectly
configured. Applications must not give an infrastructure intermediary the
keys or plaintext it does not need.

Depending on the product, robust composition can require:

- recipient-specific encryption;
- separation of entry, mailbox, storage, compute, and application-host roles;
- fragmentation with independently controlled keys;
- redundant execution or verifiable outputs;
- acknowledgement and replay rules;
- local-first trusted state that is not erased by an untrusted network
  failure; and
- explicit payment, expiry, challenge, and recovery semantics.

These properties are application work. Fragmentation and operator
independence are not automatic properties of all L0 traffic.

## Freedom and privacy, precisely stated

Moving durable application identity away from one fixed public origin can
reduce dependence on a single intermediary and reduce direct origin
exposure. OpenPGP encryption prevents forwarding nodes from reading
application plaintext when clients use the correct keys. Separated roles can
limit what one participant observes.

The architecture does **not** promise absolute anonymity, untraceability,
unblockability, or immunity to traffic analysis. TCP/IP remains visible to
the endpoints of each connection. Stable wallets, timing, traffic volume,
browser identifiers, compromised devices, operator collusion, and
application-level logging can recreate linkability.

## Infrastructure relationships

```text
TCP/IP underlay
      │
      ▼
L0 contributed resources
      │
      ├── Layer Minus wallet/OpenPGP routing
      │       └── web3://, Chat, SilentPass, Beamio envelopes
      │
      ├── ciphertext storage and service hosting
      └── metered compute and forwarding

L1 anchors shared identity, assets, and settlement.
DLE L2 specifies specialized parallel application ledgers.
```

L1 and L2 complement L0; neither is replaced by Layer Minus. Public CoNET L1
nodes currently join through conventional geth and Prysm P2P. The
wallet-addressed L1-over-L0 overlay is an **under-development laboratory
capability**, not the production join requirement.

## Developer paths

| Goal | Start here |
|---|---|
| Understand the cloud and zero-trust model | [Permissionless cloud and zero-trust applications](permissionless-cloud.md) |
| Understand wallet/OpenPGP privacy routing | [Layer Minus](layer-minus.md) |
| Build a Layer Minus client | [L0 development](../developers/l0.md) |
| Implement SI `/post` behavior | [SI developer guide](si-developer-guide.md) |
| Implement Chat envelopes and receipts | [CoNET Chat developer guide](chat-developer-guide.md) |
| Build a wallet-addressed application | [`web3://` Application Protocol](web3-application-protocol.md) |
| Publish or open a Linux service | [`conet-l0d`](../developers/conet-l0d.md) |
| Review protocol security limits | [Security limits and threat grades](security-limits.md) |

## Related

- [System overview](../overview.md)
- [Layer Minus](layer-minus.md)
- [Node and client roles](node-roles.md)
- [Applications](../applications/README.md)
- [Developers](../developers/README.md)
- [Resources](../resources.md)
