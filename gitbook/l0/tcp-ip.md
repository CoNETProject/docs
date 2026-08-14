# The TCP/IP substrate

Layer Minus uses the public Internet; it is not a second IP network. This page is a prerequisite for the L0 protocol and defines the underlay that Layer Minus assumes.

Public site: [https://gitbook.conet.network/l0/tcp-ip.html](https://gitbook.conet.network/l0/tcp-ip.html)

## What TCP/IP provides

| Protocol | Function | Relevant property |
| --- | --- | --- |
| **IP** | Routes packets between source and destination addresses | Best effort; does not guarantee delivery, order, or privacy |
| **TCP** | Provides an ordered, reliable byte stream between two IP endpoints | Retransmits within one connection; exposes endpoint and flow metadata |
| **UDP** | Sends independent datagrams between two IP endpoints | No built-in delivery, order, or retransmission guarantee |
| **TLS** | Encrypts an application channel above TCP | Protects channel content, not the IP header or all traffic metadata |
| **HTTP and SSE** | Define request/response and server-push application semantics | Run over the transport; do not create message-level delivery guarantees |

IPv4 uses 32-bit addresses. IPv6, currently specified by [RFC 8200](https://datatracker.ietf.org/doc/html/rfc8200), uses 128-bit addresses. Both are operational locators allocated through network operators; neither is a self-issued cryptographic identity.

The relevant TCP specification is [RFC 9293](https://datatracker.ietf.org/doc/html/rfc9293). UDP is specified by [RFC 768](https://datatracker.ietf.org/doc/html/rfc768).

## What remains observable

Routers need clear source and destination information to forward packets:

```text
host A ── source/destination IP ──▶ access network ──▶ backbone ──▶ host B
```

TLS can make application bytes opaque between its endpoints, but Layer Minus does **not** rely on TLS for `/post` payload secrecy. The body is OpenPGP armor before it is placed on HTTP. TLS, when used, still does not erase:

- source and destination IP addresses;
- connection timing and duration;
- packet sizes and direction;
- transport protocol and ports; or
- all name and handshake metadata.

An IP may be shared through NAT, reassigned, mobile, or mapped to subscriber records by a network operator. It should therefore be treated as a locator with contextual metadata, not as definitive proof of a person.

## How Layer Minus uses the substrate

Layer Minus changes application identity and routing policy while retaining TCP/IP for every hop:

| Link | Underlay | Layer Minus object |
| --- | --- | --- |
| Client → entry `/post` | **HTTP or HTTPS** over TCP. HTTP is enough because the body is already OpenPGP ciphertext. | Signed OpenPGP envelope or mailbox command |
| Client → entry listen | HTTP/SSE over TCP | Route-key-encrypted listen command |
| Entry A/C → mailbox B | **HTTP on port 80** | Opaque forwarded armor or proxied SSE |
| UDP frame forwarding | HTTP requests and SSE, not a raw IP/UDP path to B | AES-256-GCM payload identified by wallet and `sessionId` |
| Supported proxy exit → origin | Origin TCP connection | Product-specific bounded proxy request |

The wallet and its registered OpenPGP material are the application identity. IP endpoints exist only for the current transport hop.

## Guarantees and non-guarantees

TCP can make one hop reliable and ordered. TLS can protect one client-facing channel. Neither proves that:

- entry A forwarded the object to mailbox B;
- B persisted it;
- recipient R decrypted it; or
- an application accepted and displayed it.

Those milestones require Layer Minus routing, mailbox persistence, acknowledgements, and application receipts.

Layer Minus does not replace IANA or ISP addressing, remove IP metadata from the wire, or require clients to open raw TCP or UDP sockets directly to mailbox B. Its privacy property comes from indirection and encryption above the underlay.

## Implementation anchors

- SI HTTP/HTTPS listener: `src/CoNET-SI/src/endpoint/server.ts`
- SI HTTP port-80 forwarding: `src/CoNET-SI/src/util/localNodeCommand.ts`
- Mailbox SSE lifecycle: `src/CoNET-SI/src/util/util.ts`
- UDP-over-Layer-Minus sessions: `src/CoNET-SI/src/util/udpForward.ts`

## Next

[The IP-address privacy problem](tcp-ip-privacy.md) turns these observable properties into the L0 threat model. [Wallet-addressed peer identity](wallet-address-p2p.md) explains what Layer Minus uses instead of IP as a durable peer name.
