# How to use Layer Minus

Layer Minus is CoNET's encrypted, wallet-addressed privacy routing protocol
over L0 cloud resources. An application selects a recipient, encrypts a
versioned payload, submits it through an entry, and receives through the
recipient's mailbox route.

For the infrastructure boundary, read [L0](README.md). For the protocol model,
read [Layer Minus](layer-minus.md).

Start with the application contract. Do not invent a new SI command or
plaintext HTTP field when an existing application envelope can compose the
required behavior.

[CoNET Chat](../applications/depin-chat.md) uses this plane to protect
**relationships as well as message content**: wallet identity, entry/mailbox
role separation, encrypted payloads, and wallet-controlled history recovery.
Do not start a Chat integration by creating a centralized contact-graph
database as the application’s source of truth.

## 1. Choose an application profile

| Need | Application profile | Guide |
|---|---|---|
| Offline-capable messages | Chat envelope + mailbox delivery | [CoNET Chat developer guide](chat-developer-guide.md) |
| Presence and delivery receipt | Mailbox query and acknowledgement | [CoNET Chat developer guide](chat-developer-guide.md) |
| UDP frames | End-to-end AES frames over mailbox relay | [UDP forwarding](udp-forward.md) |
| Wallet-addressed Web/API request | `web3://` caller-signed request + correlated encrypted response | [`web3://` Application Protocol](web3-application-protocol.md) |
| Persistent application stream | `web3://` bidirectional session | [`web3://` Application Protocol](web3-application-protocol.md) |

The [`web3://` application page](../applications/web3-url.md) defines the
cross-platform choices. Linux runtime operation is documented separately in
[Developers — `conet-l0d`](../developers/conet-l0d.md).

## 2. Register identity

An application participant normally has:

- an EOA that signs commands and application requests;
- a user OpenPGP key used for end-to-end business encryption; and
- a mailbox route selected through AddressPGP.

Use the existing route-registration flow. A successful registration request is
queue admission; read AddressPGP through CoNET L1 RPC before treating the route
as visible.

```bash
curl -s https://rpc1.conet.network \
  -H 'content-type: application/json' \
  --data '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"eth_chainId",
    "params":[]
  }'
```

Expected CoNET L1 chain ID: `0x36ca6` (224422).

## 3. Preserve the HTTP contract

Client-to-entry delivery uses:

```http
POST /post HTTP/1.1
Content-Type: application/json

{"data":"<OpenPGP armored message>"}
```

Only `data` belongs in the HTTP JSON. Application fields, mailbox work, and
delivery policy stay inside the encrypted object. Do not add plaintext
side-channel fields.

Node-to-node forwarding uses the existing SI transport. Applications do not
select an arbitrary mailbox IP as their direct endpoint.

## 4. Apply the A/B/C route model

| Role | Purpose |
|---|---|
| **A** | Healthy entry used to submit recipient-encrypted business data |
| **B** | Recipient mailbox selected by its route key |
| **C** | Healthy entry used to forward a receive/listen command to B |

Rules:

1. Encrypt business data to the recipient **user PGP**.
2. Submit it through healthy entry **A**, where A differs from B.
3. Encrypt receive/listen commands to mailbox **B route PGP**.
4. Submit those commands through healthy entry **C**, where C differs from B.
5. Treat entry `2xx` as transport progress, not delivery or application
   success.

Direct mailbox access is not a conforming client optimization.

## 5. Sign versioned application data

Applications should use explicit versioned types and EIP-191 signatures over
well-defined bytes:

```text
application object
  → canonical JSON/text
  → EIP-191 signature by sender EOA
  → signed envelope
  → base64 UTF-8
  → OpenPGP encryption to recipient user PGP
  → POST {"data":"..."} through entry A
```

The recipient:

1. decrypts with the user PGP private key;
2. decodes the signed envelope;
3. verifies the EIP-191 signer;
4. validates version, target, expiry, nonce, and limits;
5. applies application authorization; and
6. returns the profile-defined correlated response or signed receipt when the
   application requires one.

## 6. Use exact wallet resolution

When a URI or UI contains a BeamioTag:

- require an exact account-name match;
- use an address hint to resolve case-insensitive collisions;
- fail if ambiguity remains; and
- never choose `results[0]` from a prefix search.

Business payloads target the recipient EOA with a registered user PGP key.
Do not silently substitute an AA address or another similar tag.

## 7. Implement `web3://`

For wallet-addressed applications, follow:

- [Applications — `web3://`](../applications/web3-url.md) for product and
  platform behavior;
- [`web3://` Application Protocol](web3-application-protocol.md) for the URI,
  request, response, persistent-stream, and security contract; and
- [Developers — `conet-l0d`](../developers/conet-l0d.md) for the Linux
  runtime.

Typical platform composition:

```text
web3:// client implementation
            ⇅
    Layer Minus entries
            ⇅
      recipient mailbox
            ⇅
     web3:// host adapter
            ⇅
   local Web/API/TCP origin
```

The application protocol remains the same regardless of runtime. A Linux
client or host adapter can use `conet-l0d`; browser and native clients
implement the same contract directly.

## 8. Verify by evidence

Do not collapse all stages into “connected.”

| Stage | Evidence |
|---|---|
| Identity | Exact target EOA and user/route PGP records |
| Entry | Encrypted request accepted by a configured healthy entry |
| Mailbox | Correct route accepted through an independent entry |
| Session | Expected request, receipt, or persistent-stream session ID |
| Data | Profile-validated response, signed receipt, or continuing bidirectional frames |
| Application | The origin protocol or UI completed the intended operation |

An HTTP `200`, SSE handshake, or running daemon is not an end-to-end result.

## 9. Failure semantics

- Timeout, non-`2xx`, invalid signature, route mismatch, and parse failure are
  unsuccessful attempts.
- Failure must not become a successful empty response.
- A client with trusted cached data keeps that data when a refresh is
  untrusted.
- Offline Chat data remains encrypted and is removed only after a valid
  acknowledgement.
- Reconnect policies must be bounded and must not overlap unbounded work.

## 10. Security limits

- Keep private EOA and PGP material client-side.
- Never log private keys, plaintext business bodies, symmetric keys, or full
  ciphertexts.
- Restrict host adapters to explicit local/private origins.
- Bound payload size, frame size, queue length, execution time, and session
  count.
- Treat entry and mailbox nodes as untrusted transport participants.
- Do not invent a new public domain for an application transport.

## 11. Related

- [L0 architecture](README.md)
- [Zero-trust mailbox routing](mailbox-routing.md)
- [HTTP transport](http-mimicry.md)
- [Peel, hop-sig, and listen timeouts](peel-hop-listen.md)
- [Security limits](security-limits.md)
- [L0 development](../developers/l0.md)
