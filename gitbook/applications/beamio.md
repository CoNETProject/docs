# Beamio

**Maturity: Public application.** Consumer, merchant, and POS entry points are public. This label describes product availability, not completion of every workflow, independent contract audit, or guaranteed service availability.

Public site: [https://gitbook.conet.network/applications/beamio.html](https://gitbook.conet.network/applications/beamio.html)

## Product role

Beamio is the application suite that turns CoNET wallet identity, account state, and Layer Minus messaging into three coordinated products:

| Surface | Product role | Public entry |
| --- | --- | --- |
| **Consumer PWA** | Self-custody wallet, Smart Wallet access, Discover, coupons, messaging, and CoNET-facing account tools | [https://beamio.app/app/](https://beamio.app/app/) |
| **Merchant OS** | Merchant program management, staff and terminal administration, settlements, coupons, and catalogs | [https://biz.beamio.app](https://biz.beamio.app) |
| **POS PWA** | In-store charge, top-up, claim, and redeem operations performed by an authorized terminal wallet | [https://pos.conet.network/](https://pos.conet.network/) · [https://beamio.app/pos/](https://beamio.app/pos/) |

Beamio is not a fourth protocol tier. It coordinates application state across CoNET L1, Layer Minus, local wallet storage, and gas-relay services.

The active POS product is the **POS PWA loaded by native WebView shells**. Retired native iOS and Android POS business interfaces are not the current product implementation.

## Protocol dependencies

| Dependency | Beamio use |
| --- | --- |
| **CoNET L1 (`chainId` 224422)** | Wallet and account state, merchant program state, consumer Smart Wallets, institutional V2 accounts, assets, identity records, and application registries |
| **L0 / Layer Minus** | DePIN Chat, POS terminal-authorization messages, routed mailbox delivery, and optional UDP frame forwarding |
| **EOA + `@BeamioTag` identity** | Human-readable discovery anchored to a wallet; the EOA also owns the PGP material used by messaging |
| **Cluster / Master relay** | Prechecks application write requests and submits approved gas-sponsored transactions; it is not the source of a user’s private key |
| **Local application storage** | Holds client state and, depending on the product, self-custody wallet material or session state |
| **Base (`chainId` 8453)** | Treasury and USDC operations, plus supported institutional multisig deployments; not new merchant programs or new consumer Smart Wallet issuance |

Merchant program cards and new consumer Smart Wallet accounts belong on CoNET L1. Base remains a separate execution environment for its limited active roles. A matching address on two chains does not imply shared balances or shared application state.

## How protocol capability becomes product behavior

### Consumer

The Consumer PWA derives a signing wallet from device-local recovery material, reads account state from the relevant chain, and uses application relays for gas-sponsored writes. The same EOA can register an AddressPGP identity for DePIN Chat. Smart Wallet state is on-chain; the interface and recoverable local cache are application concerns.

### Merchant

Merchant OS maps an owner EOA and authorized staff relationships to program-management screens. The merchant signs with session-memory key material after recovery and unlock. Long-term merchant signing material is not intended to be persisted by the Merchant OS browser application.

### POS

A POS terminal is its own wallet and operates as an authorized lower-level merchant administrator. It signs terminal operations through the POS PWA, while the Cluster / Master path performs validation and gas relay. Terminal authorization itself can be delivered as a typed DePIN Chat message to Merchant OS.

The application therefore combines:

```text
L1 state and signatures
        +
L0 routed messages
        +
local wallet and UI state
        +
gas-relay services
        =
consumer, merchant, and POS workflows
```

No single layer supplies the complete product experience.

## What exists today

Public endpoints:

| Item | URL |
| --- | --- |
| Consumer app | https://beamio.app/app/ |
| Merchant OS | https://biz.beamio.app |
| POS | https://pos.conet.network/ · https://beamio.app/pos/ |
| API host | https://beamio.app |
| Explorer | https://mainnet.conet.network |
| CoNET L1 RPC | https://rpc1.conet.network · https://publicrpc.conet.network |

Source availability differs by surface. Consumer, Merchant OS, and Alliance are public branches of the same SilentPassUI repository. POS PWA is a live product; a standalone public repository has not been identified.

| Component | Public repository | npm |
| --- | --- | --- |
| **Consumer PWA** | [CoNET-project/SilentPassUI](https://github.com/CoNET-project/SilentPassUI/tree/cashtree) branch `cashtree` | — |
| **Merchant OS** | [CoNET-project/SilentPassUI](https://github.com/CoNET-project/SilentPassUI/tree/cashtrees) branch `cashtrees` | — |
| **POS PWA** | Live endpoints only; no standalone public repository identified | — |
| **Alliance client** | [CoNET-project/SilentPassUI](https://github.com/CoNET-project/SilentPassUI/tree/Alliance) branch `Alliance` | — |
| **API / Cluster / Master / Paymaster relay** | [settleonbase/x402sdk](https://github.com/settleonbase/x402sdk) | [`@settle402/sdk`](https://www.npmjs.com/package/@settle402/sdk) |
| **Marketing homepage** | [beamio-APP/homepage](https://github.com/beamio-APP/homepage) | — |
| **DePIN Chat SDK** | [CoNET-project/chat-sdk](https://github.com/CoNET-project/chat-sdk) | [`@conet.project/chat-sdk`](https://www.npmjs.com/package/@conet.project/chat-sdk) |
| **Mailbox / SI** | [CoNET-project/CoNET-SI](https://github.com/CoNET-project/CoNET-SI) | [`@conet.project/mvp-si`](https://www.npmjs.com/package/@conet.project/mvp-si) |
| **This documentation** | [CoNETProject/docs](https://github.com/CoNETProject/docs) | — |

The public surfaces and source show that the suite and its major integration paths exist. This page does not claim that every route is enabled for every account, that every chain deployment has identical configuration, or that all application services have a published SLA.

## What remains in development

- Continue hardening wallet recovery, account switching, native WebView integration, and cross-device consistency.
- Complete independent reviews of account contracts, relayers, local key handling, and merchant / POS authorization paths.
- Improve feature parity and accessibility across Consumer, Merchant OS, POS PWA, and native shells.
- Publish measured availability and performance expectations for RPC, relay, mailbox, metadata, and index-backed views.
- Continue simplifying boundaries between user-facing state, trusted chain reads, cached application data, and asynchronous settlement.
- Expand product documentation for individual merchant and POS workflows without turning this protocol-placement page into an operator manual.

## Trust and security boundary

| Boundary | Security implication |
| --- | --- |
| **Consumer and POS wallet storage** | The device can hold recoverable signing material. Device compromise can expose that wallet. Recovery and backup hygiene remain user responsibilities. |
| **Merchant OS wallet session** | Signing material is intended to remain in session memory. Closing or locking the session requires recovery and unlock again; a compromised active browser session can still sign. |
| **L1 contracts** | Enforce account and program state, but contract safety depends on deployed bytecode, upgrade authority, configuration, and audits. |
| **Cluster / Master / Paymaster** | Can validate, queue, sponsor, delay, or refuse supported writes. They must not receive or store user private keys, and their availability affects gasless UX. |
| **Layer Minus messaging** | Business plaintext is encrypted to recipient keys, but entries and mailboxes still observe limited routing, timing, and volume metadata. |
| **POS terminal authority** | A compromised authorized terminal can exercise the permissions granted to that terminal until access is revoked. |
| **Multiple chains** | CoNET and Base have independent state. A same-address deployment does not synchronize balances, nonces, policies, or tasks. |

Beamio is self-custody software with supporting relays and application services; it should not be described as trust-free, as a bank, or as a guarantee that every off-chain view is immediately current.

## Related

- [Applications](README.md)
- [SilentPass VPN](silentpass-vpn.md) — privacy access on the same L0 substrate
- [DePIN Chat](depin-chat.md) — wallet messaging and terminal authorization
- [Institutional multisig AA](institutional-multisig-aa.md) — V2 team Smart Wallet capability
- [Zero-trust mailbox routing](../l0/mailbox-routing.md)
- [UDP forward](../l0/udp-forward.md)
- [Assets on L1](../l1/assets.md)
- [Resources](../resources.md)
