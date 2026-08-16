# L2 — CoNET-DLE

**Evidence level: mixed.** The network identifiers and public services below describe the live DLE lab explorer and the deployed CoNET L1 routing facade. The rest of this section is a **normative design digest**. It is not evidence that the complete L2 system is deployed.

CoNET Distributed Ledger Expansion (**CoNET-DLE**) is a specified Layer-2-style architecture for many parallel, event-driven ledgers. Each ledger is a class-fixed state machine rather than a general-purpose VM.

This GitBook section is an **explanatory digest**. It does not create protocol requirements. Normative language and byte-level behavior are controlled by the English whitepaper and the three `DLE-*Spec.md` files listed in [Normative sources](specs-index.md).

## Network facts

| Field | Canonical value |
| --- | --- |
| EIP-155 Chain ID (CoNET-DLE Testnet) | **281669** (`0x44c45`) |
| User-visible Group ID (first group) | L1 bootstrap register tx `0x3076a806…6f2ad0` |
| Lab M6 second Group ID | `0x7b3b8eb9…7f9b1a07` — laboratory hash, **not** an L1 register tx |
| Live archive groups \(G_e\) | **2** on `GET /health` (`liveGroupCount`) after lab M6 fission |
| L1 uint `groupId` (storage key) | bootstrap **1** (first group only) |
| Explorer | `https://dle.conet.network` |
| Archives | `https://dle.conet.network/archives` |
| Lab health | `https://dle.conet.network/health` |
| Lab RPC | `https://dle.conet.network/rpc` |
| Routing registry | `0x8B261eAECdFfeE9e7aC9fFe73386B0d6C9E76AfB` |
| Registry read RPC | `https://rpc1.conet.network` |

`0x44c45` is the **CoNET-DLE Testnet** EIP-155 chain id. It distinguishes this plane from CoNET L1 `224422` and Base `8453`. It is **not** Group ID. Do not add it to a wallet as if it were CoNET L1. `https://dle.conet.network` is the authorized explorer host; do not invent additional `dle.*` names, and do not write that hostname into Solidity.

The routing registry lives on CoNET L1. Bootstrap storage key `groupId = 1` holds seven distinct participant wallets. The user-visible **Group ID** is that group’s register tx hash. That is routing identity, not Archive Certificate and not 30-day qualification. See [Global Archive Routing Registry](routing-registry.md) and [DLE explorer](explorer.md).

## Status boundary

CoNET L1 is a live network. DLE is not documented here as a fully launched production system.

This digest was checked against the whitepaper revision dated **2026-08-16**. Lab M6 fission is a laboratory gather (`liveGroupCount: 2`); it is **not** 30-day qualification and the second Group ID is **not** yet an L1 `registerLiveGroup` transaction.

The source set includes frozen product decisions, executable vectors, a bounded formal-model result, and TypeScript archive reference work. It also records unresolved production gates. In particular:

- production asset ingress and new-chain admission remain disabled pending measured economic evidence;
- the archive conformance specification forbids production signing until its interoperability, wrapper, networking, and custody blockers close; and
- the DLE `AssetBurnMintGateway` is a target protocol component, not an alias for an already deployed Treasury contract.

“Frozen” therefore means **the referenced design or serialization rule is fixed for its stated version**. It does not mean the complete protocol has been deployed or independently verified in production.

For an ERC-20 issued on another chain, the target path has two separate state machines. An approved Treasury route first establishes the canonical CoNET L1 representation. A later DLE admission plus burn/activation protocol would establish L2 backing. A bridge transaction alone does not activate DLE.

## Protocol digest

The target design has six main parts:

1. **Parallel tips.** Each DLE chain advances independently. No event means no block.
2. **L1 birth certificate.** A chain is bound to a unique CoNET L1 NFT and exactly one class: asset, storage, or trade.
3. **EIP-155 Chain ID vs Group ID.** The plane’s unique EIP-155 id (testnet `0x44c45`) is what wallets and `eth_chainId` use. User-visible **Group ID** is that group’s L1 register tx hash. L1 `archiveGroupId[tokenId]` remains a uint storage key (bootstrap `1`). None of these is CoNET L1 `224422` or the tip NFT id (whitepaper §5.2.0d).
4. **Validator production.** A per-tip committee proposes event blocks; the current design uses seven selected validators and a five-signature threshold. Archives do not produce blocks.
5. **Archive finality.** The hosting archive group replays the candidate, checks data availability, and finalizes it through Tendermint-style prevote and precommit certificates. Clients route history from the L1 Global Archive Routing Registry, not from gossip or explorer hostnames.
6. **Separated economics.** Protocol value fees, execution reserves, and availability budgets are different ledgers with different liabilities.

## Scope of these pages

1. [Design thesis](design-thesis.md) — why the design uses parallel class-fixed tips
2. [Archive availability and finality](archive-plane.md) — validator production versus archive certification
3. [Global Archive Routing Registry](routing-registry.md) — deployed L1 facade and seven participant wallets
4. [Ledger classes](tip-classes.md) — asset, storage, and trade state machines
5. [Cross-chain assets in DLE](cross-chain-assets.md) — Treasury hand-off, admission, burn/activation, and conservation
6. [Economics](economics.md) — the three-ledger funding model
7. [DLE explorer](explorer.md) — public lab UI at [https://dle.conet.network/](https://dle.conet.network/)
8. [Normative sources](specs-index.md) — controlling documents, evidence, and non-normative material

Developer how-to: [L2 development](../developers/l2.md).

## Source anchors

- Public repository: [CoNET-project/CoNET-DLE](https://github.com/CoNET-project/CoNET-DLE)
- Whitepaper: [Decentralization Cluster multi-chain.md](https://github.com/CoNET-project/CoNET-DLE/blob/main/src/whitepaper/Decentralization%20Cluster%20multi-chain.md), Abstract; §§3–6 including §5.2.0d; §13
- Archive conformance: [DLE-Archive-Tendermint-Conformance-Spec.md](https://github.com/CoNET-project/CoNET-DLE/blob/main/src/whitepaper/DLE-Archive-Tendermint-Conformance-Spec.md)
- Asset conservation: [DLE-AssetBurnMintGateway-Invariant-Spec.md](https://github.com/CoNET-project/CoNET-DLE/blob/main/src/whitepaper/DLE-AssetBurnMintGateway-Invariant-Spec.md)
- Operator correlation: [DLE-OperatorDomainRegistryV1-Spec.md](https://github.com/CoNET-project/CoNET-DLE/blob/main/src/whitepaper/DLE-OperatorDomainRegistryV1-Spec.md)

## Next

[Design thesis →](design-thesis.md)

Related: [Decentralized cross-chain Treasury](../l1/cross-chain-treasury.md) and [Cross-chain assets in DLE](cross-chain-assets.md).
