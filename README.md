# CoNET Documentation

Source for the public protocol book at **https://gitbook.conet.network**.

The maintained content lives under `gitbook/` and follows one architecture:

1. **L0 — Layer Minus:** wallet/OpenPGP identity, entry and mailbox routing, HTTP(S) transport, and UDP frame forwarding.
2. **L1 — CoNET Blockchain:** the production EVM network (`chainId` 224422), validators, Guardians, RPC, core assets, and decentralized cross-chain Treasury.
3. **L2 — CoNET-DLE:** the whitepaper-backed design for parallel application ledgers and settlement.

Application pages explain how products compose those layers. Economic-design pages are explicitly labeled as design studies where implementation or deployment is incomplete.

`doceng.conet.network` is **not** a content source. Its frozen export is preserved under `archive/doceng-mirror/` for historical comparison only.

## Local build

```bash
cd gitbook && npm ci && npm run build
# static site → gitbook/_book/
```

Local preview:

```bash
cd gitbook && npm run serve
```

## Deploy (38.102.126.50)

```bash
./scripts/deployGitbook.sh
```

Deployment requires SSH as `root@38.102.126.50`. DNS for `gitbook.conet.network` must point at that host.

`./scripts/deployGitbook.sh --sync` is **disabled** (doceng sync deprecated).

## Repository layout

| Path | Role |
|---|---|
| `gitbook/` | HonKit source: overview, L0/L1/L2, applications, design studies, and resources |
| `scripts/deployGitbook.sh` | Build + rsync + nginx + TLS |
| `scripts/sync-from-doceng.mjs.deprecated` | Stub — refuses to overwrite content |
| `archive/doceng-mirror/` | Frozen doceng markdown mirror |
| `archive/` | Older Sphinx / Voken materials |

`gitbook/_book/` is generated output and is not an editorial source.

## Editorial rules

- Public text is English.
- Preserve public page paths when reorganizing content. If a path must move, leave a useful compatibility page.
- Separate **production reference**, **implemented capability**, **under development**, **normative design**, and non-normative **design study** material.
- Do not infer current endpoints, contracts, or deployment status from historical documentation.
- Do not describe an entry HTTP success or SSE handshake as end-to-end delivery.
- Do not describe a whitepaper design as deployed unless the deployment is independently identified.
- **DePIN / L0 protocol-layer changes** (HTTP `/post` shape, encryption targets, mailbox work, hop-sigs, listenKind, UDP forward) must update **both** the L0 architecture pages and the developer pages in the same task, then deploy with `./scripts/deployGitbook.sh`. See `.cursor/rules/conet-depin-gitbook-sync.mdc`.

## Source anchors

- L0 implementation: `src/CoNET-SI/`, `src/CoNET-DL/`, and AddressPGP
- L1 implementation: `src/mainnet/`, `src/b-unit/`, `https://rpc1.conet.network`, and `https://publicrpc.conet.network`
- L2 design: `src/conet-layer2/src/whitepaper/` and named `DLE-*-Spec.md` files
- Non-normative analysis: `src/canvas/`
