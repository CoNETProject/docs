# Beamio POS terminal

**Maturity: Public application.** The active POS product is the **POS PWA** loaded by native WebView shells.

| Entry | Role |
| --- | --- |
| https://pos.conet.network/ | Primary POS load URL (and alias paths) |
| https://beamio.app/pos/ | WebView `/pos/` fallback |
| https://pos.beamio.app/ | Root-path Web + **Embedded OTA** (`update.json` + `BeamioPOS-{ver}.zip`) |

Retired native POS business apps (`iOS_NDEF`, `android-NDEF`) are **not** the current implementation.

Parent: [Beamio whitepaper](../beamio.md).

Revision: **2026-08-22**.

## Product role

A POS terminal is a **wallet that is also a lower-level merchant administrator**. The same EOA can be payee and executing terminal. It performs in-store Charge, Top-up, membership issue, coupon claim, redeem, and coupon burn.

It is not Merchant OS. It does not create program cards or edit Programs metadata. Consumer card checkout and Coinbase deposit are **not** POS flows.

## What exists today

| Flow | Behavior |
| --- | --- |
| **Charge** | Bill in the **card currency**. Client sends `amountFiat6 + currency`. The server computes points from `pointsUnitPriceInCurrencyE6`. The client must not convert fiat ↔ USDC for `items[].amount`. |
| **Top-up** | Credits program points after a valid membership. Without a valid membership, plain top-up is refused; the cashier uses **Check Balance → issue membership**. |
| **Membership** | Selector shows **base membership (index 0)** plus each higher paid tier. The terminal sends the locked `membershipFeeFiat6` and must not invent a price. |
| **Check Balance** | Reads membership and balances for the scanned / entered customer. |
| **Claim / Redeem / Burn** | Issued NFT claim, redeem-code consume, POS coupon burn. |
| **Authorization** | New terminals send `beamio_pos_terminal_permission_v1` over DePIN Chat to the merchant EOA. Merchant OS shows **Pending terminal authorization**, not a Messages bubble. |

### Fees (B-Units)

Fixed protocol-fuel fees (not a percent of the bill):

| Flow | Fee | Payer |
| --- | --- | --- |
| Charge | **5 B-Units** | Program-card **owner** |
| NFC / QR Top-up | **20 B-Units** | As implemented on the top-up path |
| Social engagement events | **0.1 B-Unit** | Event fee path |

Cluster **prechecks** B-Unit balance before forwarding Charge. Indexer writes a standalone `{flow}:bunitService` row. Merchant OS may merge that row into the parent Charge / Top-up / Claim line for display.

### Ledger `subordinate`

For POS-executed Charge, Top-up, Claim, Burn, and Redeem, Indexer `subordinate` is the **terminal EOA**. It may equal `payee`. It must **not** equal `payer`. Gift / non-POS consumer charge must not invent a terminal subordinate.

## Protocol dependencies

| Dependency | POS use |
| --- | --- |
| CoNET L1 program card | Membership, points, issued NFTs |
| Cluster / Master | Precheck + gas-sponsored `executeForAdmin` / Charge relay |
| Local IndexedDB | Terminal mnemonic (Consumer/POS persistence model) |
| Layer Minus | POS permission envelope to merchant mailbox |
| Native shell | NFC / camera / `openURL`; business UI remains the PWA |

## Native shell and updates

Shells load the POS PWA. Process death must reload the WebView (no blank black screen). Embedded OTA polls **`https://pos.beamio.app/update.json`**, not `beamio.app/pos/update.json`.

## Trust boundary

- A compromised authorized terminal can charge, top-up, and claim until revoked.
- The terminal wallet is the signer; the merchant owner does not co-sign every ticket.
- Redeem **codes** stay on the client; the chain stores hashes only (except the authenticated gasless-claim relay, which must not persist the plaintext).
- Failed chain reads must not present “no membership / zero balance” when a last trusted value exists.

## Related

- [Beamio](../beamio.md)
- [Consumer PWA](consumer.md)
- [Merchant OS](merchant-os.md)
- [DePIN Chat](../depin-chat.md)
