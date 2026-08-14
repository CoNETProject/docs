# System overview

## Architectural thesis

CoNET separates three concerns that are often collapsed into one “decentralized network” label:

1. **Who is the peer, and how is encrypted traffic forwarded?** — L0 Layer Minus, a PGP / wallet-address forwarding network. Applications combine it; L0 does not implement those products.
2. **Where does shared, production state settle?** — L1 CoNET Blockchain.
3. **How can application activity scale into many specialized ledgers?** — L2 CoNET-DLE.

Operational facts in this book come from current source code, deployed contracts, and live endpoints.

## Responsibility by layer

### L0 — communication

[Layer Minus](l0/README.md) is a **permissionless decentralized cloud** and a **PGP / wallet-address forwarding network**. Anyone may use it. Participants may offer CPU / GPU, forward traffic, and storage for **GB**. It retains TCP/IP as the physical transport but does not treat an IP address as the application identity. Wallet addresses, OpenPGP keys, and on-chain route registration provide the identity and routing inputs. If a node can decrypt an outer layer and the inner OpenPGP key ID is not local, SI forwards the inner armor.

**Any node may be malicious.** Developers compose privacy routing, data fragmentation, and other client cryptography so that privacy-first communications, storage, compute, and decentralized AI do not trust a single host. See [Permissionless cloud and zero-trust applications](l0/permissionless-cloud.md). [How to use L0](l0/using-l0.md) is application-layer work: each product chooses wallets, encryption targets, and the object carried inside the envelope.

A sender posts recipient-encrypted traffic to an entry node. The network routes it to the recipient's mailbox without requiring the sender to connect directly to that mailbox. An application mailbox listener also enters through a node other than the mailbox. This is the [A → B / C → B mailbox model](l0/mailbox-routing.md). Infrastructure mining collectors use a separate direct SI-listen path and must not be copied into Chat, presence, acknowledgement, or UDP delivery.

L0 is intended to reduce direct IP exposure and protocol-specific fingerprints. It does **not** make traffic analysis impossible, make compromised endpoints safe, or remove the public Internet from the path.

### L1 — shared state and settlement

The [CoNET Blockchain](l1/README.md) is the production EVM network with `chainId` **224422**. It anchors network identity, validator and Guardian state, canonical assets, the [cross-chain Treasury](l1/cross-chain-treasury.md), and application settlement.

Validator consensus, Guardian participation, and application state are related but distinct concerns. In particular, “stealth” describes the objective of reducing publicly exposed network topology; it is not the name of a separate consensus algorithm.

### L2 — specialized parallel ledgers

[CoNET-DLE](l2/README.md) specifies Decentralization Clusters and parallel atomic ledger classes for asset, storage, and trade activity. The design moves high-frequency application events away from one globally serial execution lane while retaining explicit archive, finality, and settlement rules.

The L2 section is a digest of the English whitepaper and normative specifications. It states design maturity separately from L0/L1 production status.

For an ERC-20 issued elsewhere, entering CoNET L1 and activating DLE are different transitions. Treasury route execution can establish a canonical CoNET representation; [DLE asset admission](l2/cross-chain-assets.md) additionally requires its own pool, oracle, registry, gateway, conservation, and release gates.

## One composition, end to end

Consider a paid social post:

1. **Identity and delivery:** the publisher and reader use wallet-linked identities; encrypted payloads travel through L0 entry and mailbox routes.
2. **Rights and payment assets:** ownership, access rights, and settlement assets can be anchored on L1.
3. **High-frequency events:** reads, tips, boosts, or revenue shares can be modeled as L2 application events and periodically settled according to a DLE ledger class.

The broader stack supports very different products, but a product need not depend on every layer. [SilentPass](applications/silentpass-vpn.md) focuses on network access, [DePIN Chat](applications/depin-chat.md) on private messaging, and [Beamio](applications/beamio.md) on wallet and merchant workflows.

A proposed [miner-matched order-book exchange](applications/miner-orderbook-dex.md) illustrates another composition: externally issued ERC-20s first enter through explicit Treasury routes; admitted canonical assets can then be represented in signed limit orders; miner matchers coordinate deterministic fills; and a contract, rather than the matcher, controls final asset movement. The exchange remains a design study, not a shipped DLE application.

## How CoNET differs from adjacent designs

The comparison below is architectural, not a throughput or anonymity benchmark.

| Design family | Typical identity and route anchor | Primary strength | Different focus in CoNET |
| --- | --- | --- | --- |
| IP-native P2P / libp2p | IP, DNS, or multiaddress | General peer discovery and content protocols | Wallet/OpenPGP identity plus entry-to-mailbox routing |
| Content networks / IPFS | Content identifiers and provider records | Content-addressed distribution | Adds private message routing and L1/L2 settlement |
| Mix networks | Layered relay paths | Stronger traffic-correlation resistance, usually with latency cost | Uses ordinary HTTP(S)-shaped sessions and application-specific relays |
| Decentralized RPC / AVS | Public service endpoints plus stake | Replicated access to an existing chain or service | Couples a communication plane, an EVM L1, and application-ledger designs |

## Security and engineering boundaries

- **End-to-end encryption is recipient-specific.** Entry and mailbox nodes must not be trusted with application plaintext.
- **Routing metadata still exists.** An entry sees the connecting client; a mailbox knows which route it serves. The design limits correlation by separating those roles.
- **A successful entry request is not proof of delivery.** Mailbox persistence and recipient acknowledgements provide the stronger delivery signal.
- **Short sessions trade state for overhead.** Fetch-and-Close reduces persistent-flow exposure but is not an anonymity protocol; Chat SSE remains a traffic fingerprint.
- **Wallet identity does not solve Sybil resistance alone.** Stake, admission, rate limits, or application policy are still required.
- **Specification is not deployment.** DLE's normative design and a live L1 endpoint have different evidence levels.

## Evidence map

| Question | Read |
| --- | --- |
| How are peers identified and messages forwarded? | [How to use L0](l0/using-l0.md), [wallet-addressed P2P](l0/wallet-address-p2p.md), [mailbox routing](l0/mailbox-routing.md) |
| Why is L0 a permissionless cloud, and why trust no node? | [Permissionless cloud and zero-trust applications](l0/permissionless-cloud.md) |
| How do I write an SI or Chat client? | [L0 development](developers/l0.md), [SI developer guide](l0/si-developer-guide.md), [Chat developer guide](l0/chat-developer-guide.md) |
| How do I participate in DePIN mining? | [Participate in mining](developers/l1-mining.md) |
| What does L0 actually protect? | [Security limits and threat grades](l0/security-limits.md) |
| Which chain and endpoints are current? | [Network identity](l1/chain-identity.md), [RPC and Explorer](l1/rpc-explorer.md) |
| What L1 decentralization facts can an outsider reproduce? | [Decentralization and verifiability](l1/decentralization.md) |
| How can an external ERC-20 enter CoNET and later use DLE? | [Bring an ERC-20 into CoNET](developers/l1-erc20-bridge.md), [Cross-chain Treasury](l1/cross-chain-treasury.md), [cross-chain assets in DLE](l2/cross-chain-assets.md) |
| How could miner matching support a non-custodial order book? | [Miner-matched order-book exchange](applications/miner-orderbook-dex.md) |
| What does DLE actually specify? | [L2 development](developers/l2.md), [Design thesis](l2/design-thesis.md), [normative specifications](l2/specs-index.md) |
| What is usable versus under development? | [Applications](applications/README.md) |
| Where are source and live-service references? | [Resources](resources.md) |
