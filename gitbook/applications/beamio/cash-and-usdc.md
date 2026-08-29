# Beamio cash and USDC

**Maturity: Public application (partial).** Coinbase / Treasury `walletDeposit` and Stripe Crypto Onramp session APIs are live on `https://beamio.app`. Onramp settlement depends on Stripe Crypto Onramp being enabled for the operator account and on the webhook event set. This page is not a claim that every paid session has already settled.

Parent: [Beamio whitepaper](../beamio.md).

Revision: **2026-08-28**.

## Product role

Beamio exposes **more than one cash rail**. They share Stripe or Coinbase as a payment front only when documented. They **must not** share fulfillment code, destination tokens, or user-facing copy.

**Buy USDC with card** is the consumer card rail: the user pays with a credit card on Stripe Crypto Onramp, and Stripe sends native USDC on Base **directly to the owner EOA**. Beamio does not hold inventory USDC or call `USDC.transfer`.

This chapter is the whitepaper source for deposit semantics. Merchant Fuel Packs and Merchant Kit are listed only so they are not confused with consumer USDC.

## Rails (do not merge)

| Rail | User pays | On-chain result | Destination | Implementation |
| --- | --- | --- | --- | --- |
| **Coinbase / `walletDeposit`** | Coinbase Onramp / x402 settle | TreasuryBridgeV3 **LockMint** | **CONET-USDC** on CoNET | Existing wallet-deposit workflow. Do **not** retarget it to Base USDC. |
| **Buy USDC with card** | Stripe Crypto Onramp (card / Stripe policy) | Stripe sends native USDC | **Native USDC on Base** to the owner **EOA** | `eoaUsdcStripe` — independent of `walletDeposit` |
| **Merchant Kit Stripe** | Card (CAD kits) | Kit fulfillment | **B-Units / Ket** on CoNET | Merchant fuel / kit product — **not** a consumer USDC deposit |

Treasury (sole active): **TreasuryBridgeV3** `0xa208982212978550594A7FEEB70a61665d129003`.

Canonical CoNET-USDC for CoNET L1 application settlement is
[`0x5209865D404aA5646eDe5B91CD4218909eA72eDA`](https://mainnet.conet.network/token/0x5209865D404aA5646eDe5B91CD4218909eA72eDA)
(6 decimals). The legacy USDC factory address
`0xfD0D7B0706AaB5E4351bcED37bC3C77ed6813907` is deprecated and must not be
used in new application modules or accounting.

Base USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`.

Base RPC for these reads: `https://base-rpc.conet.network`. Beamio does **not** submit the Onramp USDC transfer.

## Coinbase / Treasury (`walletDeposit`)

Coinbase `walletDeposit` is still the CONET-USDC LockMint path. Home **Fund Wallet** no longer uses a Coinbase row for that rail: the middle card is **Receive via QR** (peer-to-peer EIP-681 to the owner EOA on Base). That QR is **not** a third deposit rail and must not share fulfillment with `walletDeposit` or `eoaUsdcStripe`. The third Fund row (**Receive from a wallet**) asks the native shell which catalog apps are installed (MetaMask, Coinbase Wallet, OKX, TokenPocket, Phantom), then opens the **PWA-built** deep link so that app can send Base USDC to the same EOA. In a **desktop browser**, the same row uses the injected provider: it must `eth_sendTransaction` a Base USDC `transfer` to the owner EOA (after connect + switch/add Base). A connect-or-switch-only path does not open the extension send UI. Neither the deep link nor the injected transfer is a third deposit rail. Coinbase Onramp remains a separate Add Cash entry when the client opens `WALLET_USDC_DEPOSIT_WORKFLOW = 'walletDeposit'`.

1. User completes Coinbase / x402 settle.
2. Master occupies the **Base** settle pool for the lock step.
3. Treasury V3 LockMint produces **CONET-USDC** for the user on CoNET.

This rail is unchanged by the Stripe Onramp product. Clients must keep `WALLET_USDC_DEPOSIT_WORKFLOW = 'walletDeposit'` for Coinbase.

## Buy USDC with card (`eoaUsdcStripe`)

Consumer path: **Home → Fund Wallet** (Stripe Crypto Onramp; same rail as **Buy USDC with card**). Stripe **Crypto Onramp** sends native USDC on Base to the owner **EOA**. Beamio does **not** accept card cash and then `USDC.transfer` from an operator settle wallet.

```text
Consumer PWA
  │  POST /api/eoaUsdcStripe/createSession
  │  { walletAddress, amountUsdc6 }
  ▼
Cluster precheck → Master
  │  Resolve owner EOA (if the submitted address is an AA, read factory owner())
  │  POST Stripe /v1/crypto/onramp_sessions
  │    destination_network=base, destination_currency=usdc
  │    lock_wallet_address=true
  │    source_amount + source_currency=usd
  ▼
User completes Stripe Onramp in the system browser
  │
  ├─ return: https://beamio.app/app/?eoa_usdc_stripe=success|cancel&session_id=…
  ├─ poll:   POST /api/eoaUsdcStripe/poll
  └─ hook:   POST /api/stripeBeamioHook  (crypto.onramp_session.*)
        ▼
  Stripe fulfillment_complete → session succeeded
  Optional transaction_id (0x + 64 hex) stored as usdcTxHash
```

Retired Stripe Checkout (`cs_`) sessions are marked failed. Users must start a new Onramp deposit.

### Amounts

| Rule | Value |
| --- | --- |
| Client units | `amountUsdc6` — 6 decimals (`1 USDC` = `1000000`) |
| Minimum | 1 USDC |
| Maximum | 10,000 USDC |
| Stripe create | `source_amount` as human-readable USD + `source_currency=usd` |
| Credited USDC | May be slightly less than the selected `$N` after Stripe Onramp fees |

A successful `createSession` is **not** proof that USDC has arrived. Success is Stripe `fulfillment_complete`. Do not treat `fulfillment_processing` as succeeded.

### HTTP (application API host `https://beamio.app`)

| Method | Path | Body | Result |
| --- | --- | --- | --- |
| `POST` | `/api/eoaUsdcStripe/createSession` | `{ walletAddress, amountUsdc6 }` | `{ sessionId, url }` (`cos_` Onramp) |
| `POST` | `/api/eoaUsdcStripe/poll` | `{ sessionId, userClosedCheckout? }` | Session status + optional `usdcTxHash` / `recipientEoa` |
| `POST` | `/api/stripeBeamioHook` | Stripe signed payload | Shared live webhook; Onramp events mirror status and **do not** send operator USDC |

Cluster performs precheck (address, amount bounds). Master creates the Onramp session and holds the in-memory session map. Master **does not** occupy `Settle_BasePool` and **does not** call `USDC.transfer` on this rail.

### Recipient

Onramp creation **locks** the destination to the owner **EOA** on Base:

- Preferred client input: Consumer `keyID` (EOA).
- If the client sends an AA address, the server resolves `owner()` via the Base (then CoNET) AA factory **before** creating the Onramp session.

The product does **not** mint CONET-USDC on this rail and does **not** send USDC to the AA.

### Operator configuration

The operator Stripe account is the **`StripeBeamio`** key on the API host’s local `~/.master.json`. Merchant Kit Checkout and Consumer Onramp use this account. The account must have **Crypto Onramp** enabled (including sandbox approval in the Stripe Dashboard).

The only live Dashboard webhook is **`https://beamio.app/api/stripeBeamioHook`**. Verification uses **`STRIPE_WEBHOOK_SECRET_MERCHANT_KIT`** (environment or the same `~/.master.json`). This book does not publish secret values. The Dashboard event set for that endpoint must include `crypto.onramp_session.updated` (Onramp) and the Merchant Kit `checkout.session.*` events. Without that secret, Onramp can still be created, but webhook confirmation will abort.

The API still **forwards** the retired paths `/api/eoa-usdc-stripe-webhook` and `/api/merchant-kit-stripe-webhook` to the same `stripeBeamioHook` handler. Do **not** add those URLs in the Stripe Dashboard. `https://hooks.conet.network/api/stripeHook` is not a Beamio live hook.

Onramp handlers must ignore `checkout.session.*` for consumer USDC. Those events must not trigger operator inventory transfers or Merchant Kit fulfillment on the Onramp rail.

## What this page does not cover

- Merchant Fuel Pack checkout (B-Units merchandising).
- POS Charge / Top-up (program points + B-Unit fees). See [POS terminal](pos.md).
- Issued-NFT social exchange: burning `#13` is paid from merchant card
  `escrowUsdc6` in canonical CoNET-USDC to the user's EOA, not directly to the
  user's AA. See [Merchant OS](merchant-os.md).
- Cross-chain Treasury mechanics beyond naming the V3 proxy. See [Decentralized cross-chain Treasury](../../l1/cross-chain-treasury.md).

## Trust boundary

| Actor | Can do | Must not |
| --- | --- | --- |
| Stripe | Confirm payment and send Base USDC to the locked EOA | Hold Beamio user keys; send a different token or destination than the locked Onramp session |
| Cluster / Master | Create Onramp sessions, poll, mirror webhook status | Persist user private keys; `USDC.transfer` from an operator wallet; reuse Merchant Kit fulfillment; write CONET-USDC on this rail |
| Operator settle wallet | Not used on this rail | Be described as the source of Buy-USDC-with-card funds |
| Consumer client | Open Onramp, poll, show EOA destination | Treat AA as the payout address; merge this rail into `walletDeposit` |

## Related

- [Beamio](../beamio.md)
- [Consumer PWA](consumer.md)
- [Merchant OS](merchant-os.md)
- [L1 assets](../../l1/assets.md)
- [Decentralized cross-chain Treasury](../../l1/cross-chain-treasury.md)
