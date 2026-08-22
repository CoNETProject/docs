# Beamio Consumer PWA

**Maturity: Public application.** The Consumer PWA is live at [https://beamio.app/app/](https://beamio.app/app/). This chapter is a product inventory, not a screen-by-screen manual and not a claim of audit or SLA coverage.

Parent: [Beamio whitepaper](../beamio.md).

Revision: **2026-08-22**.

## Product role

The Consumer PWA is the end-user Beamio wallet and marketplace. A person recovers or creates a self-custody EOA, optionally uses a Smart Wallet (Express Pay), discovers merchant programs, claims issued assets, chats over Layer Minus, and adds cash through the documented USDC rails.

It is not Merchant OS and not a POS terminal. It does not hold merchant program-admin authority.

## What exists today

| Domain | Capability |
| --- | --- |
| **Wallet** | Self-custody EOA from a local 12-word mnemonic. Cold start derives a global signing key. Missing mnemonic requires Restore (`@BeamioTag` + access password → on-chain recover package). |
| **Smart Wallet** | Optional AA / Express Pay. **New consumer AA issuance is CoNET only.** Existing Base V1 accounts may remain readable; they are not a new-issuance path. |
| **Identity** | `@BeamioTag`, profile language / currency, AddressPGP registration for Chat |
| **Discover** | Featured Brands and Ongoing Coupons from the public latest-cards / coupon APIs (single merchant-visibility gate) |
| **Issued assets** | Coupons and Business Catalogs: open claim, like / share stats, supply copy |
| **Programs held** | Membership NFT, program points (`#0`), Reward PT (`#13`) |
| **Messaging** | DePIN Chat, delivery receipts, mailbox presence (listen-pool query; not on-chain `routeOnline`) |
| **Network tools** | Bounty Board, CoNET mining views, Genesis referral, Referral registry |
| **Team wallets** | V2 institutional multisig AA (CoNET, optional Base). See [Institutional multisig AA](../institutional-multisig-aa.md). |
| **Fuel** | Fuel Packs shown as **price + total B-Units** only (no Paid / Free split in merchandising) |
| **Native shell** | iOS / Android WebView at `/app/` plus Embedded OTA (`update.json` + `SilentPassUI-{ver}.zip`) |

Wallet identity colors are fixed in the product: **EOA blue**, **AA purple**. Those colors mark wallet kind, not balances.

## Cash (consumer)

Two independent deposit rails. Do not merge them in UI copy or implementation:

| Rail | User-visible result | Chapter |
| --- | --- | --- |
| Coinbase / `walletDeposit` | CONET-USDC via Treasury LockMint | [Cash and USDC](cash-and-usdc.md) |
| **Buy USDC with card** | Native **USDC on Base** transferred to the owner **EOA** | [Cash and USDC](cash-and-usdc.md) |

The Consumer UI exposes card checkout on Home / Wallet as **Buy USDC with card**. Checkout opens in the system browser (or native `openURL` bridge). Return lands on `https://beamio.app/app/?eoa_usdc_stripe=…`.

The client should pass the **EOA** (`keyID`), not the AA address. If an AA address is submitted, fulfillment still resolves the owner EOA before the Base transfer.

## Protocol dependencies

| Dependency | Consumer use |
| --- | --- |
| CoNET L1 | Account, program assets, Smart Wallet, Chat index, mining / referral views |
| Base | Card-checkout USDC payout; Coinbase lock step; optional institutional AA |
| Layer Minus | Chat listen / send (entry ≠ mailbox) |
| Cluster / Master | Gas-sponsored writes, Stripe session create / poll, `walletDeposit` |
| Local IndexedDB | Mnemonic and derived key (Consumer allows persistence; Merchant OS does not) |

## Trust boundary

- Device storage of the mnemonic is a product choice for Consumer. Device compromise can expose the wallet.
- Relays and Stripe do not receive the user’s private key.
- Discover lists are application-filtered public catalogs, not a chain-wide census of every created card.
- Card checkout succeeds for the user only after Stripe payment **and** a successful Base USDC transfer from the operator settle wallet.

## Related

- [Beamio](../beamio.md)
- [Merchant OS](merchant-os.md)
- [POS terminal](pos.md)
- [Cash and USDC](cash-and-usdc.md)
- [DePIN Chat](../depin-chat.md)
- [Institutional multisig AA](../institutional-multisig-aa.md)
