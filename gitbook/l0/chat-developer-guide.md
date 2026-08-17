# Chat developer guide

**Evidence level: Implemented capability.** This page is a developer how-to for a Chat **application** on Layer Minus. The envelopes, commands, and APIs match current Beamio / chat-sdk clients. It is not a claim that Chat is a finished replacement for mainstream messengers.

Public site: [https://gitbook.conet.network/l0/chat-developer-guide.html](https://gitbook.conet.network/l0/chat-developer-guide.html)

L0 only forwards OpenPGP by wallet / key ID. Chat is an **application composition**: user-PGP business envelopes, mailbox listen, dual receipts, presence, and an optional encrypted history track. Product maturity and UX limits live on [DePIN Chat](../applications/depin-chat.md). SI primitives and reusable helpers live on the [SI developer guide](si-developer-guide.md). Developer-track index: [L0 development](../developers/l0.md).

Public packages: [CoNET-project/chat-sdk](https://github.com/CoNET-project/chat-sdk) · [`@conet.project/chat-sdk`](https://www.npmjs.com/package/@conet.project/chat-sdk). Reference clients: SilentPassUI [`cashtree`](https://github.com/CoNET-project/SilentPassUI/tree/cashtree) (consumer) and [`cashtrees`](https://github.com/CoNET-project/SilentPassUI/tree/cashtrees) (merchant).

## What a Chat client must implement

| Step | Encrypt to | Transport |
| --- | --- | --- |
| Register user PGP + mailbox | — | `POST https://beamio.app/api/regiestChatRoute`, then confirm with AddressPGP `searchKey` |
| Send a message | Recipient **EOA user PGP** | `POST /post` to healthy entries **A ≠ B** |
| Listen | Own mailbox **B route PGP** | SSE via entry **C ≠ B**, `command: "mining"` + `listenKind: "chat"` |
| After inbound ingest | (1) **B route PGP** ACK · (2) sender user PGP receipt, then mailbox-work wrap `NoPush` to sender mailbox B | ACK and receipt both via entries ≠ B; HTTP still `{ data }` only |
| Presence (green dot) | Contact mailbox **B route PGP** | `wallet_online_query` via **C ≠ B** |
| Optional recover history | — | Encrypted IPFS fragments + `ChatIndexRegistry` head pointer |

Do **not** encrypt business Chat to an AA Smart Wallet unless that AA has its own AddressPGP row. Do **not** take `search-users` `results[0]` as the gossip target (`CoNET` ≠ `CONET`).

## Identity

| Item | Rule |
| --- | --- |
| Protocol identity | **EOA** + user OpenPGP + mailbox route |
| User PGP `keyID` | Encryption **subkey**: `getKeyIDs()[1]`, uppercase hex |
| Mailbox | A Guardian node. Current register API field `routeKeyID` is that node’s **domain** |
| `@BeamioTag` | Discovery aid only. Resolve with **exact** username / `accountName` match, then use that EOA |
| Presence | Mailbox listen-pool via `wallet_online_query`. Ignore `searchKey.routeOnline` (SI no longer writes it) |
| Optional split | **Routing EOA** for AddressPGP + listen / ACK / presence; **sender / recipient EOA** only inside the encrypted envelope |

Current Beamio clients often use one EOA for all of the above. A new app can split them: register and listen with a routing wallet, encrypt to that row’s inbox user PGP, and put the product `from` / display wallet only in layer ②/③. Mailbox B then sees the routing EOA. Do not also write the product wallet into listen JSON or hop-sigs. See [Routing wallet versus sender / recipient wallets](wallet-address-p2p.md#routing-wallet-versus-sender--recipient-wallets).

Register and `searchKey` samples: [SI developer guide](si-developer-guide.md#sample-register-a-mailbox-route).

## Envelope layers

Live `sendMessage` signs the **inner application string** (`text`), then OpenPGP-encrypts a JSON envelope to the recipient user PGP.

```text
① application body
   plain text  — or —  typed JSON (receipt, POS permission, …)

② pending row  (what most clients put in envelope.text)
   { sendId, from: "me", text: <① as string>, createdAt }

③ outer envelope  (EIP-191)
   { timestamp, text: <JSON.stringify(②)>, from: <sender EOA>, signMessage }
   signMessage = wallet.signMessage(text)   // signs ②, not ③

④ OpenPGP
   encrypt base64(JSON.stringify(③)) to R userPublicKeyArmored

⑤ POST
   { data: <armor> } → several https://{domain}.conet.network/post  (A ≠ B)
   HTTP JSON is **only** `{ data }`. For a sender receipt, wrap ④ as mailbox work
   `{ data: armor, NoPush: true }` encrypted to the **sender mailbox B** route PGP,
   then POST that outer armor. See [SI mailbox work](si-developer-guide.md#3-mailbox-work-envelope-mailbox-b-decrypts).
```

Inbound: decrypt with the recipient user PGP private key → parse ③ → `ethers.verifyMessage(text, signMessage)` must recover `from` → unwrap nested `text` for typed payloads.

POS terminal authorization nests another object inside ① (`type: "beamio_pos_terminal_permission_v1"`). Merchant OS must unwrap along `text` and put it on **Staff pending**, not Messages. See [DePIN Chat](../applications/depin-chat.md).

## Sample: send

Reuse `postArmor` / entry picking from the SI guide. This is the live Chat envelope.

```ts
import { createMessage, encrypt, enums, readKey } from 'openpgp'
import { ethers } from 'ethers'

export type ChatPendingRow = {
  sendId: string
  from: 'me'
  text: string
  createdAt: number
}

export async function sendChatMessage(opts: {
  wallet: ethers.Wallet
  recipientUserPublicKeyArmored: string
  mailboxDomain: string
  entryDomains: string[]
  body: string
  sendId?: string
}): Promise<{ ok: boolean; sendId: string }> {
  const sendId = opts.sendId ?? crypto.randomUUID()
  const pending: ChatPendingRow = {
    sendId,
    from: 'me',
    text: opts.body,
    createdAt: Date.now(),
  }
  const text = JSON.stringify(pending)
  const signMessage = await opts.wallet.signMessage(text)
  const envelope = {
    timestamp: Date.now(),
    text,
    from: opts.wallet.address,
    signMessage,
  }
  const pgpMsg = await createMessage({
    text: Buffer.from(JSON.stringify(envelope)).toString('base64'),
  })
  const armored = await encrypt({
    message: pgpMsg,
    encryptionKeys: await readKey({ armoredKey: opts.recipientUserPublicKeyArmored }),
    config: { preferredCompressionAlgorithm: enums.compression.zlib },
  })

  const targets = opts.entryDomains.filter((d) => d && d !== opts.mailboxDomain).slice(0, 4)
  const results = await Promise.all(
    targets.map(async (domain) => {
      const res = await fetch(`https://${domain}.conet.network/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: armored }),
      })
      return res.ok
    }),
  )
  return { ok: results.some(Boolean), sendId }
}
```

HTTP 200 on any entry means the armor was accepted for forward. It does **not** mean the recipient UI ingested it. Deduplicate inbound copies by `sendId` (several entries may deliver the same armor).

## Sample: listen

Chat listen is an SI **route command**, not user-PGP business. Required: `listenKind: "chat"`. Full helper: [SI developer guide](si-developer-guide.md#chat-mailbox-listen-listenkind-chat).

```ts
const command = {
  command: 'mining',
  listenKind: 'chat',
  walletAddress: wallet.address,
  algorithm: 'aes-256-cbc',
  Securitykey: sessionKeyBase64,
}
// sign JSON.stringify(command); encrypt { message, signMessage } to own route PGP
// POST { data } to entry C ≠ mailbox B; read SSE
```

| Frame | Treat as |
| --- | --- |
| Handshake / `{ status, epoch, … }` | Liveness. Ignore for Messages |
| OpenPGP armor (user-PGP) | Decrypt, verify, unwrap, then **dual receipts** |
| `udp_listen_attached` / UDP frames | Only if you implement UDP; not Chat bubbles |

Keep listen on a Worker. Reconnect with another random **C ≠ B** after idle or drop. Use a `setTimeout` chain after the previous attempt finishes.

| Client rule | Why |
| --- | --- |
| Start the ~12s `connect_timeout` **after** `fetch` | Wrap / `encrypt()` can burn the budget before C is even dialed |
| Emit `listening` only after `res.ok` **and** `res.body` | 404 / empty body is a failed peel hop, not a live mailbox |
| Exclude the failed `node.domain` on reconnect | One hung C should not be retried first |
| Do not let `history.load` starve listen on a single Worker thread | Recover can run before `activeClient` exists |

A peel-success SI log `forward <ip>` is the **client source IP**, not mailbox B. If C peels then throws on hop-sign (`Buffer.byteLength` / instance of `h`), **B is never dialed**. Switching C does not help until peelers return a UTF-8 armor string. See [Peel, hop-sig, and listen timeouts](peel-hop-listen.md).

## Sample: verify inbound

```ts
export function verifyChatEnvelope(plainUtf8: string): {
  from: string
  text: string
  timestamp: number
} | null {
  let env: { timestamp?: number; text?: string; from?: string; signMessage?: string }
  try {
    env = JSON.parse(plainUtf8)
  } catch {
    return null
  }
  if (!env.text || !env.from || !env.signMessage) return null
  let recovered: string
  try {
    recovered = ethers.verifyMessage(env.text, env.signMessage)
  } catch {
    return null
  }
  if (recovered.toLowerCase() !== env.from.toLowerCase()) return null
  return { from: env.from, text: env.text, timestamp: Number(env.timestamp) || 0 }
}

/** Walk nested `text` for typed application JSON. */
export function unwrapTextJson(displayText: unknown, max = 6): unknown {
  let cur = displayText
  for (let i = 0; i < max; i++) {
    if (typeof cur === 'string') {
      const t = cur.trim()
      if (!t) return null
      try {
        cur = JSON.parse(t)
        continue
      } catch {
        return cur
      }
    }
    if (cur && typeof cur === 'object' && typeof (cur as { text?: unknown }).text === 'string') {
      cur = (cur as { text: string }).text
      continue
    }
    return cur
  }
  return cur
}
```

After decrypt, if the Worker received armor, compute `armorHash = keccak256(utf8(fullArmor))` before discarding the armor string. You need it for the mailbox ACK.

## Dual receipts (required)

After a **business** message is ingested (verified, not a receipt, not POS-permission-only):

1. **Mailbox ACK** — SI command `gossip_delivery_ack` encrypted to **B route PGP**. Removes offline store and cancels pending APNs. Sample: [SI developer guide](si-developer-guide.md#mailbox-delivery-ack).
2. **Sender receipt** — ordinary Chat business envelope whose inner type is `beamio_chat_delivery_receipt_v1`, encrypted to the **original sender’s user PGP**, then wrapped as mailbox work `{ data: <user-PGP armor>, NoPush: true }` encrypted to the **sender’s mailbox B route PGP**. HTTP to the entry is still only `{ data }`. SDK: `sendMessage(..., { beamioNoPush: true })` (requires `to.routerArmoredPublicKey`).

```ts
export const CHAT_DELIVERY_RECEIPT_V1 = 'beamio_chat_delivery_receipt_v1' as const

export type ChatDeliveryReceiptV1 = {
  type: typeof CHAT_DELIVERY_RECEIPT_V1
  sendId: string
  armorHash?: string
  deliveredAt: number
  from: string
}

export function makeDeliveryReceipt(opts: {
  sendId: string
  fromEoa: string
  armorHash?: string
}): ChatDeliveryReceiptV1 {
  return {
    type: CHAT_DELIVERY_RECEIPT_V1,
    sendId: opts.sendId,
    armorHash: opts.armorHash,
    deliveredAt: Math.floor(Date.now() / 1000),
    from: opts.fromEoa,
  }
}
```

Send that object as `pending.text` (JSON string) using the same `sendChatMessage` path, encrypting to the **sender** user PGP.

On the sender: unwrap inbound; if `type === beamio_chat_delivery_receipt_v1`, mark the existing outbound bubble `delivered` by `sendId`. **Do not** append a Messages row. **Do not** increment unread.

Mailbox stores ciphertext first (`saveLocal`), then best-effort SSE. Do not treat SSE `forWard SUCCESS` as “the user has the message.” Offline users get APNs from mailbox policy; ACK cancels that timer.

## Presence

On entering the chat list:

1. Refresh route fields (`routersArmoreds` / route PGP) from `searchKey`. **Do not** copy `routeOnline` into the green dot.
2. For each contact that has a mailbox route, send `wallet_online_query` (SI guide sample).
3. Merge `online` only when `ok === true`. Failures keep the last trusted value.

Online means: that wallet is in **this mailbox’s** `livenessListeningPool` and the listen socket is not stale. It is not a chain write.

## Resolve `@BeamioTag`

```ts
type TagHit = { address: string; username?: string; accountName?: string }

export function pickExactBeamioTag(
  query: string,
  results: TagHit[],
  addressHint?: string,
): TagHit | null {
  const q = query.replace(/^@/, '')
  const exact = results.filter(
    (r) => r.username === q || r.accountName === q,
  )
  if (exact.length === 1) return exact[0]
  if (exact.length > 1 && addressHint) {
    const hint = addressHint.toLowerCase()
    const hit = exact.find((r) => r.address.toLowerCase() === hint)
    return hit ?? null
  }
  const ci = results.filter(
    (r) =>
      r.username?.toLowerCase() === q.toLowerCase() ||
      r.accountName?.toLowerCase() === q.toLowerCase(),
  )
  if (ci.length === 1) return ci[0]
  return null
}
```

Current discovery HTTP: `GET/POST` `https://beamio.app/api/search-users` (application API, not SI). If the exact match is ambiguous, **fail**. Never encrypt to `results[0]`.

## Typed payloads

| `type` | UI |
| --- | --- |
| (plain / no type) | Messages bubble |
| `beamio_chat_delivery_receipt_v1` | Update existing outbound `status → delivered` only |
| `beamio_pos_terminal_permission_v1` | Merchant **Staff → Pending terminal authorization** only. Requires `childBeamioTag`. Do not show as a chat JSON dump |

POS permission is still delivered as user-PGP Chat armor. Classification happens **after** verify + unwrap.

## Encrypted history (optional second track)

L0 does not store Chat history. Apps that promise cross-device recover use:

| Item | Value |
| --- | --- |
| Registry (UUPS proxy) | [`ChatIndexRegistry`](https://mainnet.conet.network/address/0x1511Caa71081C84d8a591490D1b83879088EED72) `0x1511Caa71081C84d8a591490D1b83879088EED72` |
| Read pointer | RPC `getPointer(eoa)` on CoNET L1 (not Cluster-only) |
| Write pointer | EIP-712 `SetPointer` → Cluster `POST /api/setChatIndexPointer` (gas relay) |
| Fragments | `https://ipfs.conet.network/api/storageFragment` / `getFragment?hash=` |
| Hash | `keccak256(utf8(cipherB64))` |

Local `profile.chats` is the UI track. After recover it may be empty. Decrypt the index, **create missing sessions** by peer EOA, then merge. Do not `if (!chats.length) return`. POS permission and delivery receipts stay off the encrypted history track.

Keys are derived in a Worker from an EIP-191 domain over the EOA. Without the EOA signing key, history is unreadable. See the product page and chat-sdk `history` worker for the HKDF labels.

## Using `@conet.project/chat-sdk`

Prefer the SDK Worker over copying OpenPGP onto the UI thread. Host responsibilities the SDK still expects:

- inject `eoa`, user PGP private/public, **own route public key**, and the Guardian node list;
- never send the EOA private key into a Worker if your product forbids it — current Beamio Chat Worker derives listen/send from material the host already holds; keep secrets out of logs either way;
- implement UI ingest: verify (if not already), classify typed payloads, dual receipts, create-session-on-recover;
- register coupon / tag / merchant data on your own stores; the SDK is the gossip plane.

If you hand-roll, keep the same A/B/C and envelope rules so mailboxes stay interoperable with Beamio clients.

## Diagnosis: “I sent but they never see it”

Walk this order. Do not skip to “the parser is broken.”

1. Recipient EOA equals the AddressPGP row you encrypted to (not AA, not a prefix-search collision). Never take `search-users` `results[0]`.
2. Recipient listen is up with `listenKind: "chat"` and SSE Connected. Epoch / listing heartbeats prove the pipe is alive; they are not inbound Chat. If the console shows only `[Gossip] Unknown format` and no message, the business armor never entered **this** mailbox — do not conclude “the parser is broken.”
3. If the Worker reports `connect_timeout` (~12s) and changing C still fails: check whether C **peeled** then threw on hop-sign (`string` / instance of `h`) and **never** `socketForward` to B. A log-only `uncaughtException` leaves the SSE open until the client timer. See [Peel, hop-sig, and listen timeouts](peel-hop-listen.md).
4. SI `forward <ip>` after peel is the **client source IP**, not mailbox B.
5. Mailbox logged `forWard SUCCESS` or `save to Local`. Offline users get a flush on next listen; the client must process that flush (do not skip the first SSE event) and dedupe `sendId`.
6. Fake-armor **404** is SI rejecting bad PGP, not a down node.
7. Sender used entries **A ≠ B**. Direct-to-B is not the product path.
8. Recipient `isMyRoute` / wallet↔route hash consistency can block listen and presence without blocking user-PGP store.

## Checklist

- [ ] Sender registered (`regiestChatRoute` + `searchKey` shows the local subkey)
- [ ] Business encrypt-to recipient **EOA user PGP**; listen/ACK/presence encrypt-to **route PGP**
- [ ] Listen includes `listenKind: "chat"` and **C ≠ B**
- [ ] `connect_timeout` starts after `fetch`; `listening` requires `res.ok` + body
- [ ] Peel / hop-sign failure is diagnosed before “switch C” or “parser broken”
- [ ] `@tag` resolution is exact; no `results[0]`
- [ ] Inbound verify recovers `from`; typed unwrap walks `text`
- [ ] Dual receipts after ingest; receipts and POS permission are not Messages rows
- [ ] Presence is `wallet_online_query`; failures do not clear a trusted green dot
- [ ] Recover creates missing sessions before merge
- [ ] No private keys, full private PGP, or `Securitykey` in logs

## Related

- [L0 development](../developers/l0.md)
- [SI developer guide](si-developer-guide.md)
- [How to use Layer Minus](using-l0.md)
- [Zero-trust mailbox routing](mailbox-routing.md)
- [Peel, hop-sig, and listen timeouts](peel-hop-listen.md)
- [Wallet-addressed peer identity](wallet-address-p2p.md)
- [UDP frame forwarding](udp-forward.md)
- [Security limits](security-limits.md)
- [DePIN Chat](../applications/depin-chat.md)
- [Resources](../resources.md)
