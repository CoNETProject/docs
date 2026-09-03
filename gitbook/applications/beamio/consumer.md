# Beamio Consumer PWA

**Maturity: Production reference.** The Consumer PWA is live at
[https://beamio.app/app/](https://beamio.app/app/). This chapter is a product
inventory, not a screen-by-screen manual and not a claim of audit or SLA
coverage.

Parent: [Beamio whitepaper](../beamio.md).

Revision: **2026-09-01**.

## Product role

The Consumer PWA is the end-user Beamio wallet and marketplace. A person recovers or creates a self-custody EOA, optionally uses a Smart Wallet (Express Pay), discovers merchant programs, claims issued assets, chats over Layer Minus, and adds cash through the documented USDC rails.

It is not Merchant OS and not a POS terminal. It does not hold merchant program-admin authority.

## What exists today

| Domain | Capability |
| --- | --- |
| **Wallet** | Self-custody EOA from a local 12-word mnemonic. Cold start derives a global signing key. Missing mnemonic requires Restore (`@BeamioTag` + access password → on-chain recover package). |
| **Smart Wallet** | Optional AA / Express Pay. **New consumer AA issuance is CoNET only.** Existing Base V1 accounts may remain readable; they are not a new-issuance path. |
| **Identity** | `@BeamioTag`, profile language / currency, AddressPGP registration for Chat |
| **Discover** | Featured Brands and Ongoing Coupons from the public latest-cards / coupon APIs (single merchant-visibility gate). Merchant detail **Top Up** (store-credit button and welcome-offer CTA when membership is already valid) opens a multi-step full-screen flow: amount → pay → optional Reward PT cover → confirm. **Smart Pay** (Use Points on) prefers **one CoNET payment** when Reward PT does not cover the full quote: `topupWithReward13Container` with peer `#13` redeem, same-store `#13` → `#0` on the user’s **AA** (no USDC escrow), and leftover cash as EOA **CONET-USDC EIP-3009 `cash`** in the same Relayer AA `executeBatch`. **Base USDC is not in that container.** If CONET-USDC is short, Consumer then settles Reward PT (`cash=0`) and pays the leftover via **Base USDC treasuryBridge** as a second step. The success screen is a centered confirmation (minted store-credit amount, currency prefix) plus a **Share & Earn** card that shares the Discover merchant `/app-download` link with the signer’s `ref=` when a wallet is present; **Done** closes the overlay. Insufficient CONET-USDC and Base USDC together, and a failed step, stay on the **confirm** panel (not the payment-method page). Cash-only (no Reward PT legs) may still pay with **Base USDC** via treasuryBridge, then CoNET-USDC, then third-party. Paid **Join / Upgrade** still uses the locked membership-fee path, not this Top Up flow. |
| **Issued assets** | Coupons and Business Catalogs: open claim, like / share stats, supply copy |
| **Programs held** | Membership NFT (`tokenId ∈ [100, 1e11)`), program points (`#0`), Reward PT (`#13`). Paid join / upgrade charges the **locked membership fee only**, shown to two decimal places (for example `CA$0.50`). A leftover `#0` min-unit may appear as `0.00` program points so `mintPointsByAdmin` is non-zero; it is **not** the membership NFT and is not added to the payable amount. |
| **Messaging** | CoNET Chat (ordinary sends **omit** mailbox `NoPush` so offline peers can get a native badge), delivery receipts (`NoPush: true`), mailbox presence (listen-pool query; not on-chain `routeOnline`) |
| **Network tools** | Bounty Board, CoNET mining views, Genesis referral, Referral registry |
| **Team wallets** | V2 institutional multisig AA (CoNET, optional Base). See [Institutional multisig AA](../institutional-multisig-aa.md). |
| **Fuel** | Fuel Packs shown as **price + total B-Units** only (no Paid / Free split in merchandising) |
| **Native shell** | iOS / Android WebView at `/app/` plus Embedded OTA (`update.json` + `SilentPassUI-{ver}.zip`). Share / install links (`https://beamio.app/app-download?target=https://beamio.app/app/?…`) open **Consumer only**. They never open BeamioPOS. If Consumer is not installed, the page stays in Safari or the Consumer App Store. |

Wallet identity colors are fixed in the product: **EOA blue**, **AA purple**. Those colors mark wallet kind, not balances.

## Cash (consumer)

Two independent deposit rails. Do not merge them in UI copy or implementation:

| Rail | User-visible result | Chapter |
| --- | --- | --- |
| Coinbase / `walletDeposit` | CONET-USDC via Treasury LockMint | [Cash and USDC](cash-and-usdc.md) |
| **Buy USDC with card** | Stripe Crypto Onramp sends native **USDC on Base** to the owner **EOA** | [Cash and USDC](cash-and-usdc.md) |

The Consumer Home hub shows **Universal Cash** (USDC) plus **Store Credits** and **My Points** (`#13`). The Home card rail button is **Fund Wallet**. That sheet is **not** a third deposit rail. It offers:

| Fund Wallet row | What it does | Not |
| --- | --- | --- |
| **Debit card** | Stripe Crypto Onramp (`eoaUsdcStripe`) — native **USDC on Base** to the owner **EOA** | Coinbase `walletDeposit` |
| **Receive via QR** | EIP-681 QR `ethereum:<EOA>@8453` for MetaMask / Coinbase Wallet scanners. Peer-to-peer send to this EOA on Base. | A Beamio deposit API or `walletDeposit` |
| **Receive from a wallet** | Native CashTrees / CaehTrees: catalog (`queryInstalledApps`) then `openURL` with the **PWA-built** EIP-681 send link (Base USDC to the owner EOA). Native must not invent the URL. **Desktop browser:** EIP-6963 injected wallet → `eth_requestAccounts`, switch/add Base (`0x2105`), then `eth_sendTransaction` USDC `transfer` to the owner EOA (**amount required** so the extension confirmation appears). Connect-and-switch alone is not enough. Mobile browser: HTTPS / custom-scheme send links. Not a Beamio deposit API. | Coinbase Onramp / `walletDeposit` |

The middle Fund row is **Receive via QR**, not Coinbase. Coinbase `walletDeposit` remains a separate Add Cash path (CONET-USDC via Treasury LockMint). Stripe Onramp opens in the system browser (or native `openURL` bridge). Return lands on `https://beamio.app/app/?eoa_usdc_stripe=…`.

The client should pass the **EOA** (`keyID`), not the AA address. If an AA address is submitted, Master resolves the owner EOA **when creating** the Onramp session and locks that wallet. Success is Stripe `fulfillment_complete`, not a Beamio `USDC.transfer`.

## Send / pay USDC (consumer)

Beamio’s own USDC outflows (Pay / Send, Gift, Discover leftover cash, AA ↔ EOA) are **offline signatures**. The Consumer wallet signs EIP-712 / EIP-3009 / EIP-2612 / Container / UserOp locally and POSTs the authorization to Cluster. Master or the Factory Paymaster submits and sponsors ETH or CNET gas. The PWA must not `eth_sendTransaction` / `USDC.transfer` for a Beamio send, and it must not require the user to hold native gas.

**Receive from a wallet** and **Receive via QR** stay inbound exceptions: a third-party wallet sends **into** the owner EOA and that peer pays gas. Do not reuse that injected `eth_sendTransaction` path for Beamio Pay / Send. Detail and signing table: [Cash and USDC](cash-and-usdc.md).

## Protocol dependencies

| Dependency | Consumer use |
| --- | --- |
| CoNET L1 | Account, program assets, Smart Wallet, Chat index, mining / referral views |
| Base | Stripe Onramp USDC destination; Coinbase lock step; optional institutional AA |
| Layer Minus | Chat listen / send (entry ≠ mailbox) |
| Cluster / Master | Gas-sponsored writes (including all Beamio USDC outflows), Stripe session create / poll, `walletDeposit` |
| Local IndexedDB | Mnemonic and derived key (Consumer allows persistence; Merchant OS does not) |

## Trust boundary

- Device storage of the mnemonic is a product choice for Consumer. Device compromise can expose the wallet.
- Relays and Stripe do not receive the user’s private key.
- Discover lists are application-filtered public catalogs, not a chain-wide census of every created card.
- Buy USDC with card succeeds only after Stripe Onramp `fulfillment_complete`. Stripe sends the USDC; Beamio does not transfer operator inventory.

## Related

- [Beamio](../beamio.md)
- [Merchant OS](merchant-os.md)
- [POS terminal](pos.md)
- [Cash and USDC](cash-and-usdc.md)
- [CoNET Chat](../depin-chat.md)
- [Institutional multisig AA](../institutional-multisig-aa.md)
