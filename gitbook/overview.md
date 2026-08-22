# System overview

## Architectural thesis

CoNET separates concerns that are often collapsed into one “decentralized network” label:

1. **Who is the peer, and how is encrypted traffic forwarded?** — L0 Layer Minus, a PGP / wallet-address forwarding network. Applications combine it; L0 does not implement those products.
2. **Where does shared, production state settle?** — L1 CoNET Blockchain (EVM PoS, `chainId` **224422**).
3. **How can application activity scale into many specialized ledgers?** — L2 CoNET-DLE.
4. **How do hosts and consensus clients publish without a stable public origin IP?** — Application compositions on the same L0 plane: **conet-l0d** as L1 overlay (Role A) and intended **Web3 Enterprise Gateway** (Role B), plus the [Web3 Application Protocol](l0/web3-application-protocol.md) draft for wallet-addressed Web / API access.

Operational facts in this book come from current source code, deployed contracts, and live endpoints. Destination architecture is labeled separately from production join paths.

## Responsibility by layer

### L0 — communication

[Layer Minus](l0/README.md) is a **permissionless decentralized cloud** and a **PGP / wallet-address forwarding network**. Anyone may use it. Participants may offer CPU / GPU, forward traffic, and storage for **GB**. It retains TCP/IP as the physical transport but does not treat an IP address as the application identity. Wallet addresses, OpenPGP keys, and on-chain route registration provide the identity and routing inputs. If a node can decrypt an outer layer and the inner OpenPGP key ID is not local, SI forwards the inner armor.

**Any node may be malicious.** Developers compose privacy routing, data fragmentation, and other client cryptography so that privacy-first communications, storage, compute, and decentralized AI do not trust a single host. See [Permissionless cloud and zero-trust applications](l0/permissionless-cloud.md). [How to use L0](l0/using-l0.md) is application-layer work: each product chooses wallets, encryption targets, and the object carried inside the envelope.

A sender posts recipient-encrypted traffic to an entry node. The network routes it to the recipient's mailbox without requiring the sender to connect directly to that mailbox. An application mailbox listener also enters through a node other than the mailbox. This is the [A → B / C → B mailbox model](l0/mailbox-routing.md). Infrastructure mining collectors use a separate direct SI-listen path and must not be copied into Chat, presence, acknowledgement, or UDP delivery.

L0 is intended to reduce direct IP exposure and protocol-specific fingerprints. It does **not** make traffic analysis impossible, make compromised endpoints safe, or remove the public Internet from the path.

### Application protocol & host gateway (compositions on L0)

The [Web3 Application Protocol](l0/web3-application-protocol.md) is an **application-layer** draft: URI, signed request / response, session / delegation, Origin isolation, and errors for wallet-addressed hosts. It is **not** a new Layer Minus wire command; L0 still only forwards OpenPGP armor.

[conet-l0d](applications/conet-l0d.md) is the Linux daemon that composes that plane in two product roles:

| Role | Product name | Intent | Maturity in this book |
| --- | --- | --- | --- |
| **A** | L1 overlay daemon | Catch overlay so unmodified **geth / Prysm** peer over L0 | **Under development** / **lab-proven** |
| **B** | **CoNET Web3 Enterprise Gateway** | Publish existing Web / API / AI services as wallet-addressed hosts (origin IP hidden, wallet auth, protocol adapt) | **Destination** — not a public hosting product yet |

Do **not** equate Peer Locator (`web3://…`) completion with a finished Application Protocol or a shipped Enterprise Gateway.

### L1 — shared state and settlement

The [CoNET Blockchain](l1/README.md) is the production EVM network with `chainId` **224422**. It anchors network identity, validator and Guardian state, canonical assets, the [cross-chain Treasury](l1/cross-chain-treasury.md), and application settlement.

**Destination architecture:** L1 is not only “an EVM PoS chain with different parameters.” The intended composition is **wallet-addressed, privacy-routed consensus transport** — unmodified geth / Prysm behind [conet-l0d](applications/conet-l0d.md) / Layer Minus, so the long-lived peer identity is a routing EOA + OpenPGP route rather than a stable public `IP:port`. TCP/IP remains the physical substrate; IP is not erased. See [Run an L1 node — Vision](developers/l1-node.md#vision-wallet-addressed-consensus-transport).

**Honest maturity:** permissionless join still documents public hubs and P2P ports. Overlay peering is **lab-proven / under development**, not a published claim that every production proposer has abandoned public listen. Beacon `validator_index` values past **2000** are consensus-registry evidence; they are **not** a census of “validators already on L0-only gossip.”

Validator consensus, Guardian participation, and application state are related but distinct concerns. In particular, “stealth” describes the objective of reducing publicly exposed network topology; it is not the name of a separate consensus algorithm. Do not label `ValidatorDepositRedeem.totalStakedValidatorCount()` (~475) as the L1 Beacon set, and do not treat the Guardian registry (~472) as that census either. Those two figures are the L0 / VDR-managed scale. Beacon `validator_index` values already pass **2000**. See [L1 decentralization](l1/decentralization.md).

### L2 — specialized parallel ledgers

[CoNET-DLE](l2/README.md) specifies Decentralization Clusters and parallel atomic ledger classes for asset, storage, and trade activity. The design moves high-frequency application events away from one globally serial execution lane while retaining explicit archive, finality, and settlement rules. **EIP-155 Chain ID** is unique for the DLE plane (**CoNET-DLE Testnet** `0x44c45` / `281669`). User-visible **Group ID** for the first archive group is that group’s L1 register transaction hash. Lab M6 added a second live group; its user-visible Group ID is that group’s L1 `registerLiveGroup` transaction. Neither identifier is CoNET L1 `224422`.

The L2 section is a digest of the English whitepaper (revision **2026-08-18**) and normative specifications. It states design maturity separately from L0/L1 production status. A public [lab explorer](l2/explorer.md) at [https://dle.conet.network/](https://dle.conet.network/) inspects isolated Archive health, testnet `0x44c45`, the bootstrap Group ID hash, lab M6 **Clusters = 2**, and a **non-green** 30-day clock chip (`pilotStartedAt=2026-08-18T09:53:58.092Z`; clock ≠ qualification). The L1 [Global Archive Routing Registry](l2/routing-registry.md) is deployed; that does not launch Archive Certificate or asset ingress, and it does not yet register the second lab group.

For an ERC-20 issued elsewhere, entering CoNET L1 and activating DLE are different transitions. Treasury route execution can establish a canonical CoNET representation; [DLE asset admission](l2/cross-chain-assets.md) additionally requires its own pool, oracle, registry, gateway, conservation, and release gates.

## One composition, end to end

Consider a paid social post:

1. **Identity and delivery:** the publisher and reader use wallet-linked identities; encrypted payloads travel through L0 entry and mailbox routes.
2. **Rights and payment assets:** ownership, access rights, and settlement assets can be anchored on L1.
3. **High-frequency events:** reads, tips, boosts, or revenue shares can be modeled as L2 application events and periodically settled according to a DLE ledger class.

The broader stack supports very different products, but a product need not depend on every layer. [SilentPass](applications/silentpass-vpn.md) focuses on network access, [DePIN Chat](applications/depin-chat.md) on private messaging, [Beamio](applications/beamio.md) on wallet and merchant workflows, and [conet-l0d](applications/conet-l0d.md) on L1 overlay (today) plus intended enterprise host publish (destination).

A second composition is **wallet-addressed hosting**: a browser extension (client) resolves a Web3 Domain on L1, signs an Application Protocol request, and posts ciphertext through any healthy L0 entry; enterprise `conet-l0d` verifies the wallet / session and maps paths to local HTTP or API without requiring a public origin `IP:port`. That path is documented as **destination** — see [Web3 Application Protocol](l0/web3-application-protocol.md).

A proposed [miner-matched order-book exchange](applications/miner-orderbook-dex.md) illustrates another composition: externally issued ERC-20s first enter through explicit Treasury routes; admitted canonical assets can then be represented in signed limit orders; miner matchers coordinate deterministic fills; and a contract, rather than the matcher, controls final asset movement. The exchange remains a design study, not a shipped DLE application.

## How CoNET differs from adjacent designs

The comparison below is architectural, not a throughput or anonymity benchmark.

| Design family | Typical identity and route anchor | Primary strength | Different focus in CoNET |
| --- | --- | --- | --- |
| IP-native P2P / libp2p | IP, DNS, or multiaddress | General peer discovery and content protocols | Wallet/OpenPGP identity plus entry-to-mailbox routing; L1 destination = consensus gossip over that plane ([L1 vision](developers/l1-node.md#vision-wallet-addressed-consensus-transport)) |
| Content networks / IPFS | Content identifiers and provider records | Content-addressed distribution | Adds private message routing and L1/L2 settlement |
| Mix networks | Layered relay paths | Stronger traffic-correlation resistance, usually with latency cost | Uses ordinary HTTP(S)-shaped sessions and application-specific relays |
| Decentralized RPC / AVS | Public service endpoints plus stake | Replicated access to an existing chain or service | Couples a communication plane, an EVM L1, and application-ledger designs |
| Cloudflare Tunnel / Tor Onion / SIWE alone | Tunnel hostname, onion address, or login proof | Origin hiding or wallet login in isolation | Combines **wallet identity + L1 domain target + L0 routing + host gateway** (Enterprise Gateway destination) |
| Typical “L1 + L2” stacks | Public Internet as external P2P | Execution / scaling layers | CoNET supplies L0 itself; L1 consensus is intended as an L0 application, with DLE and product apps on the same stack |

## Security and engineering boundaries

- **End-to-end encryption is recipient-specific.** Entry and mailbox nodes must not be trusted with application plaintext.
- **Routing metadata still exists.** An entry sees the connecting client; a mailbox knows which route it serves. The design limits correlation by separating those roles.
- **A successful entry request is not proof of delivery.** Mailbox persistence and recipient acknowledgements provide the stronger delivery signal.
- **Short sessions trade state for overhead.** Fetch-and-Close reduces persistent-flow exposure but is not an anonymity protocol; Chat SSE remains a traffic fingerprint.
- **Wallet identity does not solve Sybil resistance alone.** Stake, admission, rate limits, or application policy are still required.
- **Backend must not trust client-supplied identity headers.** An Enterprise Gateway must strip colliding fields and inject only verified values.
- **Specification is not deployment.** DLE's normative design, a live L1 endpoint, the DLE lab explorer, and the Application Protocol draft have different evidence levels. The explorer does not make Archive Certificate or asset ingress live.

## Evidence map

| Question | Read |
| --- | --- |
| How are peers identified and messages forwarded? | [How to use L0](l0/using-l0.md), [wallet-addressed P2P](l0/wallet-address-p2p.md), [mailbox routing](l0/mailbox-routing.md) |
| Why is L0 a permissionless cloud, and why trust no node? | [Permissionless cloud and zero-trust applications](l0/permissionless-cloud.md) |
| What is the Web3 Application Protocol? | [Web3 Application Protocol](l0/web3-application-protocol.md) |
| What is the Web3 Enterprise Gateway? | [Applications — conet-l0d](applications/conet-l0d.md) (Role B) |
| How do I write an SI or Chat client? | [L0 development](developers/l0.md), [SI developer guide](l0/si-developer-guide.md), [Chat developer guide](l0/chat-developer-guide.md) |
| How do I run a geth + Prysm node (public join today)? | [Run an L1 node](developers/l1-node.md) |
| What is the L1-over-L0 vision? | [Run an L1 node — Vision](developers/l1-node.md#vision-wallet-addressed-consensus-transport) · [conet-l0d](developers/conet-l0d.md) |
| How do I participate in DePIN mining? | [Participate in mining](developers/l1-mining.md) |
| What does L0 actually protect? | [Security limits and threat grades](l0/security-limits.md) |
| Which chain and endpoints are current? | [Network identity](l1/chain-identity.md), [RPC and Explorer](l1/rpc-explorer.md) |
| What L1 decentralization facts can an outsider reproduce? | [Decentralization and verifiability](l1/decentralization.md) |
| How can an external ERC-20 enter CoNET and later use DLE? | [Bring an ERC-20 into CoNET](developers/l1-erc20-bridge.md), [Cross-chain Treasury](l1/cross-chain-treasury.md), [cross-chain assets in DLE](l2/cross-chain-assets.md) |
| How could miner matching support a non-custodial order book? | [Miner-matched order-book exchange](applications/miner-orderbook-dex.md) |
| What does DLE actually specify? | [L2 development](developers/l2.md), [Design thesis](l2/design-thesis.md), [normative specifications](l2/specs-index.md) |
| What does the DLE explorer show? | [DLE explorer](l2/explorer.md) — [https://dle.conet.network/](https://dle.conet.network/); lab Archive inspection, not a tip chain |
| Where are archive participant wallets recorded? | [Global Archive Routing Registry](l2/routing-registry.md) — CoNET L1 facade + `/archives` |
| What is usable versus under development? | [Applications](applications/README.md) |
| What does Beamio ship today (Consumer / Merchant / POS / USDC)? | [Beamio whitepaper](applications/beamio.md) · [Cash and USDC](applications/beamio/cash-and-usdc.md) |
| Where are source and live-service references? | [Resources](resources.md) |
