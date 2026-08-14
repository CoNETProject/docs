# Cross-chain assets in CoNET-DLE

**Evidence level: Normative design digest.** This page explains how an ERC-20 that has already entered CoNET through an approved Treasury route could become eligible for CoNET-DLE. The production `AssetBurnMintGateway`, asset-admission registry, and end-to-end L2 ingress described here are not documented as live.

Public site: [https://gitbook.conet.network/l2/cross-chain-assets.html](https://gitbook.conet.network/l2/cross-chain-assets.html)

## One asset, two separate transitions

“Bridge into CoNET and use L2” contains two independent state machines:

```text
external chain
    │
    │ 1. decentralized Treasury route
    ▼
canonical ERC-20 on CoNET L1
    │
    │ 2. DLE admission + burn/activation
    ▼
asset-class DLE tip
```

The Treasury transition establishes a CoNET representation. The DLE transition establishes L2 backing. A successful bridge is necessary for a foreign asset, but it is not sufficient to activate DLE.

## Stage 1 — external chain to CoNET L1

The asset first uses an enabled route in the [decentralized cross-chain Treasury](../l1/cross-chain-treasury.md). Depending on the token and route, the source leg can lock or burn the source asset and the CoNET leg can mint its configured representation.

The result must be a specific, stable-address CoNET ERC-20. DLE never reaches into another chain to burn a foreign token directly, and it does not accept a caller-supplied adapter merely because that adapter exposes functions named `burn` and `mint`.

## Stage 2 — canonical recognition and admission

The CoNET token becomes DLE-eligible only when one exact proxy and version satisfies all admission controls:

| Control | Purpose |
| --- | --- |
| **Treasury-canonical registration** | Prove that `TreasuryBridgeV3` controls the relevant exact-unit mint and burn path |
| **`AssetAdmissionRegistry = ACTIVE`** | Bind the token proxy, implementation version, policy version, and DLE adapter epoch |
| **Approved CoNET L1 pool or route** | Provide an observable market and exit path rather than an arbitrary local price |
| **Frozen TWAP adapter** | Produce protocol-verifiable valuation without trusting the client quote |
| **Minimum liquidity and fresh observation** | Reject stale or economically meaningless prices |
| **Replacement-capacity reservation** | Ensure a pending burn or activated L2 liability can later refund or exit |

Even canonical conet-USDC must pass these controls. The design does not permanently assume one token always equals one US dollar.

## Stage 3 — burn, then activate

The target ingress state machine is:

```text
NONE
  │  exact Treasury burn + replacement reservation
  ▼
BURNED_PENDING
  ├── valid genesis Archive Certificate before deadline ──► ACTIVATED
  └── deadline reached without activation ────────────────► REFUNDED
```

`BURNED_PENDING` is not spendable L2 value. A burn becomes usable only after the selected validators and hosting archive group finalize the genesis event and L1 records `ACTIVATED`.

If activation does not complete before the deadline, the exact canonical units must be reminted to the original burner through the separately reserved Treasury entitlement. `ACTIVATED` cannot later take the pending-refund branch, and `REFUNDED` cannot later activate.

## Stage 4 — parallel asset tips

An activated asset tip holds a claim against Treasury-burned canonical units; it does not hold or wrap transferable L1 principal.

The target benefits are:

- **independent progress** — one asset tip does not share a global application execution queue with every other tip;
- **event-driven blocks** — no event means no block;
- **parallel underwriting** — additional archive groups and validator capacity can support more independent tips concurrently;
- **bounded direct exposure** — each asset tip has a frozen **100-USDC-equivalent** live ceiling;
- **deterministic spillover** — value above the ceiling is allocated across new tips rather than silently enlarging one risk domain;
- **class-specific validation** — asset state follows a frozen transfer, fee, split, and exit state machine instead of arbitrary application bytecode; and
- **application composition** — wallets, micropayment services, and markets can coordinate through L0 while settling against the same L1-backed asset identity.

These are architectural properties, not measured throughput or latency guarantees.

## Exact-unit conservation

Oracle value decides admission and tip sizing. It does not replace principal accounting.

For each admitted asset, the target invariant is:

\[
\mathrm{l2CreditLiability}(a)
+\mathrm{refundedPending}(a)
+\mathrm{mintedExit}(a)
\le
\mathrm{physicalBurned}(a).
\]

The stronger specification also accounts separately for pending burn liability and reserved replacement capacity. An internal split moves existing L2 backing between tips and must not mint or burn L1 supply again.

## Fees and exits

- Asset transfers target a **1 basis point** protocol-value fee, paid in canonical conet-USDC after a fresh approved L1 valuation.
- Execution reserves and archive-availability budgets remain separate liabilities; the 1 bp fee is not assumed to fund all system costs.
- A normal exit consumes one finalized exit right and remints the exact canonical CoNET token through Treasury authority.
- A challenged force exit provides the safety path when ordinary coordination fails.
- Returning to the original external-chain token is a **new Treasury operation** with its own route, policy, operation ID, fee, and finality boundary.

DLE therefore promises no automatic direct redemption into whatever foreign token first entered the system.

## What an application may build on top

After production admission, a cross-chain ERC-20 representation could participate in:

- wallet-to-wallet asset-tip transfers;
- high-frequency micropayment sessions;
- creator and storage economies;
- miner-assisted order discovery and matching; and
- a future non-custodial order-book exchange.

The current DLE trade class is specifically an NFT-style sale coordinator for one existing asset or storage tip. It is **not yet a specification for a general fungible-token central limit order book**. A miner-matched ERC-20 exchange therefore needs an additional deterministic ordering, cancellation, partial-fill, batch-settlement, and market-integrity specification.

See [Miner-matched order-book exchange](../applications/miner-orderbook-dex.md).

## Release boundary

Production asset ingress remains disabled until the documented release gates close, including:

- a verified DLE-specific Treasury authority interface;
- gateway conformance to the conservation specification and executable model;
- pool, oracle, liquidity, and economic admission evidence;
- archive and validator interoperability;
- refund, normal-exit, and force-exit testing;
- differential supply accounting; and
- the required pilot and measured cost evidence.

No wallet or exchange should represent a bridged balance as DLE-backed before an `ACTIVATED` receipt exists under that production protocol.

## Source anchors

- Whitepaper, §§4.2 and 4.6 — canonical asset boundary, admission, spillover, and exit
- `DLE-AssetBurnMintGateway-Invariant-Spec.md` — controlling conservation and failure behavior
- [Ledger classes](tip-classes.md) — asset, storage, and trade roles
- [Economics](economics.md) — fee, execution-reserve, and availability-budget separation

## Related

- [Decentralized cross-chain Treasury](../l1/cross-chain-treasury.md)
- [Core L1 assets](../l1/assets.md)
- [Miner-matched order-book exchange](../applications/miner-orderbook-dex.md)
- [Normative specifications](specs-index.md)
