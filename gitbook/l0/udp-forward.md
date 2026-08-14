# UDP frame forwarding

UDP forwarding is one **application composition** of Layer Minus: it relays **UDP-shaped application frames** between two wallets. L0 itself only forwards OpenPGP (and, here, AES) ciphertext by wallet / key ID — see [How to use Layer Minus](using-l0.md). It is not a raw operating-system UDP socket to mailbox B and does not change the [TCP/IP underlay](tcp-ip.md).

Public site: [https://gitbook.conet.network/l0/udp-forward.html](https://gitbook.conet.network/l0/udp-forward.html)

The CoNET-SI runtime and diagnostic harness implement the protocol described here. Client integration remains application-specific; this is not a promise that arbitrary UDP software works without an adapter.

## What it is

The client and UDP server use **AES-256-GCM** for frame content. OpenPGP is used only to deliver the symmetric-key subscription and to protect commands addressed to mailbox B.

| Actor | Responsibility |
| --- | --- |
| **Client wallet** | Creates the AES key and `sessionId`; opens a receive listen; encrypts uplink frames |
| **UDP server wallet** | Has an AddressPGP user key and route; decrypts the subscription; encrypts downlink frames |
| **Mailbox B** | Hosts UDP session state and relays AES ciphertext; must not learn the AES key |
| **Entries A/C/D** | Accept client and server requests and forward them to B |

Each client or server request uses a healthy entry different from B. SI-to-SI forwarding remains HTTP on port 80. The selected entry sees its direct client's IP; B sees the forwarding entry rather than a direct client connection.

## Encryption and route matrix

| Operation | Contains symmetric key? | Encrypt to | Transport target |
| --- | --- | --- | --- |
| `udp_subscribe` | **Yes** | UDP server **user PGP** | Entry A, then ordinary business routing to B |
| Client `udp_listen` | No | **B route PGP** | Entry C, long-lived SSE through B |
| Server `udp_server_listen` | No | **B route PGP** | An entry different from B, long-lived SSE |
| `udp_relay` server → client | No; AES payload only | **B route PGP** | Entry D |
| `udp_uplink` client → server | No; AES payload only | **B route PGP** | Entry D |
| `udp_unlisten` | No | **B route PGP** | An entry different from B |

The key rule is strict: `udp_subscribe` is a **user-PGP business message**, not a route command. If B can decrypt it, the client used the wrong key. SI rejects that case with `encrypt_to_udp_server_user_pgp`.

## How it works

1. The UDP server registers through the same AddressPGP flow used by Chat.
2. The client creates a random 32-byte AES key and a session ID.
3. The client signs and encrypts `udp_subscribe` to the server's user PGP, then posts it through entry A.
4. The server receives and decrypts that subscription through its normal user-PGP Chat delivery path.
5. The client opens `udp_listen`, encrypted to B's route key, through entry C.
6. B verifies `isMyRoute(udpServerWallet)`, creates the session, and sends `udp_listen_attached` to the server.
7. The server sends AES ciphertext with `udp_relay`; B writes a downlink frame to the client SSE.
8. The client sends AES ciphertext with `udp_uplink`; B writes an uplink frame to a dedicated UDP-server SSE or, if available, the server's Chat listen.
9. `udp_unlisten` closes the client session and emits `udp_listen_detached`.

The subscription itself arrives on the server's **Chat** listen because it is user-PGP business ciphertext. The UDP frame sessions use separate UDP pools.

## Canonical command fields

Commands are JSON strings inside the signed Layer Minus envelope:

```text
signMessage = personal_sign(message)
literal = base64(UTF8(JSON.stringify({ message, signMessage })))
armored = OpenPGP_encrypt(literal, selected public key)
```

`udp_subscribe`:

```json
{
  "command": "udp_subscribe",
  "walletAddress": "<client EOA>",
  "udpServerWallet": "<server EOA>",
  "sessionId": "<session identifier>",
  "algorithm": "aes-256-gcm",
  "Securitykey": "<base64 32-byte key>",
  "timestamp": 1710000000
}
```

Client listen:

```json
{
  "command": "udp_listen",
  "listenKind": "udp",
  "walletAddress": "<client EOA>",
  "udpServerWallet": "<server EOA>",
  "sessionId": "<session identifier>",
  "timestamp": 1710000000
}
```

The equivalent `command: "mining"` with `listenKind: "udp"` is also accepted. A server can use `udp_server_listen` or `command: "mining"` with `listenKind: "udp_server"`.

Relay and uplink commands contain `walletAddress`, `sessionId`, `payload`, and `timestamp`. They must never contain `Securitykey`.

## Frame format and runtime bounds

| Item | Current rule |
| --- | --- |
| AES key | 32 bytes; standard base64 in the user-PGP subscription |
| Payload | `base64(nonce[12] \|\| ciphertext \|\| tag[16])` |
| Maximum encoded payload | 12,000 characters |
| Accepted timestamp skew | 600 seconds |
| Session limits | 16 per client, 64 per server, 256 globally |
| Idle timeout | 10 minutes |
| Scheduling | Non-overlapping `setTimeout` sweep |
| Pool isolation | UDP client/server pools remain separate from chat/mining liveness |

A receive-only SSE socket can remain writable after its request body has ended. SI therefore does not classify `readableEnded` alone as stale.

## Guarantees and non-guarantees

If `udp_subscribe` is encrypted to the server's user key and route commands omit the key, mailbox B can relay frames without learning their plaintext or AES key. Wallet signatures bind commands to their declared actors, and B validates route and session ownership before forwarding.

The protocol does not provide raw UDP semantics, automatic retransmission, application-level ordering for both directions, congestion control, or proof that the destination application consumed a frame. SI's `delivered: true` means a frame was written to an active SSE path; it is not an application acknowledgement.

Mailbox B still sees `sessionId`, client and server wallets, frame timing and size, direction, and session duration. That is enough to classify some realtime or sensor-like use even when AES payloads stay sealed.

It also does not hide a client's IP from its entry, defeat a global timing observer, or implement padding buckets, constant-rate mode, a replay window beyond the 600-second timestamp skew, application ACKs, or automatic rekey. Those are listed as upgrades in [security limits](security-limits.md).

## Implementation anchors

- Session and authorization logic: `src/CoNET-SI/src/util/udpForward.ts`
- AES-256-GCM framing: `src/CoNET-SI/src/util/udpForwardCrypto.ts`
- SI command dispatch: `src/CoNET-SI/src/util/localNodeCommand.ts`
- Entry-routed diagnostic: `npx tsx scripts/testConetDepinUdp.ts`

## Next

- [How to use Layer Minus](using-l0.md) places UDP among the other L0 combinations.
- [Security limits](security-limits.md) grades UDP metadata and missing native-UDP properties.
- [Zero-trust mailbox routing](mailbox-routing.md) defines the shared A/B/C path.
- [Wallet-addressed peer identity](wallet-address-p2p.md) defines user and route keys.
- [Node and client roles](node-roles.md) defines pool and plaintext boundaries.
