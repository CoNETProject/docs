# Long-form creator media

**Status: economic design study.** “Decentralized YouTube” is shorthand for the product category, not a claim of affiliation or a generally available replacement. Long-form video is treated here as a **heavy-media vertical of the [decentralized SNS](decentralized-sns.md)**: it inherits the same wallet identity, follow graph, micropayments, and governance questions, then adds large-file delivery, playback, rights, and secondary creation.

**Prerequisites:** [NFT provenance and Web of Trust](nft-web-of-trust.md) defines the creator ↔ work ↔ provenance relationship. [Decentralized SNS](decentralized-sns.md) defines the social and micropayment economy on top of it.

Public site: [https://gitbook.conet.network/use-cases/decentralized-youtube.html](https://gitbook.conet.network/use-cases/decentralized-youtube.html)

## Thesis

The design direction is a creator-video system in which:

- an author establishes a durable relationship to an original work;
- viewers can support or purchase access with USDC-denominated value;
- wallet-attributable likes, comments, and paid access become auditable **signals**, not a proprietary platform score;
- an author can define whether and how followers may fork a work into a derivative;
- distribution can move away from one platform CDN as CoNET’s bulk DCDN matures.

None of these properties should be presented as complete until the rights model, payment/access atomicity, media delivery, moderation, and end-to-end product have been implemented and independently tested.

## Status and evidence boundary

### Current composable capabilities

- CoNET L1 provides wallet signatures, contracts, and current assets, including conet-USDC as documented in [Assets on L1](../l1/assets.md).
- [Beamio](../applications/beamio.md) provides wallet identity, `@BeamioTag`, social-stat primitives, and gas-relayed transaction patterns.
- [DePIN Chat](../applications/depin-chat.md) provides deployed wallet messaging, receipts, presence, and encrypted history that can support creator/fan communication.
- L0 [mailbox routing](../l0/mailbox-routing.md) defines a zero-trust delivery path in which intermediate nodes do not read business plaintext.

These capabilities do not amount to a video platform, transcoding service, rights registry, auction market, or decentralized CDN.

### Design patterns

- An original can be anchored by a work identifier and a creator-signed provenance root.
- A DLE storage-class tip can represent fragmented content, a sealed index, authorized delivery nodes, and buyer-bound access.
- A DLE trade-class tip can coordinate a fixed-price sale or auction while L1 Settlement moves payment and the subject NFT.
- Wallet likes, comments, paid unlocks, and sales can be presented as evidence associated with the same work lineage.
- A follow relationship can lead to an explicitly licensed fork with a parent pointer and optional revenue sharing.

These are directions derived from [L2 tip classes](../l2/tip-classes.md) and the DLE whitepaper, not claims of a deployed creator-video workflow.

### Still to implement or validate

- Upload, chunking, transcoding, adaptive-bitrate packaging, playback, captions, search, recommendations, creator studio, and mobile UX.
- DLE storage/trade deployment and measured settlement performance for creator media.
- Payment-bound key delivery, expiry, renewal, refund, recovery, and revocation.
- Rights registration, license defaults, disputes, moderation, appeals, and jurisdictional procedures.
- Sybil-resistant engagement signals and honest auction presentation.
- Bulk distribution through [BT DCDN](../applications/bt-dcdn.md), whose client and swarm economics are **under development**.

## Long-form video is an SNS vertical

The architecture should not create a second identity or payment silo for video:

| Decentralized SNS rail | Long-form video specialization |
| --- | --- |
| Wallet profile and follow graph | Creator channel and episode discovery |
| Tips and paid posts | Tips, premieres, paid episodes, archives, and memberships |
| Comments and reactions | Time-linked discussion and creator feedback |
| Gated communities | Subscriber-only releases or production rooms |
| Boosts and bounties | Sponsored discovery, commissions, subtitles, edits, or research |
| Work provenance | Original video, editions, clips, remixes, and fork lineage |

The video product adds heavy storage and delivery, but it should reuse the same creator identity, follower relationships, settlement rails, and governance disclosures.

## Cross-layer composition

```text
Viewer wallet ── follow / like / comment / pay ──► Creator wallet
      │                                                │
      │ L0: messaging and delivery coordination       │
      │ L1: identity, assets, rights anchors, settle   │
      │ L2: storage/trade and micropayment journals    │
      ▼                                                ▼
media delivery network                         creator-controlled lineage
```

| Tier | Intended role | Boundary |
| --- | --- | --- |
| **L0 Layer Minus** | Creator/fan messaging, access coordination, and privacy-preserving transport patterns. | Current L0 and Chat do not by themselves provide multi-gigabyte adaptive video delivery. |
| **L1 CoNET** | Creator identity, work hashes, subject NFTs, social stats, conet-USDC, access policy, and final settlement. | L1 should not hold plaintext video, and a chain record does not adjudicate copyright. |
| **L2 CoNET-DLE** | Proposed storage tips for originals, trade tips for sales, and lineage/sales journals. | These are specified design classes that still require deployed end-to-end validation. |
| **BT DCDN** | Planned wallet-addressed piece distribution and seeding incentives for large files. | The [BT DCDN application](../applications/bt-dcdn.md) is under development and is not a current production dependency. |

## Author-directed copyright

The design goal is **author-directed rights**, not the claim that a blockchain automatically creates copyright.

An implementation should separate:

| Record | Purpose |
| --- | --- |
| **Creator-signed origin** | Records which wallet asserted authorship over a specific work hash and metadata version. |
| **Work lineage** | Connects the original, editions, translations, clips, and derivatives. |
| **License policy** | States access, reuse, attribution, commercial use, territory, duration, and revenue-sharing terms. |
| **Access grant** | Proves that a buyer or subscriber received a defined right to decrypt or view. |
| **Transfer record** | Records movement of a protocol asset or contractual right. |

Important limits:

- A signature proves key control, not first authorship.
- Buying access does not transfer copyright unless the license says so.
- Owning an NFT does not necessarily imply reproduction, public-performance, or derivative rights.
- A parent pointer does not make an unauthorized remix lawful.
- Frontends and distribution nodes remain subject to applicable law and policy.

The defensible claim is that platform terms are not the sole root of the work’s protocol history. It is not a claim of immunity from courts, app stores, DNS blocking, or lawful moderation.

## USDC-denominated creator income

The intended money path avoids making a video platform the discretionary ledger of creator revenue:

| Flow | Design direction |
| --- | --- |
| **Tip** | Viewer sends conet-USDC-denominated value to the creator wallet through a bounded, non-custodial action. |
| **Paid episode** | Settlement confirms payment and then authorizes buyer-bound content delivery under an explicit failure/refund rule. |
| **Membership** | A bounded, cancellable authorization renews access without granting the client unlimited spending power. |
| **Sale or auction** | A trade-class tip coordinates bids or quotes; L1 Settlement moves the asset and payment according to the final order. |
| **Derivative revenue** | A fork policy can split defined proceeds with the parent creator if the parties accepted that license. |

A relayer that only submits a user-authorized transaction and pays gas need not be a revenue custodian. That boundary must be enforced technically: the relayer must not be able to redirect funds, change the recipient, or retain an internal balance as the system of record.

USDC rails still introduce bridge, liquidity, compliance, issuer, and on-ramp dependencies. “Wallet-to-wallet” does not remove those external risks.

## Likes and comments as auction signals

Wallet-attributable engagement can give prospective buyers more evidence than a screenshot of platform analytics:

| Signal | Potential evidence | Required caution |
| --- | --- | --- |
| **Like** | A wallet signed an endorsement associated with this work. | Cheap wallets can create fake popularity; raw counts are weak evidence. |
| **Comment** | A signed message or anchored hash belongs to a wallet and work context. | Content, moderation state, and identity quality matter more than count. |
| **Paid unlock** | A wallet accepted a cost to access the work. | Circular payments and self-dealing must be detected. |
| **Watch completion** | A delivery or client can attest to a completion event. | Client attestations are gameable and may reveal viewing behavior. |
| **Prior sale** | Settlement records an amount and transfer for this lineage. | Wash trading and related-party sales remain possible. |

At auction time, clients may expose these records as **valuation evidence**. They must not present them as an objective price oracle. The DLE trade design explicitly leaves the quote to the seller or market participants; the protocol cannot infer a “fair” creative-work price from engagement.

Signal weighting should be public and inspectable. Candidate inputs include wallet age, non-circular paid access, durable contribution, and diversity of counterparties, but each introduces privacy and governance trade-offs.

## Follow → fork as a design direction

```text
Author A publishes original W
        │
        ├── Follower B subscribes to A
        │
        └── A exposes a fork license
                    │
                    ▼
          B publishes derivative W'
          parent = W
          license = stated terms
          revenue split = optional policy
```

| Primitive | Intended meaning |
| --- | --- |
| **Follow** | A wallet subscribes to a creator’s feed and delivery preferences. It grants no copyright by itself. |
| **Fork permission** | The author publishes machine-readable derivative terms or approves a specific request. |
| **Fork** | The derivative records its parent work, contributor identity, license version, and modified content root. |
| **Secondary creation** | A remix, translation, dub, excerpt, annotation, or adaptation remains discoverable through the lineage graph. |
| **Revenue share** | A settlement policy may allocate agreed proceeds to parent and derivative creators. |

This model is a design direction. It still needs a license vocabulary, versioning, revocation rules, multi-author support, dispute handling, and a clear distinction between permissioned forks and fair-use claims.

## Proposed end-to-end flow

The following is a target flow, not a report of a deployed product:

1. **Register** — The creator signs the original content root, metadata, and rights policy.
2. **Package** — The client fragments and encrypts the media and creates a sealed delivery index.
3. **Anchor** — L1 records the subject identifier and hashes; a DLE storage-class tip coordinates the work’s storage state.
4. **Publish** — The episode appears in the creator’s SNS feed and follow graph.
5. **Engage** — Wallet likes, comments, tips, and paid unlocks append attributable evidence.
6. **Deliver** — Authorized viewers receive buyer-bound access; large-file distribution eventually uses BT DCDN after it is implemented and validated.
7. **Fork** — A derivative records its parent and accepted license.
8. **Trade** — A trade-class tip coordinates a listing or auction; engagement and provenance are shown as signals, while L1 performs final settlement.

## Heavy-media engineering work

Long-form video makes requirements visible that a text SNS can postpone:

- resumable upload and deterministic chunk manifests;
- multiple codecs, resolutions, captions, and adaptive bitrate;
- content-key rotation and multi-device recovery;
- cold-content availability and storage-renewal economics;
- seeder quality, bandwidth measurement, and fraud proofs;
- startup latency, buffering, geographic performance, and mobile data limits;
- thumbnail and recommendation metadata without leaking protected content;
- abuse reporting, child safety, copyright claims, sanctions, and lawful process;
- creator analytics that protect viewer privacy;
- disaster recovery when frontends, indexers, or delivery nodes disappear.

Until these are measured under realistic load, “decentralized video” remains an architecture objective rather than an operational claim.

## Validation criteria

A real implementation should publish evidence for:

1. Author-signed provenance that independent clients reconstruct consistently.
2. Successful and failed paid-access cases, including refunds, expiry, and key recovery.
3. Direct creator settlement in which relayers cannot redirect or custody revenue.
4. Video startup, throughput, redundancy, and recovery across multiple independent delivery nodes.
5. Sybil and wash-trading resistance for likes, comments, unlocks, and sales.
6. Machine-readable fork licenses and tested revenue splits.
7. Moderation, infringement, appeal, and transparency procedures.
8. Clear labeling that BT DCDN remains under development until its client, economics, and performance are verifiably live.

## Anti-patterns

- Calling a single company object store a decentralized video network.
- Saying that an NFT automatically proves copyright.
- Holding creator USDC in a frontend-controlled account for convenience.
- Presenting raw wallet likes as a fair-price oracle.
- Allowing derivatives to omit their parent or license.
- Treating a paid unlock as a copyright transfer.
- Claiming absolute anonymity, uncensorability, or legal immunity.
- Describing BT DCDN as production-ready before the under-development client and seeding market are validated.

## Related CoNET docs

- [Use cases index](README.md)  
- [NFT provenance and Web of Trust](nft-web-of-trust.md) — creator ↔ work ↔ provenance foundation  
- [Decentralized SNS](decentralized-sns.md) — feed, follow, tips, paid access, boosts, and bounties  
- [L2 asset, storage, and trade tips](../l2/tip-classes.md)  
- [L2 design thesis](../l2/design-thesis.md)  
- [L2 economics](../l2/economics.md)  
- [Assets on L1](../l1/assets.md)  
- [DePIN Chat](../applications/depin-chat.md)  
- [BT download (DCDN)](../applications/bt-dcdn.md) — under development  
- [Beamio](../applications/beamio.md)  
- [HTTP mimicry](../l0/http-mimicry.md) · [Mailbox routing](../l0/mailbox-routing.md)  
- Whitepaper copyright and sales-journal design — [CoNET-DLE whitepaper](https://github.com/CoNET-project/CoNET-DLE/blob/main/src/whitepaper/Decentralization%20Cluster%20multi-chain.md) §4.8–§4.10
