# Applications

CoNET applications combine protocol capabilities into user-facing behavior.
They are not additional network layers.

- **Layer Minus (L0)** supplies encrypted, wallet-addressed forwarding.
- **CoNET L1** supplies public identity, contracts, accounts, and assets.
- **Applications** define their own schemas, authorization, storage, and user
  experience.

## Maturity labels

| Label | Meaning |
|---|---|
| **Public application** | A user-facing build or endpoint is publicly available |
| **Integrated capability** | Implemented inside another public application |
| **Under development** | Documented and partially implemented, without a complete production release |

Maturity is not an audit, uptime, or anonymity guarantee.

## Choose an application

| Application | Product role | Maturity | Start here |
|---|---|---|---|
| **`web3://` wallet-addressed applications** | Cross-platform application protocol using L0 infrastructure | Under development | [`web3://`](web3-url.md) |
| **SilentPass** | Wallet-authorized privacy access to ordinary Internet services | Public application | [SilentPass](silentpass-vpn.md) |
| **Beamio** | Consumer wallet, Merchant OS, POS, Cash and USDC | Public application | [Beamio](beamio.md) |
| **DePIN Chat** | Wallet-addressed messages, delivery receipts, presence, and encrypted history | Integrated capability | [DePIN Chat](depin-chat.md) |
| **Institutional multisig AA** | Team-controlled Smart Wallet with on-chain tasks and threshold votes | Integrated capability | [Institutional multisig AA](institutional-multisig-aa.md) |
| **Miner-matched order-book exchange** | Proposed non-custodial ERC-20 order book | Under development | [Miner-matched exchange](miner-orderbook-dex.md) |
| **DePIN DCDN / BT** | Planned encrypted bulk-content distribution | Under development | [DePIN DCDN / BT](bt-dcdn.md) |

The [`web3://` application page](web3-url.md) is the canonical cross-platform
entry. `conet-l0d` is documented under Developers as its Linux runtime, not as
a second application or protocol.

## Protocol dependencies

| Dependency | Application use |
|---|---|
| **L0 / Layer Minus** | OpenPGP key-ID routing, entry forwarding, mailbox receive, and encrypted sessions |
| **L1 / CoNET** | AddressPGP, account and asset state, application registries, and history pointers |
| **L2 / CoNET-DLE** | Prospective multi-party and high-frequency accounting designs; not a production dependency today |
| **Application services** | Relaying, indexing, metadata, local encrypted storage, and UI coordination where these are not protocol functions |

An application can depend on several layers without becoming a new layer.

## Product boundaries

- Chat, SilentPass, mining, UDP, and `web3://` are application compositions
  over the same L0 forwarding plane.
- SilentPass is privacy egress to an ordinary Internet destination. It is not
  a `web3://` application host and not an L1 consensus path.
- `web3://` names an application by wallet identity and returns an
  encrypted, request-correlated application response or a persistent stream.
- CoNET-DLE specifications and its lab explorer do not imply a launched
  production L2.

## Trust boundary

- Wallet addressing is pseudonymous, not automatically anonymous.
- Intermediate encryption does not remove endpoint trust.
- Availability is separate from confidentiality.
- Entry, mailbox, RPC, relayer, and application failures must not be converted
  into successful empty data.
- Product maturity does not imply independent security certification.

## Related

- [How to use Layer Minus](../l0/using-l0.md)
- [`web3://` Application Protocol contract](../l0/web3-application-protocol.md)
- [Developers](../developers/README.md)
- [Resources](../resources.md)
