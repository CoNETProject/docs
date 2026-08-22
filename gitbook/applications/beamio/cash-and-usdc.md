# Beamio cash and USDC

**Maturity: Public application (partial).** Coinbase / Treasury `walletDeposit` and card-checkout session APIs are live on `https://beamio.app`. Card-checkout settlement still depends on operator Stripe webhook configuration and Base USDC inventory. This page is not a claim that every paid session has already settled.

Parent: [Beamio whitepaper](../beamio.md).

Revision: **2026-08-22**.

## Product role

Beamio exposes **more than one cash rail**. They share Stripe or Coinbase as a payment front only when documented. They **must not** share fulfillment code, destination tokens, or user-facing copy.

This chapter is the whitepaper source for deposit semantics. Merchant Fuel Packs and Merchant Kit are listed only so they are not confused with consumer USDC.

## Rails (do not merge)

| Rail | User pays | On-chain result | Destination | Implementation |
| --- | --- | --- | --- | --- |
| **Coinbase / `walletDeposit`** | Coinbase Onramp / x402 settle | TreasuryBridgeV3 **LockMint** | **CONET-USDC** on CoNET | Existing wallet-deposit workflow. Do **not** retarget it to Base USDC. |
| **Buy USDC with card** | Stripe Checkout (card) | ERC-20 **`transfer`** | **Native USDC on Base** to the owner **EOA** | `eoaUsdcStripe` — independent of `walletDeposit` |
| **Merchant Kit Stripe** | Card (CAD kits) | Kit fulfillment | **B-Units / Ket** on CoNET | Merchant fuel / kit product — **not** a consumer USDC deposit |

Treasury (sole active): **TreasuryBridgeV3** `0xa208982212978550594A7FEEB70a61665d129003`.

Base USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`.

Base RPC for these reads / transfers: `https://base-rpc.conet.network`.

## Coinbase / Treasury (`walletDeposit`)

Consumer Wallet / Home keep **Coinbase** as the existing add-cash path.

1. User completes Coinbase / x402 settle.
2. Master occupies the **Base** settle pool for the lock step.
3. Treasury V3 LockMint produces **CONET-USDC** for the user on CoNET.

This rail is unchanged by the card-checkout product. Clients must keep `WALLET_USDC_DEPOSIT_WORKFLOW = 'walletDeposit'` for Coinbase.

## Buy USDC with card (`eoaUsdcStripe`)

New consumer path: **Home / Wallet → Buy USDC with card**.

```text
Consumer PWA
  │  POST /api/eoaUsdcStripe/createSession
  │  { walletAddress, amountUsdc6 }
  ▼
Cluster precheck → Master
  │  Stripe Checkout Session (product: USDC on Base)
  ▼
User pays in the system browser
  │
  ├─ return: https://beamio.app/app/?eoa_usdc_stripe=success|cancel&session_id=…
  ├─ poll:   POST /api/eoaUsdcStripe/poll
  └─ hook:   POST /api/eoa-usdc-stripe-webhook
        ▼
  Resolve owner EOA (if the submitted address is an AA, read factory owner())
        ▼
  Base settle pool: USDC.transfer(eoa, amountUsdc6)
```

### Amounts

| Rule | Value |
| --- | --- |
| Token units | `amountUsdc6` — 6 decimals (`1 USDC` = `1000000`) |
| Minimum | 1 USDC |
| Maximum | 10,000 USDC |
| Stripe cents | `amountUsdc6 / 10000` (whole USD cents only) |
| Checkout title | `USDC on Base` |

### HTTP (application API host `https://beamio.app`)

| Method | Path | Body | Result |
| --- | --- | --- | --- |
| `POST` | `/api/eoaUsdcStripe/createSession` | `{ walletAddress, amountUsdc6 }` | `{ sessionId, url }` |
| `POST` | `/api/eoaUsdcStripe/poll` | `{ sessionId, userClosedCheckout? }` | Session status + optional `usdcTxHash` / `recipientEoa` |
| `POST` | `/api/eoa-usdc-stripe-webhook` | Stripe signed payload | Confirms paid sessions and triggers fulfill |

Cluster performs precheck (address, amount bounds). Master holds the in-memory session map and submits the Base transfer. Master occupy is **`Settle_BasePool` only** (not the CoNET pool).

### Recipient

Fulfillment always pays the **owner EOA** on Base:

- Preferred client input: Consumer `keyID` (EOA).
- If the client sends an AA address, the server resolves `owner()` via the Base (then CoNET) AA factory before `transfer`.

The product does **not** mint CONET-USDC on this rail and does **not** send USDC to the AA.

### Operator configuration

Webhook verification uses a dedicated secret name: `STRIPE_WEBHOOK_SECRET_EOA_USDC` (environment or the API host’s local `~/.master.json`). This book does not publish secret values. Without that secret, Checkout can still be created, but webhook confirmation will abort.

Fulfillment also requires the Base settle wallet to hold enough native USDC. A successful `createSession` is not by itself proof that inventory is funded.

## What this page does not cover

- Merchant Fuel Pack checkout (B-Units merchandising).
- POS Charge / Top-up (program points + B-Unit fees). See [POS terminal](pos.md).
- Cross-chain Treasury mechanics beyond naming the V3 proxy. See [Decentralized cross-chain Treasury](../../l1/cross-chain-treasury.md).

## Trust boundary

| Actor | Can do | Must not |
| --- | --- | --- |
| Stripe | Confirm card payment | Hold Beamio user keys; choose a different on-chain token than documented |
| Cluster / Master | Create sessions, transfer operator USDC | Persist user private keys; reuse Merchant Kit fulfillment; write CONET-USDC on this rail |
| Operator settle wallet | Source of Base USDC | Be described as the user’s wallet |
| Consumer client | Open Checkout, poll, show EOA destination | Treat AA as the payout address; merge this rail into `walletDeposit` |

## Related

- [Beamio](../beamio.md)
- [Consumer PWA](consumer.md)
- [Merchant OS](merchant-os.md)
- [L1 assets](../../l1/assets.md)
- [Decentralized cross-chain Treasury](../../l1/cross-chain-treasury.md)
