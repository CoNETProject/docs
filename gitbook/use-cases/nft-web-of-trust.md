# NFT provenance: creator, work, and verifiable history

**Status: economic design study.** This is the first step in the sequence [NFT provenance → decentralized SNS → long-form creator media](README.md). It defines the identity and provenance model that the later social and media economies depend on. It does not describe a generally available NFT marketplace or promise that every mechanism below is deployed.

Public site: [https://gitbook.conet.network/use-cases/nft-web-of-trust.html](https://gitbook.conet.network/use-cases/nft-web-of-trust.html)

## Thesis

The useful role of an NFT is not to manufacture scarcity around a file. It is to give a work a durable protocol identity that connects:

```text
creator  ↔  work  ↔  provenance
```

The creator signs the work’s origin. The work keeps a stable lineage. Later events—revisions, licensed access, paid support, transfers, and explicit derivatives—can append evidence to that lineage. Any conforming client should be able to reconstruct the same history from protocol-visible records rather than trusting one marketplace database.

This is the “new economy” proposed here: value may arise from attributable creation, continuity, access, contribution, and legitimate reuse. It is **not** a claim that token scarcity, floor prices, or speculative trading create durable value.

## Status and evidence boundary

### Current composable capabilities

- CoNET L1 is the production chain on which wallet signatures, contracts, assets, and settlement anchors can be recorded.
- [Beamio](../applications/beamio.md) documents wallet identity through EOA/AA accounts and `@BeamioTag`, plus wallet-attributable social-stat primitives.
- [DePIN Chat](../applications/depin-chat.md) is used by current Beamio surfaces for encrypted wallet messaging and typed business envelopes.
- [Assets on L1](../l1/assets.md) documents conet-USDC and other current asset roles.

These components can identify parties, carry signed messages, and anchor state. They do not by themselves constitute a complete creator-rights or provenance product.

### Design patterns

- A work is represented by an L1 NFT or equivalent stable subject identifier.
- CoNET-DLE **storage-class tips** are specified for fragmented content, sealed indexes, and buyer-bound delivery.
- CoNET-DLE **trade-class tips** are specified for listings or auctions that settle payment and move the subject NFT through an L1 Settlement contract.
- Lineage and sales journals connect originals, derivatives, and transfers over time.

These patterns are described in [L2 tip classes](../l2/tip-classes.md) and the DLE whitepaper. Specification is not deployment evidence.

### Still to implement or validate

- A complete authoring, rights-management, discovery, and marketplace client.
- End-to-end deployment evidence for the proposed DLE storage/trade flows.
- Independent reconstruction of provenance across multiple clients and indexers.
- Rights dispute, key recovery, revocation, migration, and long-term availability procedures.
- Economic and Sybil-resistance tests showing that recorded activity is useful evidence rather than inexpensive manipulation.

## The provenance graph

```text
Creator wallet
    │  signs origin and policy
    ▼
Work identifier
    │
    ├── revision / edition
    ├── access grant / paid unlock
    ├── transfer / sale
    ├── comment / endorsement
    └── derivative with parent pointer
             │
             ▼
      reconstructable provenance
```

Each edge has a precise claim and a precise limit:

| Edge | Evidence that can be recorded | What it does not prove |
| --- | --- | --- |
| **Origin** | A wallet signed a work hash, metadata root, and timestamp. | That the signer is the first human author or owns all legal rights. |
| **Revision** | A later work state references an earlier state. | That the change is artistically meaningful or authorized by every contributor. |
| **Access** | A wallet paid or received a cryptographic access grant. | A transfer of copyright unless the license explicitly says so. |
| **Engagement** | A wallet signed, paid for, or performed an action in a wallet-attributable way. | That the action represents an independent human opinion. |
| **Transfer** | Settlement moved payment and the protocol asset according to contract rules. | Resolution of off-chain fraud, sanctions, tax, or title disputes. |
| **Derivative** | A new work names a parent and a license or royalty policy. | That the derivative complies with law merely because the pointer exists. |

“Verifiable history” therefore means **verifiable protocol events**, not verified truth about every real-world fact.

## Why creator, work, and provenance must stay connected

The first NFT wave often split one creative relationship across unrelated systems:

| Fragmented model | Result |
| --- | --- |
| Creator profile belongs to a marketplace. | Losing the account can sever the public creator/work relationship. |
| Media lives at an unaudited URL. | The token survives while the referenced work disappears or changes. |
| Likes and comments live in a proprietary database. | A buyer cannot independently reproduce the history used to market the asset. |
| Payment goes through a custodial platform ledger. | Revenue can be delayed, redirected, or frozen by the platform of record. |
| Derivatives omit their parent. | Attribution, license obligations, and revenue-sharing relationships disappear. |

The proposed CoNET model keeps those facts on compatible identity, messaging, settlement, and lineage planes. A frontend may still disappear, but it should not be the sole source of the creator/work relationship.

## Cross-layer composition

| Tier | Contribution | Dependency and limit |
| --- | --- | --- |
| **L0 Layer Minus** | Private creator/fan communication and delivery coordination through wallet-addressed, zero-trust routes. | L0 protects business plaintext from intermediary hops; it does not prove authorship or guarantee content availability. See [mailbox routing](../l0/mailbox-routing.md). |
| **L1 CoNET** | Wallet identity, NFT or subject anchors, hashes, assets, social stats, and settlement contracts. | L1 records agreed state; it does not store large plaintext works or adjudicate legal ownership. |
| **L2 CoNET-DLE** | Proposed storage, trade, lineage, and sales journals on event-driven tips. | The relevant tip classes are design/specification work that still require deployment and product validation. |
| **Distribution applications** | Delivery of large media fragments to authorized readers or buyers. | [BT DCDN](../applications/bt-dcdn.md) is under development and must not be treated as current production video delivery. |

## Economic model without speculation

A provenance-centered work can support several non-speculative relationships:

| Relationship | Potential value |
| --- | --- |
| **Direct support** | A fan tips the creator without purchasing ownership. |
| **Licensed access** | A reader or viewer pays for bounded access under stated terms. |
| **Commission or bounty** | A patron funds a requested work or contribution. |
| **Edition or transfer** | A defined protocol right changes hands with an auditable settlement record. |
| **Authorized derivative** | A fork references its parent and can apply an explicit revenue-sharing policy. |
| **Reputation** | Reconstructable work and transaction history helps clients assess a creator or asset. |

None of these requires promising price appreciation. The NFT is valuable only to the extent that the attached rights, history, delivery, and community remain useful.

## Trust, privacy, and governance questions

- **Sybil resistance:** many wallets can manufacture endorsements, comments, or small payments. Clients need transparent weighting rules and must distinguish raw counts from stronger evidence such as paid access or established history.
- **Identity continuity:** compromised or rotated keys need a recovery and migration policy that preserves history without enabling silent authorship takeover.
- **Metadata integrity:** content hashes and manifests must be durable, versioned, and independently retrievable.
- **Privacy:** public provenance can reveal sensitive creator, buyer, and collaborator relationships. Selective disclosure and encrypted delivery require explicit product design.
- **Copyright:** a cryptographic origin claim is evidence, not automatic legal title. Licenses, jurisdiction, collective authorship, takedown disputes, and appeals remain open governance work.
- **Indexer neutrality:** a client that hides inconvenient events can misrepresent the graph. Independent replay and clear source precedence are required.

## Acceptance criteria for a real implementation

A product should not describe this model as live until it can demonstrate:

1. Two independent clients reconstruct the same creator/work lineage from protocol sources.
2. Content and metadata remain retrievable when one frontend or indexer is unavailable.
3. A purchase or access grant has a documented atomicity, refund, expiry, and key-recovery path.
4. A derivative records its parent and license policy in a machine-readable form.
5. Sybil and wash-activity tests are published, including what the system cannot prevent.
6. Legal and governance language distinguishes cryptographic provenance from copyright adjudication.

## Anti-patterns

- Marketing a token as an investment because its supply is scarce.
- Treating a mutable company URL as the work’s only durable reference.
- Calling marketplace-only likes or screenshots “on-chain provenance.”
- Using a payout address that cannot be connected to the stated creator or an auditable delegation.
- Recording a derivative without its parent or license.
- Claiming that a signature alone settles legal authorship.

## Continue reading

- [Use cases index](README.md)  
- **Next:** [Decentralized SNS](decentralized-sns.md) — a micropayment social economy built on the same provenance graph  
- **Then:** [Long-form creator media](decentralized-youtube.md)  
- [L2 asset, storage, and trade tips](../l2/tip-classes.md)  
- [L2 economics](../l2/economics.md)  
- [Assets on L1](../l1/assets.md)  
- [Beamio](../applications/beamio.md) · [DePIN Chat](../applications/depin-chat.md)  
- Whitepaper copyright and sales-journal design — [CoNET-DLE whitepaper](https://github.com/CoNET-project/CoNET-DLE/blob/main/src/whitepaper/Decentralization%20Cluster%20multi-chain.md) §4.8–§4.10
