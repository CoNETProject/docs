# Beamio Merchant OS

**Maturity: Public application.** Merchant OS is live at [https://biz.beamio.app](https://biz.beamio.app). This chapter inventories merchant capabilities. It is not an operator runbook and not an audit or SLA claim.

Parent: [Beamio whitepaper](../beamio.md).

Revision: **2026-08-29**.

## Product role

Merchant OS is the merchant control plane: create and publish a program card, configure membership and reward rules, issue coupons and catalogs, authorize staff and POS terminals, and review settlements.

It is not the Consumer PWA and not the in-store POS UI. Merchants sign as the owner (or authorized staff) after unlock; **signing material stays in session memory** and is not written to disk.

## What exists today

### Programs and metadata

Merchant configuration is written to **card0 / `metadata_json`** (HTTP `GET https://beamio.app/api/cardMetadata`) and, where required, to CoNET program-card modules.

| Area | Behavior |
| --- | --- |
| **Card Setup / Program Basic** | Name, imagery, currency, and Discover presentation (`shareTokenMetadata`). Onboarding’s business category, channel, store name, and region are persisted in `shareTokenMetadata.businessProfile`. The **PROGRAM CATEGORY** block is shown only for physical stores; digital/app stores do not automatically write `categories`. |
| **Membership** | **Base membership** lives in `baseMembership` (index `0`), not as an Add-tier row. Higher paid tiers live in `tiers[]` and must be strictly more expensive. After first successful publish, that tier’s price and duration are **locked**. A successful issue mints a membership NFT with `tokenId ∈ [100, 1e11)` — leftover `#0` program points are not a membership NFT. Fee mode and Add-tier stage read diamond `feeE6[]`, not a misaligned on-card `tiers.length`. |
| **Top-up Promotion** | Bonus validity / minimum / percent-or-fixed. The **bonus master switch is independent** of Reward PT. |
| **Reward PT (Top-up)** | Actor `#13` percent of **actual payment** (`actorPercentBps` / chain `topupActorRewardRatioE6`). Save writes **ratio E6** via `setTopupActorRewardRatio` — **not** Social Promotion `getRewardRule(2)`. |
| **Referrer (Top-up)** | Referrer `#13` percent (`referrerPercentBps` / `referrerTopupAmountRatioE6`) via `setReferrerTopupAmountRatio`. Same ratio path; **not** `ruleId=2`. |
| **Social Promotion** | Card-level **linkClick** (`ruleId=1`) and **like** (`ruleId=3`) fixed `#13` mint. Coupon-level claim/burn use per-coupon slots. Saving Social Promotion **deactivates** legacy `ruleId=2`. |
| **Consumption Points** | Charge reward percent (`chargeRewardRatioE6` / referrer charge ratio). **POS Charge** settles by burning customer **`#0`**; when the ratio is set, beacon **V19+** mints same-cycle **`#13`** on that burn (`UpdateLib.afterAdminPointsBurn`). Do not mint token `#2` as a spendable balance. (Issued-NFT social exchange may separately burn `#13` for USDC — that is not POS Charge settle.) |

Trash on Top-up Promotion clears **bonus** only. It must not clear `unifiedRewardPoints.topup`.

### Social exchange and canonical CoNET-USDC

An issued-NFT social exchange with `kind = "usdc"` is separate from fixed
Social Promotion mint rules. After the user signs the claim, the merchant card
burns `#13` from the user's AA, debits the card's `escrowUsdc6`, and pays the
reward in canonical CoNET-USDC to the user's **EOA**. It does not pay USDC
directly to the AA.

- Canonical CoNET-USDC (6 decimals):
  [`0x5209865D404aA5646eDe5B91CD4218909eA72eDA`](https://mainnet.conet.network/token/0x5209865D404aA5646eDe5B91CD4218909eA72eDA)
- Sole active Treasury: TreasuryBridgeV3
  [`0xa208982212978550594A7FEEB70a61665d129003`](https://mainnet.conet.network/address/0xa208982212978550594A7FEEB70a61665d129003)

The legacy USDC address `0xfD0D7B0706AaB5E4351bcED37bC3C77ed6813907` is
deprecated and must not be used by new social-exchange modules, metadata,
prechecks, accounting, or UI. The burn, escrow debit, and payout are atomic;
failure of any leg reverts the transaction.

### Unified Reward Points (`#13`)

User-visible “points / Reward PT” is **`tokenId = 13`**.

| Token | Role when unified rewards are on |
| --- | --- |
| `#0` | Redeemable program points (top-up principal and optional promotion bonus `#0`) |
| `#13` | Reward PT / referrer / social rewards (redeemable) |
| `#1` / `#2` | Statistics only — not spendable rewards |
| `#3`–`#30` | Cumulative / social KPI stats |

Top-up `#13` percentages use **actual payment** only. Promotion bonus `#0` is not part of that base.

**Same-store `#13` → `#0`:** Consumer Discover Top-up may convert this card’s Reward PT into this card’s program credit. That path does **not** require USDC escrow or `convertReward13ToPointsRatioE6`.

**Atomic multi-source Top-up (fail-closed):** When Smart Pay includes same-store and/or third-party `#13` legs, Cluster/Master runs `topupWithReward13Container` in one Relayer AA `executeBatch`: peer `peerRedeem13ForContainerTopup` (exact `quoteUsdcWithdrawForFiat6(burn13)` CONET-USDC to the **target merchant card**, after escrow **and** ERC20 balance checks) → container mint `#0` → optional cash EIP-3009 + `mintPointsForProtocolUsdcSettlement`. Any peer that cannot fully pay the quoted USDC causes the **entire** top-up to revert (no silent cap, no “burn `#13` without USDC”). Cash-only top-up (no `#13` legs) keeps `purchasingCard` / `postBuyCardPoints`. Issued-NFT social exchange (`#13` → CONET-USDC to the user’s **EOA**) remains a **separate** escrow rail and must not be used as the atomic container peer path.

**Charge `#13`:** POS settle burns `#0` (`burnPointsByAdmin`). Beacon **V19+** runs the same UpdateLib mint as a real `#0` transfer (`amountFiat6 × chargeRewardRatioE6 / 1e6` → actor `#13`, plus referrer if configured). Pre-V19 burn-only Charges minted no `#13`. Master `enqueueRecordChargeReferrerReward` stays a no-op.

**`getRewardRule(2)` is not Top-up Reward PT.** Historical Social Promotion slot `2` may still exist on old cards as a fixed `actorMint13` / `refMint13` row. Product truth for Top-up / Referrer Top-up is **E6 ratio storage** and same-cycle mint (`recordTopupCumulativeStat`). Master must not enqueue a second `#13` mint from slot `2`. Social Save must deactivate slot `2` so it cannot dual-mint.

### Coupons, catalogs, staff

| Area | Behavior |
| --- | --- |
| **Coupons** | Issue, share, open-claim inventory, social stats |
| **Business Catalogs** | Catalog items, 4:3 preview, optional video / image hero (no item-icon in the editor preview) |
| **Staff / Terminals** | Linked POS terminals; **Pending terminal authorization** from typed CoNET Chat (`beamio_pos_terminal_permission_v1`) — not a Messages thread |
| **Messages** | Ordinary Merchant OS chat omits mailbox `NoPush` (offline peer may get a native badge). Delivery receipts use `NoPush: true`. Same rule as Consumer; see [CoNET Chat](../depin-chat.md). |
| **Transactions** | Indexer ledger. B-Unit service fees are a **separate indexer row**; the UI merges them into Charge / Top-up / Claim when a parent row exists |
| **Overview KPI** | Chain-first. A failed RPC must not overwrite the last trusted value with zero |
| **Wallet USDC** | Overview and Wallets show **one** merchant-owned **USDC** total: Base USDC + canonical CONET-USDC, summed per EOA and Smart Wallet. The UI does not split those chains. Program-card **USDC Reserve / Diff** (card CONET-USDC minus minted `#13`) stays a separate KPI. |

### Fuel and cash (merchant view)

Merchants buy **Fuel Packs** (B-Units) for protocol fees. Pack merchandising shows price and **total B-Units** only.

Merchant Kit Stripe (CAD kits → B-Units / Ket) is **not** the consumer “Buy USDC with card” rail. See [Cash and USDC](cash-and-usdc.md).

## Chain placement

Merchant program cards are **CoNET L1 only**. Do not treat the historical Base UserCard Factory as the current merchant chain.

New cards issued after the CoNET UserCard beacon cutover are **BeaconProxy**. The platform upgrades every such card together with `beacon.upgradeTo`; card addresses stay the same. Historical CREATE cards cannot join the beacon and keep the ChargeReward runtime preCheck.

Writes that need sponsored gas go Cluster → Master (CoNET settle pool). Reads of program state, metadata, and KPI should prefer RPC / trusted cache, not a centralized API as the source of truth.

### Factory create: one transaction for loyalty tiers

The live CoNET Factory (`0xfA52…774FB`) is **not** upgradeable at the same address. New-card writes must use the functions already on that Factory.

| Card kind | Factory call |
| --- | --- |
| **Membership-fee** (`baseMembership.membershipFeeE6 > 0`, or legacy `tiers[]` with a fee) | `createCardCollectionWithInitCode` only. Price and duration live in **metadata**. Do not send Factory AndTiers. |
| **Loyalty** (Top-up / Charge / Balance) | One transaction: `createCardCollectionWithInitCodeAndTiers` with the live **3-tuple** (`minUsdc6`, `attr`, `tierExpirySeconds`), selector **`0x9a7eb0f0`**. |

Do **not** create the card first and then call `appendTierForCard` on the new-card path. If create succeeds and append reverts, Discover never gets a `beamio_cards` row (orphan). Do **not** encode the Hardhat 4-tuple AndTiers (`upgradeByBalance`, selector `0x62cb913c`) — that selector is not on the live Factory.

Charge versus Top-up is **card-level `upgradeType`** in initCode, not a field on the 3-tuple. Balance (`upgradeType === 1`) is derived on the card’s 3-arg `appendTier` (Beacon impl **V18+**). Until the UserCard beacon is upgraded to V18, a live AndTiers call reverts the **whole** create (no orphan).

`appendTierForCard` remains for recover of an already-deployed card only.

### Membership fee modules (CoNET, 2026-08-23)

Existing BeaconProxy cards pick Factory **default modules at runtime**. Binding the set below repairs fee-mode issue (`tokenId ∈ [100, 1e11)`) on live cards **without** a beacon upgrade. The Factory owner must bind **AdminStats V6**, not the V5 implementation alone (V5 would drop Referrer Registry views).

| Role | Address | Notes |
| --- | --- | --- |
| UserCard Factory | `0xfA52a0CcC96C19cF4b6Ea864615F6d52BD0774FB` | `setMembershipStatsModule` + `setAdminStatsQueryModule` |
| MembershipFeeOpsLib | `0xF3Ce015B43012E03706b5d1f57970ebCbB01D5a2` | Linked into AdminStats V5 |
| MembershipStatsModule | `0x5E0787C8562038F8BA0623274b5bFE68AF5a70E5` | Issue path; Factory `defaultMembershipStatsModule` |
| AdminStats V5 (impl) | `0xA439F4E513A241D62687abdBaF37e5Ba61D9889e` | Stage / fee diamond; **do not** bind Factory here |
| AdminStats V6 (router) | `0xF0d2E8BB78101B7a1dF44B3e8307E8124404419e` | Factory `defaultAdminStatsQueryModule`; ctor `(V5, referrerViews)` |
| Referrer views (reuse) | `0x6c7648B1d5339ea844089d2d7c9da72acab2cC9C` | Existing live views; V6 second ctor arg |

Snapshot: `deployments/conet-MembershipFeeModules.json`. Blockscout: [mainnet.conet.network](https://mainnet.conet.network). A leftover `#0` from a pre-upgrade empty-tier issue is **program points**, not a membership NFT. Dirty `activeMembershipId` in `[1, 99]` with zero balance is not a valid membership.

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
- [CoNET Chat](../depin-chat.md)
