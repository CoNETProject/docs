# Economic design studies

These pages examine how CoNET’s three infrastructure tiers could be composed into creator-facing economies:

- **L0 Layer Minus** provides wallet-addressed, zero-trust communication and delivery.
- **L1 CoNET** provides identity, assets, signatures, and settlement anchors.
- **L2 CoNET-DLE** specifies event-driven tip ledgers for high-frequency or specialized economic activity.

They are architecture and product-design studies. They do **not** claim that the complete products described here are deployed, generally available, economically proven, or legally resolved.

## Recommended reading order

Read the studies as one economic progression:

1. **[NFT provenance and Web of Trust](nft-web-of-trust.md)**  
   Establish a durable relationship between a creator, a work, and its attributable history. The NFT is a provenance anchor, not a speculative marketing object.
2. **[Decentralized SNS](decentralized-sns.md)**  
   Turn that provenance graph into a living social economy. CoNET-DLE micropayments enable tips, paid posts, gated access, boosts, and bounties instead of leaving advertising as the only scalable revenue model.
3. **[Long-form creator media](decentralized-youtube.md)**  
   Apply the same identity, social, and payment rails to a heavy-media vertical: long-form video, author-directed rights, wallet-signed engagement, derivative works, and eventual decentralized distribution.

The dependency is intentional:

```text
creator ↔ work ↔ provenance
              │
              ▼
 wallet social graph + micropayments
              │
              ▼
 long-form media + rights + distribution
```

## Evidence labels

Each study separates three different kinds of statement:

| Label | Meaning |
| --- | --- |
| **Current composable capability** | A building block documented as active elsewhere in this GitBook, such as CoNET L1, Beamio wallet identity, or DePIN Chat. This does not imply that the complete use case is shipped. |
| **Design pattern** | A proposed composition of current components and CoNET-DLE specifications. It is an architectural direction, not deployment evidence. |
| **Still to implement or validate** | Product, protocol, security, performance, legal, or governance work that remains open. |

When a page links to a protocol specification, the link is evidence that the behavior is **specified**. It is not, by itself, evidence of a production deployment or measured product-market fit.

## Cross-layer dependencies

| Dependency | What these studies rely on | Boundary |
| --- | --- | --- |
| **L0** | Wallet-addressed P2P, OpenPGP business envelopes, entry/mailbox routing, and current DePIN Chat | Bulk creator-video delivery through [BT DCDN](../applications/bt-dcdn.md) remains under development. |
| **L1** | CoNET chain identity, wallet signatures, `@BeamioTag`, assets such as conet-USDC, the [cross-chain Treasury](../l1/cross-chain-treasury.md), and social-stat or settlement primitives | A signature proves control of a key, not legal authorship, truth, or regulatory compliance. A bridged ERC-20 is not automatically DLE-admitted. |
| **L2** | CoNET-DLE storage/trade tip classes and event-driven micropayment design | The DLE documents define architecture and invariants; each use case still needs implementation and end-to-end validation. |
| **Applications** | [Beamio](../applications/beamio.md) and [DePIN Chat](../applications/depin-chat.md) demonstrate reusable identity, messaging, and gas-relay patterns | They are not a deployed decentralized SNS or a complete long-form video platform. The proposed [miner-matched order-book exchange](../applications/miner-orderbook-dex.md) is a separate market design study, not a creator-media product. |

## Use cases versus applications

| Section | Purpose |
| --- | --- |
| **[Applications](../applications/README.md)** | Named software surfaces and their stated delivery status, including Beamio, DePIN Chat, and BT DCDN. |
| **Economic design studies** | Cross-layer scenarios that may combine several applications and specifications into a future product. |

## Continue reading

- [NFT provenance and Web of Trust](nft-web-of-trust.md)  
- [Decentralized SNS](decentralized-sns.md)  
- [Long-form creator media](decentralized-youtube.md)  
- [Applications](../applications/README.md)  
- [Decentralized cross-chain Treasury](../l1/cross-chain-treasury.md)  
- [Cross-chain assets in DLE](../l2/cross-chain-assets.md)  
- [Miner-matched order-book exchange](../applications/miner-orderbook-dex.md)  
- [L2 asset, storage, and trade tips](../l2/tip-classes.md)  
- [L2 economics](../l2/economics.md)  
- [Resources](../resources.md)
