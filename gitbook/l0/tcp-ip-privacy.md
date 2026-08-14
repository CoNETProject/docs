# The IP-address privacy problem

This page defines the threat model that motivates Layer Minus. It does not introduce another transport protocol.

Public site: [https://gitbook.conet.network/l0/tcp-ip-privacy.html](https://gitbook.conet.network/l0/tcp-ip-privacy.html)

## What an observer can learn

Encryption protects content only within its cryptographic boundary. A network path still needs enough metadata to deliver packets, so different observers retain different views:

| Observer | Can normally observe | Cannot infer from that alone |
| --- | --- | --- |
| Access network or ISP | Client IP, remote IP, timing, sizes, duration, protocol, and often DNS or TLS metadata | OpenPGP business plaintext |
| Entry A or C | Direct client IP, request timing and size, and routing material required to forward | User-PGP business plaintext or B-route command plaintext |
| Mailbox B | Connection from A/C, destination route, stored armor, and commands encrypted to B | Business content encrypted to the user's PGP key |
| Application recipient | Decrypted message and authenticated sender fields | The sender's direct IP when the sender used the intended entry route |
| Origin reached by a proxy exit | Exit IP and application request | Client IP, unless another identifier or correlation reveals it |

IP geolocation is approximate. An address may identify an organization, carrier, household connection, NAT pool, or transient device lease; it is not automatically a unique person. Network operators may nevertheless correlate it with subscriber or device records.

## Threats in scope

A local or intermediate observer may:

- filter or throttle a destination IP, domain, or TLS name;
- classify traffic using ports, handshake fields, timing, size, and cadence;
- correlate repeated source/destination pairs;
- infer approximate network or geographic location; or
- combine network metadata with account and device identifiers held by an application.

An entry sees the client because the client must connect somewhere. The objective is not to make that fact disappear; it is to prevent the **mailbox and recipient path** from requiring a direct client connection and to keep business content end-to-end encrypted.

## How Layer Minus reduces exposure

Layer Minus applies four boundaries:

1. **Wallet identity** — applications address an EOA and its AddressPGP keys instead of publishing a stable IP as the peer name.
2. **Entry/mailbox separation** — send and listen connections terminate at A or C, while B receives a forwarded connection.
3. **End-to-end business encryption** — entries and B relay user-PGP ciphertext.
4. **HTTP-shaped transport of ciphertext** — `/post` carries OpenPGP armor. HTTP is enough for payload secrecy. HTTPS is optional. In a network that classifies TLS, the intended client path is **plain HTTP** so that SNI and JA3/JA4 are not created.

[Fetch-and-Close](http-mimicry.md) can further limit how long one product-specific proxy connection remains stable. It is a short-session mode, not a general anonymity or censorship-resistance proof. Chat and UDP listens still use long-lived SSE. Collusion, replay, and forward-secrecy limits are graded in [security limits](security-limits.md).

## Guarantees and non-guarantees

Under the intended `A ≠ B` and `C ≠ B` routes, mailbox B does not receive the client's direct TCP connection. A recipient of a user-PGP business message receives the plaintext without requiring the sender's IP as the application identity.

The model does **not** protect against:

- a global observer that can correlate both sides of the route;
- collusion between relevant entries, mailboxes, or destinations;
- endpoint malware or stolen EOA/OpenPGP keys;
- traffic analysis based on timing and ciphertext size;
- blocking of known CoNET hosts, addresses, or certificates;
- application identifiers embedded in plaintext after decryption; or
- denial of service and unavailable routes.

HTTP/HTTPS compatibility does not make all flows statistically identical to web browsing. Entry acceptance, TLS success, and SSE handshakes also do not prove application delivery.

## Operational consequences

- Do not publish a mailbox or validator IP as a user's identity.
- Do not connect directly to B for normal send, listen, presence, acknowledgement, or UDP relay traffic.
- Do not weaken OpenPGP encryption because an entry hop uses HTTP. Payload secrecy does not come from TLS.
- Prefer HTTP `/post` when a TLS handshake would be the more dangerous classifier; do not treat missing HTTPS as a protocol defect.
- Do not treat on-chain `routeOnline` as current presence; query B's live listen pool through C.
- Treat the OpenPGP recipient key ID as **required routing metadata**, not as accidental leakage of message text.
- Size padding and timing jitter are not implemented in the current SI protocol.

## Implementation anchors

- [Wallet-addressed peer identity](wallet-address-p2p.md)
- [Zero-trust mailbox routing](mailbox-routing.md)
- [HTTP transport and Fetch-and-Close](http-mimicry.md)
- [Security limits and threat grades](security-limits.md)
- [UDP frame forwarding](udp-forward.md)
- Product-specific proxy behavior: [SilentPass](../applications/silentpass-vpn.md)

## Next

Read [How to use Layer Minus](using-l0.md) for the forwarding primitives, [Wallet-addressed peer identity](wallet-address-p2p.md) for key registration, then [Zero-trust mailbox routing](mailbox-routing.md) for the delivery path.
