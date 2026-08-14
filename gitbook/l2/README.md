# L2 — CoNET-DLE

**Evidence level: Normative design digest.** This section explains a controlled specification set; it is not evidence that the complete L2 system is deployed.

CoNET Distributed Ledger Expansion (**CoNET-DLE**) is a specified Layer-2-style architecture for many parallel, event-driven ledgers. Each ledger is a class-fixed state machine rather than a general-purpose VM.

This GitBook section is an **explanatory digest**. It does not create protocol requirements. Normative language and byte-level behavior are controlled by the English whitepaper and the three `DLE-*Spec.md` files listed in [Normative sources](specs-index.md).

## Status boundary

CoNET L1 is a live network. DLE is not documented here as a fully launched production system.

This digest was checked against the whitepaper revision dated **2026-08-13**.

The source set includes frozen product decisions, executable vectors, a bounded formal-model result, and TypeScript archive reference work. It also records unresolved production gates. In particular:

- production asset ingress and new-chain admission remain disabled pending measured economic evidence;
- the archive conformance specification forbids production signing until its interoperability, wrapper, networking, and custody blockers close; and
- the DLE `AssetBurnMintGateway` is a target protocol component, not an alias for an already deployed Treasury contract.

“Frozen” therefore means **the referenced design or serialization rule is fixed for its stated version**. It does not mean the complete protocol has been deployed or independently verified in production.

For an ERC-20 issued on another chain, the target path has two separate state machines. An approved Treasury route first establishes the canonical CoNET L1 representation. A later DLE admission plus burn/activation protocol would establish L2 backing. A bridge transaction alone does not activate DLE.

## Protocol digest

The target design has five main parts:

1. **Parallel tips.** Each DLE chain advances independently. No event means no block.
2. **L1 birth certificate.** A chain is bound to a unique CoNET L1 NFT and exactly one class: asset, storage, or trade.
3. **Validator production.** A per-tip committee proposes event blocks; the current design uses seven selected validators and a five-signature threshold.
4. **Archive finality.** The hosting archive group replays the candidate, checks data availability, and finalizes it through Tendermint-style prevote and precommit certificates.
5. **Separated economics.** Protocol value fees, execution reserves, and availability budgets are different ledgers with different liabilities.

## Scope of these pages

1. [Design thesis](design-thesis.md) — why the design uses parallel class-fixed tips
2. [Archive availability and finality](archive-plane.md) — validator production versus archive certification
3. [Ledger classes](tip-classes.md) — asset, storage, and trade state machines
4. [Cross-chain assets in DLE](cross-chain-assets.md) — Treasury hand-off, admission, burn/activation, and conservation
5. [Economics](economics.md) — the three-ledger funding model
6. [Normative sources](specs-index.md) — controlling documents, evidence, and non-normative material

Developer how-to: [L2 development](../developers/l2.md).

## Source anchors

- Public repository: [CoNET-project/CoNET-DLE](https://github.com/CoNET-project/CoNET-DLE)
- Whitepaper: [Decentralization Cluster multi-chain.md](https://github.com/CoNET-project/CoNET-DLE/blob/main/src/whitepaper/Decentralization%20Cluster%20multi-chain.md), Abstract; §§3–6; §13
- Archive conformance: [DLE-Archive-Tendermint-Conformance-Spec.md](https://github.com/CoNET-project/CoNET-DLE/blob/main/src/whitepaper/DLE-Archive-Tendermint-Conformance-Spec.md)
- Asset conservation: [DLE-AssetBurnMintGateway-Invariant-Spec.md](https://github.com/CoNET-project/CoNET-DLE/blob/main/src/whitepaper/DLE-AssetBurnMintGateway-Invariant-Spec.md)
- Operator correlation: [DLE-OperatorDomainRegistryV1-Spec.md](https://github.com/CoNET-project/CoNET-DLE/blob/main/src/whitepaper/DLE-OperatorDomainRegistryV1-Spec.md)

## Next

[Design thesis →](design-thesis.md)

Related: [Decentralized cross-chain Treasury](../l1/cross-chain-treasury.md) and [Cross-chain assets in DLE](cross-chain-assets.md).
