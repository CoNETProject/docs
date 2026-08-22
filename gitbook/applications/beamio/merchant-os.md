# Beamio Merchant OS

**Maturity: Public application.** Merchant OS is live at [https://biz.beamio.app](https://biz.beamio.app). This chapter inventories merchant capabilities. It is not an operator runbook and not an audit or SLA claim.

Parent: [Beamio whitepaper](../beamio.md).

Revision: **2026-08-22**.

## Product role

Merchant OS is the merchant control plane: create and publish a program card, configure membership and reward rules, issue coupons and catalogs, authorize staff and POS terminals, and review settlements.

It is not the Consumer PWA and not the in-store POS UI. Merchants sign as the owner (or authorized staff) after unlock; **signing material stays in session memory** and is not written to disk.

## What exists today

### Programs and metadata

Merchant configuration is written to **card0 / `metadata_json`** (HTTP `GET https://beamio.app/api/cardMetadata`) and, where required, to CoNET program-card modules.

| Area | Behavior |
| --- | --- |
| **Card Setup / Program Basic** | Name, imagery, currency, Discover presentation (`shareTokenMetadata`) |
| **Membership** | **Base membership** lives in `baseMembership` (index `0`), not as an Add-tier row. Higher paid tiers live in `tiers[]` and must be strictly more expensive. After first successful publish, that tier’s price and duration are **locked**. |
| **Top-up Promotion** | Bonus validity / minimum / percent-or-fixed. The **bonus master switch is independent** of Reward PT. |
| **Reward PT (Top-up)** | Actor `#13` mint percent (`actorPercentBps`). Save writes Social Promotion slot **`ruleId=2`** only. |
| **Referrer (Top-up)** | Referrer `#13` percent (`referrerPercentBps`), same `ruleId=2` path. |
| **Social Promotion** | Like, click, claim, burn, and related events mint `#13` via on-chain rules (`actorMint13` / `refMint13`). |
| **Consumption Points** | Charge reward percent. In unified mode, Charge **burns `#13`**; the product must not mint `#2` as a spendable balance. |

Trash on Top-up Promotion clears **bonus** only. It must not clear `unifiedRewardPoints.topup`.

### Unified Reward Points (`#13`)

User-visible “points / Reward PT” is **`tokenId = 13`**.

| Token | Role when unified rewards are on |
| --- | --- |
| `#0` | Redeemable program points (top-up principal and optional promotion bonus `#0`) |
| `#13` | Reward PT / referrer / social rewards (redeemable) |
| `#1` / `#2` | Statistics only — not spendable rewards |
| `#3`–`#30` | Cumulative / social KPI stats |

Top-up `#13` percentages use **actual payment** only. Promotion bonus `#0` is not part of that base.

### Coupons, catalogs, staff

| Area | Behavior |
| --- | --- |
| **Coupons** | Issue, share, open-claim inventory, social stats |
| **Business Catalogs** | Catalog items, 4:3 preview, optional video / image hero (no item-icon in the editor preview) |
| **Staff / Terminals** | Linked POS terminals; **Pending terminal authorization** from typed DePIN Chat (`beamio_pos_terminal_permission_v1`) — not a Messages thread |
| **Transactions** | Indexer ledger. B-Unit service fees are a **separate indexer row**; the UI merges them into Charge / Top-up / Claim when a parent row exists |
| **Overview KPI** | Chain-first. A failed RPC must not overwrite the last trusted value with zero |

### Fuel and cash (merchant view)

Merchants buy **Fuel Packs** (B-Units) for protocol fees. Pack merchandising shows price and **total B-Units** only.

Merchant Kit Stripe (CAD kits → B-Units / Ket) is **not** the consumer “Buy USDC with card” rail. See [Cash and USDC](cash-and-usdc.md).

## Chain placement

Merchant program cards are **CoNET L1 only**. Do not treat the historical Base UserCard Factory as the current merchant chain.

Writes that need sponsored gas go Cluster → Master (CoNET settle pool). Reads of program state, metadata, and KPI should prefer RPC / trusted cache, not a centralized API as the source of truth.

## Trust boundary

- An unlocked Merchant OS session can sign owner or staff actions until lock / logout.
- Cluster precheck can refuse a write; Master does not re-validate business rules.
- Discover visibility is a published allow policy, not “every card ever created.”
- Staff pending authorization is local-trusted application state plus Chat delivery; it is not automatically an on-chain admin grant until the merchant completes the approval flow.

## Related

- [Beamio](../beamio.md)
- [Consumer PWA](consumer.md)
- [POS terminal](pos.md)
- [Cash and USDC](cash-and-usdc.md)
- [DePIN Chat](../depin-chat.md)
