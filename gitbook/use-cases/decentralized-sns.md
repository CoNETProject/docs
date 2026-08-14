# Decentralized SNS: a micropayment social economy

**Status: economic design study.** This page follows [NFT provenance and Web of Trust](nft-web-of-trust.md) and precedes [long-form creator media](decentralized-youtube.md). It proposes a wallet-native social economy built from current CoNET identity and messaging components plus CoNET-DLE micropayment designs. It does not claim that a complete decentralized SNS is generally available.

Public site: [https://gitbook.conet.network/use-cases/decentralized-sns.html](https://gitbook.conet.network/use-cases/decentralized-sns.html)

## Thesis

Decentralizing storage is not enough to create a new social network economy. If revenue still depends on advertising, a custodial platform balance, or speculative token emissions, the incentive system remains substantially Web2.

The proposed CoNET SNS uses **CoNET-DLE micropayments as its economic engine**:

- tips make appreciation transferable;
- paid posts make individual works sellable without a subscription platform ledger;
- gated access makes communities and archives sustainable;
- boosts make attention purchases explicit and auditable;
- bounties turn conversations into coordination markets.

The intended result is a social network in which wallets can exchange attention, access, and value directly, while feed clients compete on discovery and moderation rather than owning the only ledger of creator income.

## Status and evidence boundary

### Current composable capabilities

- [DePIN Chat](../applications/depin-chat.md) currently provides wallet-to-wallet encrypted messaging, mailbox delivery, presence, receipts, and encrypted history in Beamio.
- [Beamio](../applications/beamio.md) provides EOA/AA wallet identity, `@BeamioTag`, current social-stat primitives, and gas-relayed application writes.
- CoNET L1 provides signatures, contracts, and assets including conet-USDC as documented in [Assets on L1](../l1/assets.md).

These are useful social and settlement building blocks. They are not a public feed, recommendation system, moderation network, or DLE micropayment SNS.

### Design patterns

- CoNET-DLE event-driven tips are designed as parallel ledgers for small, frequent social payments.
- L1 anchors identity, assets, access policies, and settlement outcomes.
- L0 carries private messages, notifications, and delivery coordination without giving intermediate hops business plaintext.
- A protocol-visible graph connects posts and creators to signed or paid interactions.

The DLE role is specified in [L2 design thesis](../l2/design-thesis.md), [tip classes](../l2/tip-classes.md), and [economics](../l2/economics.md). Those documents define a direction and invariants; they do not prove a deployed SNS.

### Still to implement or validate

- Consumer-grade feed, composer, moderation, search, recommendation, and mobile UX.
- Deployed DLE micropayment flows for each social action and published performance measurements.
- Non-custodial payment sessions that make small payments fast without granting dangerous standing authority.
- Atomic paid-content access, refunds, expiry, recurring authorization, and creator payout rules.
- Anti-spam, Sybil resistance, copyright procedure, community governance, and ranking transparency.

## Economic progression from provenance to social activity

The previous study establishes:

```text
creator ↔ work ↔ provenance
```

An SNS adds high-frequency relationships:

```text
follower wallet
    │
    ├── follow / reply / endorse
    ├── tip / unlock / subscribe
    ├── boost / sponsor
    └── fund / complete bounty
             │
             ▼
creator and work history
```

Free social actions remain important, but paid actions introduce explicit economic intent. A payment is not automatically a truthful endorsement; it is stronger evidence only in the narrow sense that the actor accepted a cost.

## DLE-native social primitives

| Primitive | Intended user experience | Proposed settlement pattern | Unresolved questions |
| --- | --- | --- | --- |
| **Tip** | Send a small amount to a creator, post, or reply. | Event-driven DLE payment with an L1 asset and final settlement to the recipient wallet. | Minimum size, batching, fee ratio, refunds, sanctions exposure, and dust attacks. |
| **Paid post** | Pay once to reveal an article, media item, or thread. | Bind payment to a time-bounded or durable access grant; deliver encrypted content after confirmed settlement. | Payment/access atomicity, key recovery, content quality disputes, resale, and refund policy. |
| **Gated access** | Enter a community, archive, or creator channel for a period. | Voucher, pass, or renewable access state funded by recurring or prepaid micropayments. | Subscription cancellation, recurring authorization safety, grace periods, moderation, and member privacy. |
| **Boost** | Buy placement in a clearly marked, optional promotion lane. | Payment can be split among the author, delivery nodes, and the interface that supplies ranking service. | Disclosure, auction fairness, plutocratic capture, malicious content, and cross-client consistency. |
| **Bounty** | Fund a question, task, investigation, translation, or creative request. | Escrow or conditional tip releases after an explicit acceptance or adjudication rule. | Who judges completion, dispute bonds, partial awards, collusion, deadlines, and abandoned bounties. |

These primitives are the proposed **new economic driver**. Decentralization protects portability and reduces platform control; micropayments give creators and communities a reason to operate without reconstructing the advertising model.

## Cross-layer composition

```text
User wallet ── signed action / payment ──► Creator or community wallet
     │                                             │
     │ L0: message, notification, content delivery │
     │ L1: identity, assets, policy, settlement    │
     │ L2: high-frequency social payment ledger    │
     ▼                                             ▼
independent feed client                    non-custodial revenue
```

| Tier | SNS role | Boundary |
| --- | --- | --- |
| **L0 Layer Minus** | Encrypted DMs, notifications, and delivery coordination using the [mailbox-routing](../l0/mailbox-routing.md) model. | Current DePIN Chat is not a public social-feed protocol, and metadata exposure is not zero. |
| **L1 CoNET** | Wallet identity, `@BeamioTag`, asset contracts, access policy, social-stat anchors, and final settlement. | On-chain attribution does not establish personhood or content truth. |
| **L2 CoNET-DLE** | Proposed parallel micropayment ledgers for tips, unlocks, boosts, subscriptions, and bounties. | Tip classes and economics are specified; product-specific flows still require implementation and validation. |
| **Bulk distribution** | Large attachments or video could later use [BT DCDN](../applications/bt-dcdn.md). | BT DCDN is explicitly under development. |

## Why micropayments change the social model

| Advertising-first SNS | Micropayment-first design direction |
| --- | --- |
| The platform monetizes aggregate attention. | Users choose when attention or access carries a price. |
| Creator payout is a platform liability. | Settlement targets a creator or community wallet. |
| Ranking optimizes opaque engagement yield. | Free, reputation, subscription, and paid-boost lanes can be separated and disclosed. |
| Every interaction is nominally free. | Selected actions can carry a cost, bond, reward, or refundable stake. |
| The platform owns the authoritative graph. | Independent clients can reconstruct protocol-visible edges. |

This does not mean every click should be paid. A viable design should preserve free public conversation while using payment where it adds information or funds a service.

## Anti-spam is more than charging a fee

Micropayments can raise attack cost, but they do not solve abuse by themselves. A wealthy attacker can buy spam, wash tips among controlled wallets, or dominate boost auctions.

A credible implementation needs layered controls:

- per-wallet and per-destination rate limits;
- minimum costs or refundable bonds for high-impact actions;
- reputation based on durable history, not raw token balance alone;
- Sybil-aware weighting that separates unique activity, paid access, and circular transfers;
- recipient-side filters and community moderation;
- optional free lanes with stricter reach limits;
- transparent labels and caps for paid boosts;
- privacy-preserving abuse reports and an appeal process.

No single global score should become an unreviewable social credit system.

## Settlement questions that remain open

1. **Asset selection:** conet-USDC provides stable-denominated value, but bridging, liquidity, compliance, and failure handling remain part of the product.
2. **Micropayment UX:** session authorization and batching must reduce friction without giving an app unlimited spending power.
3. **Atomic access:** paid posts must define whether payment, content-key delivery, and access expiry succeed or fail together.
4. **Refunds and disputes:** digital content is difficult to “return.” Products need explicit policies rather than pretending settlement finality resolves quality disputes.
5. **Recurring access:** subscriptions require bounded amounts, deadlines, cancellation, and replay protection.
6. **Relayer boundary:** a gas relay may submit a signed action, but it must not become the custodian or discretionary owner of creator revenue.
7. **Economics:** protocol fees, execution reserves, availability budgets, and storage metering must remain distinguishable as required by [L2 economics](../l2/economics.md).

## Copyright and governance remain open

Paid access is not a copyright transfer. A wallet signature is not automatic proof that the poster owns a work. A decentralized SNS still needs:

- machine-readable licenses and attribution;
- procedures for competing authorship or infringement claims;
- client and community rules for illegal or harmful material;
- moderation scopes that distinguish hiding content from erasing protocol history;
- transparent boost and recommendation policies;
- governance for shared spaces, treasury use, and appeals;
- privacy policy for public follows, payments, and community membership.

Different clients may moderate differently, but “different” cannot mean “undocumented.” Users should be able to see which rules produced a feed.

## Validation criteria

A product should not call this economy operational until it can demonstrate:

1. A tip settles to the intended wallet without a custodial platform balance.
2. A paid post either delivers the authorized content key or follows a documented failure/refund path.
3. Boosts are labeled, bounded, and reproducible enough for independent clients to audit.
4. Bounty acceptance and disputes have explicit, testable rules.
5. Spam tests cover wealthy attackers, Sybil wallets, dust transfers, and circular payments.
6. Payment, access, and social history survive the loss of one frontend or indexer.
7. Governance and copyright processes state what is technical enforcement and what remains human or legal adjudication.

## Anti-patterns

- Calling an IPFS-hosted feed a new economy while preserving advertising as the only scalable revenue source.
- Rebuilding a custodial in-app balance for “convenient” creator payouts.
- Treating a fee as a complete anti-spam system.
- Selling undisclosed boosts inside an allegedly neutral ranking algorithm.
- Storing the authoritative social graph only in a proprietary database.
- Using inflationary rewards as the only incentive while omitting stable-value payment paths.
- Equating paid access with ownership or copyright transfer.
- Separating chat identity, social identity, and payment identity without an auditable delegation model.

## Continue reading

- [Use cases index](README.md)  
- **Previous:** [NFT provenance and Web of Trust](nft-web-of-trust.md)  
- **Next:** [Long-form creator media](decentralized-youtube.md)  
- [L2 economics](../l2/economics.md) · [L2 asset, storage, and trade tips](../l2/tip-classes.md)  
- [DePIN Chat](../applications/depin-chat.md) · [Beamio](../applications/beamio.md)  
- [Assets on L1](../l1/assets.md)  
- [BT DCDN](../applications/bt-dcdn.md) — under development
