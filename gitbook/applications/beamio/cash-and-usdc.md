# Beamio cash and USDC

**Maturity: Public application (partial).** Coinbase / Treasury `walletDeposit` and Stripe Crypto Onramp session APIs are live on `https://beamio.app`. Onramp settlement depends on Stripe Crypto Onramp being enabled for the operator account and on the webhook event set. This page is not a claim that every paid session has already settled.

Parent: [Beamio whitepaper](../beamio.md).

Revision: **2026-08-22**.

## Product role

Beamio exposes **more than one cash rail**. They share Stripe or Coinbase as a payment front only when documented. They **must not** share fulfillment code, destination tokens, or user-facing copy.

This chapter is the whitepaper source for deposit semantics. Merchant Fuel Packs and Merchant Kit are listed only so they are not confused with consumer USDC.

## Rails (do not merge)

| Rail | User pays | On-chain result | Destination | Implementation |
| --- | --- | --- | --- | --- |
| **Coinbase / `walletDeposit`** | Coinbase Onramp / x402 settle | TreasuryBridgeV3 **LockMint** | **CONET-USDC** on CoNET | Existing wallet-deposit workflow. Do **not** retarget it to Base USDC. |
| **Buy USDC with card** | Stripe Crypto Onramp (card / Stripe policy) | Stripe sends native USDC | **Native USDC on Base** to the owner **EOA** | `eoaUsdcStripe` — independent of `walletDeposit` |
| **Merchant Kit Stripe** | Card (CAD kits) | Kit fulfillment | **B-Units / Ket** on CoNET | Merchant fuel / kit product — **not** a consumer USDC deposit |

Treasury (sole active): **TreasuryBridgeV3** `0xa208982212978550594A7FEEB70a61665d129003`.

Base USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`.

Base RPC for these reads: `https://base-rpc.conet.network`. Beamio does **not** submit the Onramp USDC transfer.

## Coinbase / Treasury (`walletDeposit`)

Consumer Wallet / Home keep **Coinbase** as the existing add-cash path.

1. User completes Coinbase / x402 settle.
2. Master occupies the **Base** settle pool for the lock step.
3. Treasury V3 LockMint produces **CONET-USDC** for the user on CoNET.

This rail is unchanged by the Stripe Onramp product. Clients must keep `WALLET_USDC_DEPOSIT_WORKFLOW = 'walletDeposit'` for Coinbase.

## Buy USDC with card (`eoaUsdcStripe`)

Consumer path: **Home / Wallet → Buy USDC with card**. Stripe **Crypto Onramp** sends native USDC on Base to the owner **EOA**. Beamio does **not** accept card cash and then `USDC.transfer` from an operator settle wallet.

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
  └─ hook:   POST /api/eoa-usdc-stripe-webhook  (crypto.onramp_session.*)
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
| `POST` | `/api/eoa-usdc-stripe-webhook` | Stripe signed payload | Mirrors Onramp status; **does not** send operator USDC |

Cluster performs precheck (address, amount bounds). Master creates the Onramp session and holds the in-memory session map. Master **does not** occupy `Settle_BasePool` and **does not** call `USDC.transfer` on this rail.

### Recipient

Onramp creation **locks** the destination to the owner **EOA** on Base:

- Preferred client input: Consumer `keyID` (EOA).
- If the client sends an AA address, the server resolves `owner()` via the Base (then CoNET) AA factory **before** creating the Onramp session.

The product does **not** mint CONET-USDC on this rail and does **not** send USDC to the AA.

### Operator configuration

The Stripe account must have **Crypto Onramp** enabled (including sandbox approval in the Stripe Dashboard).

Webhook verification uses a dedicated secret name: `STRIPE_WEBHOOK_SECRET_EOA_USDC` (environment or the API host’s local `~/.master.json`). This book does not publish secret values. The Dashboard event set must include `crypto.onramp_session.updated`. Without that secret, Onramp can still be created, but webhook confirmation will abort.

Checkout `checkout.session.*` events are ignored on this webhook. They must not trigger operator inventory transfers.

## What this page does not cover

- Merchant Fuel Pack checkout (B-Units merchandising).
- POS Charge / Top-up (program points + B-Unit fees). See [POS terminal](pos.md).
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
