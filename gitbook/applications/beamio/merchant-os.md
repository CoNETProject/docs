# Beamio Merchant OS

**Maturity: Production reference.** Merchant OS is live at
[https://biz.beamio.app](https://biz.beamio.app). This chapter inventories
merchant capabilities. It is not an operator runbook and not an audit or SLA
claim.

Parent: [Beamio whitepaper](../beamio.md).

Revision: **2026-09-08**.

## Product role

Merchant OS is the merchant control plane: create and publish a program card, configure membership and reward rules, issue coupons and catalogs, authorize staff and POS terminals, and review settlements.

It is not the Consumer PWA and not the in-store POS UI. Merchants sign as the owner (or authorized staff) after unlock; **signing material stays in session memory** and is not written to disk.

## Onboarding

Merchant OS onboarding starts on the cover form with the title and **Business Name** only. That field accepts a **website or business name**. After a short delay the form may show suggestions from Cluster `POST https://beamio.app/api/onboardingBusinessLookup`. Lookup suggestions stay **lightweight** (name, channel, category, location, snippet). Cluster scrapes the public site (and same-apex language alternates such as `hreflang`) in the **original page language**, then Gemini returns **English** onboarding fields (`name`, `website`, `publicBio`, `channelKind`, `category`, `orgType`, `country`, `city`, `province`). If Gemini returns no candidates for a **website** query, Cluster still emits one candidate from the scraped homepage (title / JSON-LD / site name plus the deterministic street) instead of an empty list. The first discover hop may also return **city / country / snippet** so similar names can be told apart. If there is no public website to scrape, Cluster may still fill channel, category, organization type, location, and a short bio from public knowledge of **that named venue**. The Merchant OS form also infers channel and category from tokens in the returned English name (for example `Restaurant` → Physical Store / Food & Beverage) when lookup returns a name-only stub. **Country and city stay blank** when they are not known from a public listing; the form never invents Canada, and cuisine words such as Shanghainese or Shanghai Noodle do **not** mean the shop is in Shanghai or in China. **Choosing a suggestion stays on the cover** and expands the remaining fields (channel, category, organization type, location, Terms, and Continue) already filled from that result. After that pick, Cluster `POST https://beamio.app/api/onboardingBusinessCardSetup` prepares **Card Setup** brand assets from **one homepage scrape**: logo (`shareTokenMetadata.image`), Discover background (`merchantImage`), brand color (`backgroundColor`), and Discover copy (`description`, at most 200 characters). The scrape allowlist includes Open Graph images, JSON-LD logo/image, homepage `<img>` / `srcset`, and CSS `url(https…)`. A favicon or `rel=icon` is a **weak logo** and must not win over a wordmark whose filename or alt contains `logo`. Background prefers a hero or banner image and must not reuse the logo URL. Gemini may only pick URLs from that allowlist; it must not invent image URLs. Logo URLs are accepted only when the path or filename matches the business name; partner or supplier logos are skipped even if they appear first in the scrape. If the page has no scrape image, logo and background stay empty. If the page publishes a theme color, brand color must be one of those scraped hex values. Lookup also **deterministically** extracts street, phone, email, and postal code from JSON-LD, `tel:` / `mailto:`, and visible text. Those contact fields seed **Settings** drafts only; they are **not** Card Setup fields and are **not** written to `shareTokenMetadata`. The cover still does **not** auto-check Terms. After a pick, **tap the business name again** to reopen the last matches and choose a different one without retyping the query. **Country** is any ISO 3166-1 alpha-2 code (for example `CN` for a `.com.cn` site). Province/state uses a coded dropdown for `CA`, `US`, `GB`, `AU`, and `DE`, and free text for every other country. Merchants must pick a suggestion before the rest of the form appears. Clearing the business name collapses the extra fields. The cover does **not** auto-check Terms and does **not** skip Identity / @BeamioTag / Master Key.

## What exists today

### Programs and metadata

Merchant configuration is written to **card0 / `metadata_json`** (HTTP `GET https://beamio.app/api/cardMetadata`) and, where required, to CoNET program-card modules.

| Area | Behavior |
| --- | --- |
| **Card Setup / Program Basic** | Name, imagery, currency, and Discover presentation (`shareTokenMetadata`). After an onboarding business pick, Card Setup may prefill logo, Discover background, brand color, and Discover copy from `POST https://beamio.app/api/onboardingBusinessCardSetup`. Onboarding’s business category, channel, store name, and region are persisted in `shareTokenMetadata.businessProfile`. The **PROGRAM CATEGORY** block is shown only for physical stores; digital/app stores do not automatically write `categories`. |
| **Settlement Margin** | Program Basic buffer on the live CoNET oracle (0–5%, 0.25% steps). Top-up quotes use **oracle + store margin**. Overview shows `+X.XX% store margin`; 0% is “Using the live oracle rate (0% store margin).” The editor is **Settlement Margin**, not Exchange rate. |
| **Membership** | **Base membership** lives in `baseMembership` (index `0`), not as an Add-tier row. Higher paid tiers live in `tiers[]` and must be strictly more expensive. Price and duration may change for future members; issued NFT expiry is unchanged. A direct membership purchase mints a membership NFT with `tokenId ∈ [100, 1e11)` and grants **no** `#0` top-up credit. Fee mode and Add-tier stage use the same on-chain `feeE6[]` schedule, so metadata is a mirror rather than the only purchase-price source. |
| **Tier qualification mode** | Each card has one canonical `tierQualificationMode`: `0` = top-up qualification, `1` = direct membership purchase, `2` = charge qualification. Mode `1` requires a complete fee schedule and cannot mix fee and threshold-only tiers; modes `0` and `2` require threshold tiers and cannot contain membership fees. The mode is initialized atomically with the tier schedule and is never inferred from array position. |
| **Top-up Promotion** | Bonus validity / minimum / percent-or-fixed. The **bonus master switch is independent** of Reward PT. |
| **Credit Gift** | Optional Discover Gift rail. Metadata `giftCreditPurchase: { enabled, feeKind, percentBps, feeE6 }`. Default **OFF**. When ON, Consumer may pay a Discover Gift by burning buyer AA `#0` for gift face **G** plus optional fee **F**; redeem stores **G** only. Publish **always writes** the block (including OFF). Independent of Top-up Promotion / Reward PT. |
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

**Smart Pay Top-up (one CoNET payment):** When Smart Pay includes `#13` legs **and** leftover cash, Consumer UI prefers **one** `topupWithReward13Container`: Relayer AA `executeBatch` runs peer `peerRedeem13ForContainerTopup` (exact `quoteUsdcWithdrawForFiat6(burn13)` CONET-USDC to the **target merchant card**, after escrow **and** ERC20 balance checks), same-store `#13` → `#0`, and leftover cash as EOA **CONET-USDC EIP-3009 `cash`**. **Base USDC is not in that container.** If CONET-USDC is short, Consumer then settles Reward PT (`cash=0`) and pays the leftover via **Base USDC treasuryBridge** as a second step. Cluster CONET-USDC `balanceOf` reject applies when a request includes `cash`. Peer legs remain fail-closed inside the container (no silent cap, no “burn `#13` without USDC”). Cash-only top-up (no `#13` legs) keeps `purchasingCard` / `postBuyCardPoints` (and may use Base USDC treasuryBridge). Issued-NFT social exchange (`#13` → CONET-USDC to the user’s **EOA**) remains a **separate** escrow rail and must not be used as the container peer path.

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
| **Wallet USDC** | Overview and Wallets show **one** merchant-owned **USDC** total: Base USDC + canonical CONET-USDC, summed per EOA and Smart Wallet. The UI does not split those chains. **Every merchant-started USDC transfer or payment** (Pay / Send, escrow deposit, Fuel Pack USDC debit) is an **offline signature** + Cluster → Master / Paymaster; the merchant EOA must not broadcast `USDC.transfer` or hold CNET / ETH for gas. Program-card **USDC Reserve / Diff** is a separate KPI: **Reserve** = `min(rewardEscrowUsdc6, CONET-USDC.balanceOf(card))`; **Diff** = Reserve − `quoteUsdcWithdrawForFiat6(totalSupply(13))`. Deposit funds the `#13` redeem pool via owner EOA EIP-2612 `permit` (when allowance is insufficient) + `fundSocialExchangeUsdcEscrow`; Master Settle_Conet sponsors CNET gas. On-card CONET-USDC that is not in escrow does not count toward Reserve. See [Cash and USDC](cash-and-usdc.md). |

### Fuel and cash (merchant view)

Merchants buy **Fuel Packs** (B-Units) for protocol fees. Pack merchandising shows price and **total B-Units** only.

Merchant Kit Stripe (CAD kits → B-Units / Ket) is **not** the consumer “Buy USDC with card” rail. See [Cash and USDC](cash-and-usdc.md).

## Chain placement

Merchant program cards are **CoNET L1 only**. Do not treat the historical Base UserCard Factory as the current merchant chain.

New cards issued after the CoNET UserCard beacon cutover are **BeaconProxy**. The platform upgrades every such card together with `beacon.upgradeTo`; card addresses stay the same. Historical CREATE cards cannot join the beacon and keep the ChargeReward runtime preCheck.

Writes that need sponsored gas go Cluster → Master (CoNET settle pool; Base USDC legs occupy the Base settle pool). That includes **all merchant USDC outflows**. Reads of program state, metadata, and KPI should prefer RPC / trusted cache, not a centralized API as the source of truth.

### Factory create: one transaction for every card’s tiers

The live CoNET Factory (`0xfA52…774FB`) is **not** upgradeable at the same address. Its existing create call deploys a card proxy whose initializer installs the entire selected tier configuration before the create receipt is returned.

| Card kind | Factory call |
| --- | --- |
| **Direct paid membership** | `createCardCollectionWithInitCode` with an initializer schedule: base fee at on-chain slot `0`, then higher paid tiers in ascending slots. The same receipt makes both fee and duration readable. The payment is membership-only, never a top-up. |
| **Loyalty** (Top-up / Charge) | One create transaction installs the complete threshold schedule, including semantic Base at `tiers[0]`. The route is card-level: a card cannot mix direct purchase, Top-up, and Charge qualification. |

Do **not** create the card first and then call `appendTierForCard`, `setMembershipFees`, or wait for the first purchaser to bootstrap a fee on the new-card path. Metadata/DB writing may finish after the create receipt, but can only mirror the tier schedule that is already on-chain. Do **not** encode the Hardhat 4-tuple AndTiers (`upgradeByBalance`, selector `0x62cb913c`) — that selector is not on the live Factory.

Charge versus Top-up is **card-level `upgradeType`** in initCode, not a field on the 3-tuple. On beacon implementation **V20+**, every qualification mode writes its complete canonical schedule during initialization: direct membership writes both `tiers[0…n)` and `feeE6[0…n)`, while Top-up and Charge write `tiers[0…n)`. A new card therefore has one acquisition mode and cannot be created as a metadata-only base tier. If its atomic initialization reverts, the complete create reverts—there is no partially initialized card.

`appendTierForCard` and purchaser-time fee bootstrap remain compatibility recovery tools for already-deployed historical cards only; neither is an initialization step for a new card.

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
