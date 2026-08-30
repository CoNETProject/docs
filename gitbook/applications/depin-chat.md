# CoNET Chat

**Wallet-addressed, zero-trust communication infrastructure built on CoNET L0.**

**Maturity:** Integrated capability. Beamio Consumer, Merchant OS, and POS already use this infrastructure. It is not a finished public messenger with groups, channels, or calls.

> **Protect the relationship, not only the message.**

Encryption can protect what people say.

But communication privacy is larger than message content.

Who you communicate with, how frequently you communicate, how relationships form, and how those relationships persist over time can reveal a social graph that is more sensitive than any individual message.

**CoNET Chat is designed around a stronger privacy principle: the relationship itself should be protected.**

Instead of placing users, contacts, conversations, and readable history inside one centralized messaging database, CoNET Chat uses wallet identities, zero-trust P2P communication, encrypted decentralized storage, and user-controlled cryptographic recovery.

The goal is not simply to encrypt chat.

**The goal is to prevent the user's social relationships from becoming the property of a messaging platform.**

---

## The social graph is the most sensitive layer

A message tells someone what you said.

A social graph can reveal **who matters to you**.

Over time, communication relationships can expose families, friends, business partners, customers, communities, organizations, financial relationships, and patterns of coordination.

This makes communication metadata fundamentally different from ordinary application data.

A centralized messaging provider may encrypt message content while still maintaining a powerful relationship graph:

- **Who talks to whom**
- **How often**
- **For how long**
- **Which relationships form clusters**
- **Which identities connect otherwise separate communities**

Protecting message plaintext alone does not eliminate this concentration of knowledge.

CoNET Chat therefore treats the user's social relationships as a primary privacy boundary.

> **Messages are private. Relationships should be private too.**

---

## From encrypted messages to private relationships

Traditional messaging architecture tends to concentrate several kinds of information in the same operator:

```text
Identity
   ↓
Contact graph
   ↓
Message routing
   ↓
Conversation metadata
   ↓
History
   ↓
Platform database
```

Even when message bodies are end-to-end encrypted, the platform may still occupy a privileged position from which communication relationships can be reconstructed.

CoNET Chat takes a different architectural direction:

```text
Wallet identity
   ↓
Zero-trust CoNET L0 / Layer Minus
   ↓
Encrypted communication
   ↓
Fragmented encrypted history
   ↓
Wallet-controlled recovery
```

The infrastructure is designed to perform its transport and storage functions without requiring one centralized service to own the complete communication relationship.

This is the central privacy objective of CoNET Chat:

### No single messaging platform should own your social graph.

---

## Your wallet is your communication identity

CoNET Chat does not begin with a platform-owned username, phone-number directory, email account, or centralized social account.

It begins with the wallet.

**Wallet → Wallet**

The wallet address becomes the communication identity.

This changes an important relationship between the user and the communication system.

| Conventional platform | CoNET Chat |
|---|---|
| The platform creates your identity and then records your relationships. | The user already owns the identity, and the communication infrastructure serves that identity. |

The social relationship no longer needs to originate inside a platform-owned account database.

---

## Zero-trust communication infrastructure

CoNET Chat is built on CoNET L0 and Layer Minus.

L0 provides decentralized network resources for forwarding and storage. Layer Minus uses those resources for wallet-addressed private communication.

A communication path can separate infrastructure roles:

```text
Sender Wallet
   ↓
Entry
   ↓
Mailbox
   ↓
Entry
   ↓
Recipient Wallet
```

Application messages are encrypted before traversing this infrastructure.

Infrastructure nodes can perform routing, forwarding, mailbox, and storage functions without needing the recipient's private key or application-message plaintext.

This is why CoNET Chat is better understood as **communication infrastructure**, rather than another messaging service.

---

## Decentralized history without a centralized social database

Conversation history creates another major privacy problem.

If one provider stores every user's complete history, that provider does not merely hold messages.

It holds a long-term record of relationships.

CoNET Chat separates encrypted history from the centralized messaging-platform model.

Conversation records can be encrypted and fragmented across decentralized storage infrastructure.

The recovery path conceptually becomes:

```text
Encrypted fragments
   *
Encrypted index
   *
Wallet-controlled cryptographic authority
   ↓
Recovered history
```

The decentralized cloud stores ciphertext.

The user's cryptographic authority controls recovery.

This means historical communication does not need to exist as a readable centralized database controlled by the messaging provider.

And that matters because protecting history is also about protecting the relationships encoded inside that history.

---

## The private key restores more than messages

When a user restores CoNET Chat history, the system is not merely reconstructing text.

It is reconstructing the user's own communication context.

The cryptographic authority associated with the wallet is required to recover encrypted historical state.

Without that authority, decentralized storage providers should see encrypted material rather than a readable conversation archive.

This creates a fundamentally different ownership model:

- **Infrastructure stores encrypted fragments.**
- **The wallet controls reconstruction.**
- **The user retains authority over communication history.**

The objective is to make social relationships cryptographically recoverable by the user without making them centrally readable by the infrastructure provider.

---

## CoNET Chat is infrastructure, not a social silo

CoNET Chat is not intended to become another platform that owns users, contacts, and communities.

It is intended to provide the private communication layer beneath applications.

The same infrastructure can support:

- **Wallet ↔ Wallet**
- **Customer ↔ Merchant**
- **Merchant ↔ POS**
- **User ↔ AI Agent**
- **Application ↔ Application**
- **Human ↔ Machine**

A wallet application can use it.

A commerce application can use it.

A decentralized social application can use it.

An AI agent can use it.

A third-party developer can use it through the CoNET Chat SDK.

The application may change.

The communication relationship remains controlled by wallet identities rather than by a centralized social platform.

---

## Developer-ready infrastructure

CoNET Chat is available to developers through:

`@conet.project/chat-sdk`

The SDK provides reusable infrastructure for wallet-addressed communication, cryptographic operations, mailbox interaction, encrypted messages, delivery state, encrypted history, and recovery.

This allows developers to add private communication without first building a centralized user-and-relationship database as the foundation of their application.

The architectural goal is simple:

**Give applications communication infrastructure without giving a platform ownership of the user's social graph.**

Wire-level how-to: [CoNET Chat developer guide](../l0/chat-developer-guide.md) and [L0 development](../developers/l0.md).

---

## Already integrated into Beamio

CoNET Chat infrastructure is already used across Beamio product environments.

| Surface | Role |
|---|---|
| **Beamio Consumer** | Wallet-to-wallet communication, presence, delivery state, offline messages, and encrypted-history recovery |
| **Beamio Merchant OS** | Merchant communication, encrypted delivery, message listening, and application-level authorization workflows |
| **Beamio POS** | Wallet communication and typed authorization messages between POS terminals and merchant systems |

This also demonstrates that CoNET Chat is broader than human text messaging.

The same private communication infrastructure can carry machine-readable application messages.

---

## Privacy boundary

CoNET Chat should not claim that communication metadata disappears completely.

Zero trust does not mean zero metadata.

Individual infrastructure participants may still observe limited information required to perform their role, such as connections, timing, traffic volume, encrypted-message arrival, or routing state.

Endpoint compromise can also expose information available to that endpoint.

The architectural objective is therefore more precise:

**Avoid concentrating identity, relationship, routing, message content, and readable history inside one trusted messaging provider.**

Role separation, encrypted payloads, decentralized infrastructure, fragmented encrypted history, and wallet-controlled recovery reduce the amount of relationship information that any single infrastructure participant needs to possess.

---

## Protect what people say. Protect who people know.

For decades, online communication has treated the social graph as an asset belonging to the platform.

CoNET Chat takes the opposite position.

- **Your identity belongs to your wallet.**
- **Your messages belong to you.**
- **Your history belongs to you.**
- **Your relationships belong to you.**

CoNET Chat is designed to make the social relationship itself one of the most protected forms of private information in the communication stack.

**Wallet-addressed. Zero-trust. Relationship-private.**

Built on CoNET L0.

---

## Protocol dependencies

The relationship-privacy objective is implemented on existing L0 contracts. Those contracts do not disappear because the product thesis is stronger.

| Dependency | Chat use |
|---|---|
| **AddressPGP on CoNET L1** | Registers user PGP, route PGP, and mailbox binding |
| **Layer Minus `/post`** | Carries encrypted application envelopes and listen commands |
| **A/B/C mailbox routing** | Sender uses entry **A**; recipient listens through entry **C**; mailbox **B** is never the client HTTP target |
| **EIP-191 sender signature** | Authenticates the outer envelope |
| **Recipient user PGP** | Encrypts application plaintext |
| **Mailbox route PGP** | Encrypts listen, mailbox ACK, and presence query |
| **ChatIndexRegistry + IPFS fragments** | Encrypted recoverable history; the chain stores only a pointer |

Chat is therefore an application of L0, not a separate messaging network.

---

## Delivery path

```text
Sender wallet
    → encrypt to recipient user PGP
    → POST { "data" } through healthy entry A
    → mailbox B stores ciphertext
Recipient wallet
    → encrypt listen to B route PGP
    → SSE through healthy entry C
    → decrypt locally
    → mailbox ACK to B
    → optional sender receipt to sender user PGP
```

Normative routing: [Zero-trust mailbox routing](../l0/mailbox-routing.md).

Chat clients must send `listenKind: "chat"` on mailbox listen. Mining collectors omit that field. The two streams share SI `command: "mining"` but must not share eviction policy.

---

## Delivery receipts and offline storage

Mailbox first stores ciphertext, then attempts live SSE.

A recipient that accepts a message should emit two receipts:

1. **Mailbox ACK** — encrypted to **B route PGP**, so B can delete offline ciphertext.
2. **Sender receipt** — encrypted to the **sender user PGP**, so the sender UI can mark `delivered`.

Sender receipts use mailbox-work wrap `{ data, NoPush: true }` so they do not generate extra push notifications. HTTP `/post` still carries only `{ "data" }`.

## Native push badge and `NoPush`

`NoPush` is a **mailbox-work** instruction inside ciphertext encrypted to **B route PGP**. It is not an HTTP JSON field.

| Traffic | Mailbox work `NoPush` | Native badge |
|---|---|---|
| Ordinary Chat / Merchant Messages / POS one-to-one Chat | **Omit** | Offline recipient may receive a native badge after `saveLocal` |
| Sender `beamio_chat_delivery_receipt_v1` | **`true`** | Must not generate an extra push |
| POS terminal-authorization envelope | Product-defined; Merchant OS still puts it on Staff pending, not Messages | Do not treat it as a Messages bubble |

HTTP `/post` remains `{ "data": "<armor>" }` only. Clients that need `NoPush` wrap the inner user-PGP armor as `{ data: innerArmor, NoPush: true }`, encrypt that object to mailbox **B route PGP**, and POST the outer armor.

L0 duplex mailbox work must omit Chat/APNs `NoPush`. See [Persistent application streams](../l0/duplex-forward.md).

---

## Presence

Online state is **mailbox listen-pool state**, not an on-chain `routeOnline` flag.

A contact query uses `wallet_online_query`, encrypted to that contact’s mailbox route PGP and submitted through an entry that is not B. Failed queries must not overwrite a previously trusted online/offline value.

---

## History recovery

Local UI chat lists are device state. Cross-device recovery uses:

1. RPC `getPointer(eoa)` on ChatIndexRegistry (`0x1511Caa71081C84d8a591490D1b83879088EED72`);
2. encrypted index and fragments from IPFS;
3. keys derived from the wallet’s cryptographic authority.

A restore that finds no local conversations must still create missing sessions from recovered history. An empty local list is not proof that the user never communicated.

That is how history recovery reconstructs **communication context**, not only message text.

---

## What exists today

- Wallet-to-wallet encrypted messages in Beamio Consumer
- Merchant listening and POS authorization envelopes
- Dual receipts, mailbox ACK, and best-effort offline flush
- Encrypted-history append and recover on the Consumer path
- Published SDK: `@conet.project/chat-sdk`

## What remains under development

- Broader client coverage beyond the current Beamio surfaces
- Stronger metadata resistance than current entry/mailbox observation
- Groups, channels, and calls — not claimed here

---

## Trust boundary

| Participant | Can see | Must not see |
|---|---|---|
| Entry A / C | Encrypted payload, timing, size, connection | Application plaintext, recipient private key |
| Mailbox B | Ciphertext, listen-pool membership, ACK hashes | Application plaintext, user PGP private key |
| IPFS / fragment store | Encrypted fragments and encrypted index | Readable history without wallet authority |
| Beamio API | Gas-sponsored writes such as ChatIndexRegistry pointer updates | Private keys, plaintext history |
| Recipient wallet | Decrypted application objects after local verification | Other users’ private keys |

Zero trust does not mean zero metadata. The design goal is to avoid putting identity, relationship, routing, content, and readable history in one trusted messaging provider.

---

## Related

- [CoNET Chat developer guide](../l0/chat-developer-guide.md)
- [L0 development](../developers/l0.md)
- [How to use Layer Minus](../l0/using-l0.md)
- [Zero-trust mailbox routing](../l0/mailbox-routing.md)
- [Security limits](../l0/security-limits.md)
- [Beamio](beamio.md)
- [Decentralized SNS](../use-cases/decentralized-sns.md)
- [Wallet-addressed applications](web3-url.md)
