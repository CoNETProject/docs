# CoNET Web3 URL Gateway

**Maturity: Under development.** The Web3 URL Gateway is a cross-browser
WebExtension client for wallet-addressed `web3://` resources. It is published
as an independent repository:

[CoNET-project/web3Url](https://github.com/CoNET-project/web3Url)

The project currently provides a shared TypeScript core and browser build
scaffold for Chrome, Edge, Firefox, and Safari Web Extensions. It is not a
production browser protocol handler or a public hosting service.

## What it does

The extension is designed to:

1. Accept a `web3://<target>/<path>` resource request.
2. Resolve an EOA or an exact BeamioTag to the target EOA.
3. Read the target's user and route PGP keys through AddressPGP.
4. Build a versioned request envelope containing method, target URL, approved
   headers, body, request ID, nonce, and expiry.
5. Sign the request with the local communication wallet.
6. Encrypt the business request to the target user PGP, then wrap it for the
   target mailbox route PGP.
7. Submit `{ "data": "<OpenPGP armor>" }` to a configured healthy Entry.
8. Decrypt and validate the response, returning
   `{ status, headers, bodyBase64, contentType }` for browser rendering.

The browser client must use the A/B/C model: submit to an Entry and never
directly connect to mailbox B.

## Local identity and storage

On first setup, the options page creates a communication EOA and PGP
identity. The identity is stored in encrypted extension storage using a
password-derived PBKDF2 key and AES-GCM. Private keys and plaintext PGP
material must remain out of logs and must not be sent to the Entry as
plaintext.

The service worker keeps the unlocked identity in memory only. Requests fail
closed when the identity is locked, when no Entry is configured, or when a
target cannot be resolved exactly.

## Current scope

Implemented in the current scaffold:

- `web3://` parsing for EOA and exact-tag targets;
- versioned request and response envelopes;
- local wallet and PGP identity creation;
- encrypted local identity vault;
- AddressPGP RPC client;
- Entry pool retry and failover abstraction;
- page-to-extension bridge;
- mock gateway round-trip tests;
- options page and service-worker request path.

The browser-specific operating-system protocol integration remains pending:

- Chrome and Edge navigation registration;
- Firefox navigation integration;
- Safari Web Extension container scheme handling;
- production Entry allowlist and final Enterprise Gateway response contract.

## Protocol status and non-goals

This project composes existing L0 primitives. It does not add a new SI
command, a new mailbox protocol, or a new hostname. It must follow the
published [L0 development guide](../developers/l0.md), including the
`POST /post` body contract, target separation, exact Tag resolution, and
fail-closed behavior.

The project does not claim:

- that every browser navigation is already intercepted;
- that HTTP 200 proves business delivery;
- that an Entry or mailbox can be trusted with business plaintext;
- that the extension is a production Enterprise Gateway;
- that the extension replaces `conet-l0d`.

## Official `conet.network` host gateway

The repository also contains a server-side host adapter for the official
website destination. A dedicated EOA + PGP identity is created on the
`conet.network` host and registered with AddressPGP. Its private EOA and PGP
files remain local to that host.

The stable locator is:

```text
web3://<official-wallet-address>/
```

The host adapter listens through the normal mailbox SSE path, validates the
signed versioned request, accepts only `GET` and `HEAD`, fetches the matching
path from `https://conet.network`, and returns an encrypted
`{ status, headers, bodyBase64, contentType }` response to the requesting
wallet. Request and response bodies are bounded to 8 MiB.

Port `80` in this deployment is the SI Entry/node transport boundary. The
adapter does not bind a second public HTTP server on port `80`, and it never
dials mailbox B directly. `conet-l0d` remains the TUN/overlay daemon; the
host adapter is a separate application process and does not change the L0
wire contract.

This official host gateway is **under development** until the dedicated
identity is registered, the Entry allowlist is approved, and an end-to-end
request is verified through a non-mailbox Entry.

## Specification synchronization

The Web3 URL Gateway repository and this GitBook page are maintained
together. Any change to the URL grammar, envelope fields, signing domain,
encryption target, route selection, Entry contract, response shape, storage
boundary, or browser lifecycle must update this Applications page and the
[Developers — L0](../developers/l0.md) page in the same change set. If the
change affects the underlying L0 wire contract, the relevant L0 protocol and
SI developer pages must also be updated before release.

## Related

- [Developers — L0](../developers/l0.md)
- [L0 development](../developers/l0.md)
- [CoNET Web3 Application Protocol](../l0/web3-application-protocol.md)
- [Zero-trust mailbox routing](../l0/mailbox-routing.md)
- [How to use Layer Minus](../l0/using-l0.md)
- [conet-l0d](./conet-l0d.md)
