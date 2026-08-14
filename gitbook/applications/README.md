# Applications

CoNET applications turn protocol capabilities into user-facing behavior. They **combine** Layer Minus forwarding with CoNET L1 contracts and their own schemas; they are not an additional protocol layer.

Layer Minus itself is only a [PGP / wallet-address forwarding network](../l0/using-l0.md). Chat, SilentPass, mining, UDP, and merchant control each choose wallets, encryption targets, and the object inside the envelope.

## Maturity labels

These labels describe application availability, not security certification or service-level guarantees.

| Label | Meaning |
| --- | --- |
| **Public application** | A user-facing build or endpoint is publicly available. Published supporting sources are listed where they have been independently identified; individual surfaces and features may still be evolving. |
| **Integrated capability** | The capability is implemented inside another public application. It is not necessarily offered as a standalone product or general-purpose service. |
| **Under development** | The intended application and its protocol dependencies are documented, but an end-to-end public client is not available. |

These labels map to the book-wide evidence model: **Public application → Production reference**, **Integrated capability → Implemented capability**, and **Under development → Under development**.

## Choose by product need

| Product | Product role | Protocol capability translated into application behavior | Maturity | Page | Implementation evidence |
| --- | --- | --- | --- | --- | --- |
| **SilentPass VPN / Proxy** | Privacy-oriented device or application access | Wallet-authorized Layer Minus paths terminate in ordinary Internet connections; selected clients can rotate paths between connections | **Public application** | [SilentPass VPN](silentpass-vpn.md) | [SilentPass-iOS](https://github.com/CoNET-project/SilentPass-iOS) · [`@conet.project/mvp-si`](https://www.npmjs.com/package/@conet.project/mvp-si) |
| **Beamio** | Consumer wallet, Merchant OS, and POS suite | L1 identity and account state combine with L0 messaging for payments, merchant operations, terminal authorization, and wallet communication | **Public application** | [Beamio](beamio.md) | Consumer [`cashtree`](https://github.com/CoNET-project/SilentPassUI/tree/cashtree) · Merchant [`cashtrees`](https://github.com/CoNET-project/SilentPassUI/tree/cashtrees) · Alliance [`Alliance`](https://github.com/CoNET-project/SilentPassUI/tree/Alliance) · relay [`@settle402/sdk`](https://www.npmjs.com/package/@settle402/sdk) · POS live, no standalone public repo identified |
| **DePIN Chat** | Wallet-addressed messaging and typed business envelopes | User-key encryption, routed mailboxes, delivery acknowledgements, presence, and encrypted history become Messages and POS authorization flows | **Integrated capability** | [DePIN Chat](depin-chat.md) | [chat-sdk](https://github.com/CoNET-project/chat-sdk) · [`@conet.project/chat-sdk`](https://www.npmjs.com/package/@conet.project/chat-sdk) |
| **Institutional multisig AA** | Team-controlled Smart Wallet | V2 on-chain tasks, threshold votes, reservations, and policy locks become proposal, approval, and history screens | **Integrated capability** | [Institutional multisig AA](institutional-multisig-aa.md) | [SilentPassUI](https://github.com/CoNET-project/SilentPassUI) · [x402sdk](https://github.com/settleonbase/x402sdk) |
| **Miner-matched order-book exchange** | Proposed non-custodial ERC-20 market | Signed limit orders, replicated miner books, deterministic matching, and atomic settlement target CEX-like interaction without matcher custody | **Under development** | [Miner-matched order-book exchange](miner-orderbook-dex.md) | Design study; no public client, fungible order-book DLE specification, or audited settlement contract identified |
| **DePIN DCDN / BT distribution** | Planned bulk-content distribution | Wallet-addressed discovery, content hashes, and proposed seeding incentives are intended to form a piece-distribution application | **Under development** | [DePIN DCDN / BT](bt-dcdn.md) | Client not published · L0 [`mvp-si`](https://www.npmjs.com/package/@conet.project/mvp-si) / [`mvp-dl`](https://www.npmjs.com/package/@conet.project/mvp-dl) |

## Product role

This section answers one question: **how does a protocol primitive become an application capability?**

- Layer Minus forwarding becomes privacy access, wallet messaging, and terminal-control delivery when an application composes it that way. See [How to use Layer Minus](../l0/using-l0.md).
- CoNET L1 identity and contracts become wallets, team accounts, and merchant-facing state.
- Treasury-canonical assets plus a future deterministic matcher and settlement protocol could become a non-custodial order-book exchange.
- A future content-distribution client may combine L0 discovery with verifiable content pieces and an incentive layer.

Detailed contract APIs, node operations, economics, and screen-by-screen product manuals belong in their respective protocol or product documentation.

## Protocol dependencies

| Dependency | What applications use it for |
| --- | --- |
| **L0 / Layer Minus** | PGP / wallet-address forwarding, including peel-and-forward when a node can decrypt an outer layer whose inner key ID is not local. Product behavior is an application combination — [How to use L0](../l0/using-l0.md). Do not claim mix-net anonymity, Chat forward secrecy, or operator-independent A/B/C — [security limits](../l0/security-limits.md) |
| **L1 / CoNET** | Wallet identity, AddressPGP records, account and asset state, application registries, history pointers, and the [cross-chain Treasury](../l1/cross-chain-treasury.md) |
| **L2 / CoNET-DLE** | Specified prospective settlement designs for multi-party or high-frequency accounting; not a production dependency until the documented release gates close |
| **Application services** | Relaying, indexing, metadata delivery, local encrypted storage, and user-interface coordination where these are not direct protocol functions |

An application can depend on more than one tier without becoming a new tier itself.

## What exists today

- Public SilentPass and Beamio entry points, with published source links for the components explicitly identified on their product pages.
- DePIN Chat and institutional multisig AA integrated into Beamio application flows.
- Published L0 client and node packages that future applications can reuse.

The pages in this section distinguish observed implementation surfaces from broader architectural intent. “Exists today” does not imply independent audit, feature parity across platforms, guaranteed uptime, or completion of every roadmap item.

## What remains in development

- The miner-matched exchange still needs a versioned fungible order protocol, fair sequencing, matcher registry and challenge rules, audited settlement, public clients, live liquidity, and measured performance.
- DePIN DCDN / BT has no published end-to-end client and remains a design and implementation roadmap.
- Public applications still require continued hardening, interoperability testing, operational monitoring, and independent security review.
- Protocol-level capability does not automatically provide polished onboarding, recovery, abuse handling, accessibility, or support; each application must implement those concerns explicitly.

## Trust and security boundary

- **Wallet addressing is pseudonymous, not automatically anonymous.** Network metadata, timing, and public-chain activity can still be correlated.
- **Encryption does not remove endpoint trust.** A compromised client, recipient key, egress, or application service can still expose data within its role.
- **Availability is separate from confidentiality.** Entry, mailbox, relayer, RPC, or application outages can interrupt service without breaking message encryption.
- **Maturity is not an audit label.** No page in this section should be read as a claim of formal verification, regulatory approval, or protection against a global passive observer unless a specific external assessment is cited.

## Related

- [Developers](../developers/README.md)
- [How to use Layer Minus](../l0/using-l0.md)
- [SI developer guide](../l0/si-developer-guide.md)
- [Chat developer guide](../l0/chat-developer-guide.md)
- [L0 security limits](../l0/security-limits.md)
- [SilentPass VPN](silentpass-vpn.md)
- [Beamio](beamio.md)
- [DePIN Chat](depin-chat.md)
- [Institutional multisig AA](institutional-multisig-aa.md)
- [Miner-matched order-book exchange](miner-orderbook-dex.md)
- [DePIN DCDN / BT](bt-dcdn.md)
- [Use cases](../use-cases/README.md) — [NFT / Web of Trust](../use-cases/nft-web-of-trust.md), [Decentralized SNS](../use-cases/decentralized-sns.md), [creator economy / YouTube](../use-cases/decentralized-youtube.md)
- [Decentralized cross-chain Treasury](../l1/cross-chain-treasury.md)
- [Cross-chain assets in DLE](../l2/cross-chain-assets.md)
- [Resources](../resources.md) — full source and npm index
- Website: [https://conet.network](https://conet.network)
