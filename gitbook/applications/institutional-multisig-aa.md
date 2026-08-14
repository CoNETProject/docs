# Beamio institutional multisig AA

**Maturity: Integrated capability.** Beamio includes V2 institutional-wallet UI and relay paths. This label does not assert that every chain has identical deployment configuration, that every policy feature is complete, or that the contracts have an independent audit.

Public site: [https://gitbook.conet.network/applications/institutional-multisig-aa.html](https://gitbook.conet.network/applications/institutional-multisig-aa.html)

Parent product: [Beamio](beamio.md).

## Product role

Institutional multisig AA is Beamio’s team-controlled Smart Wallet. Multiple manager EOAs govern one account through **M-of-N on-chain tasks**:

- a manager proposes a transfer or policy change;
- managers sign EIP-712 approvals or rejections offline;
- a relayer submits the signed actions and pays transaction gas;
- the V2 account contract enforces the manager set, threshold, task state, reservations, and execution.

The relayer transports valid signatures; it is not the vote ledger and cannot replace the contract threshold.

This capability is intended for team treasury and policy control. It is not a bank core, an off-chain custody service, or a claim that one wallet state is synchronized across chains.

## Protocol dependencies

| Dependency | Application use |
| --- | --- |
| **V2 account and V2 Factory** | Creates institutional accounts, stores task state, enforces threshold votes, and indexes accounts by manager |
| **CoNET L1** | Primary chain for new Beamio consumer accounts and institutional accounts |
| **Base** | Optional V2 institutional deployment; not a chain for new Beamio consumer-account issuance |
| **EIP-712 manager signatures** | Lets managers authorize propose, approve, or reject actions without holding an AA gas key |
| **Cluster / Master / Paymaster relay** | Prechecks signed requests, submits them, and sponsors gas for supported actions |
| **Factory manager index** | `accountsOfManager(eoa)` lets co-managers discover accounts they do not own |
| **Application daemon and local store** | Periodically reads pending and recent tasks for the active manager and selected chain |
| **DePIN Chat, optionally** | Can notify or deep-link to a task, but is not authoritative task state |

## V1 and V2 are separate product rails

| Rail | Product rule |
| --- | --- |
| **V1** | Existing personal Express Pay accounts remain usable. V1 accounts are not upgraded into the institutional task model, and old V1 “institutional” indexes are not listed as V2 team wallets. |
| **V2** | All new institutional accounts use the V2 Factory and V2 account init code. New consumer Smart Wallet issuance is also on CoNET through the current account rail. |

V2 uses a separate CREATE2 configuration from V1. Clients and relayers must identify the account version and Factory rather than treating every AA address as interchangeable.

## How protocol capability becomes team control

### Task lifecycle

```text
Manager EOA
  │  EIP-712 sign proposal
  ▼
Relay submits to V2 AA
  │
  ├─ store task and threshold snapshot
  ├─ reserve transferable asset amount, when applicable
  └─ collect EIP-712 approve / reject votes
         │
         ├─ approvals reach M ──► execute ──► release reservation
         └─ threshold becomes impossible ──► cancel ──► release reservation
```

| Concept | V2 behavior |
| --- | --- |
| **Task identity** | The task is stored by the AA contract. It is not a long-lived EntryPoint `userOpHash` or EntryPoint nonce. |
| **M-of-N threshold** | A task succeeds when approvals reach its threshold. Managers and threshold are snapshotted when the task is created so a later policy change cannot silently rewrite the vote. |
| **Threshold = 1** | The proposal can count as the sole approval and execute in the same transaction. |
| **Factual cancellation** | If rejects make the threshold unreachable, the contract cancels the task. For N managers, threshold T, and R rejects, cancellation is inevitable when `R > N - T`. |
| **Reserved balance** | A pending native-token or ERC-20 transfer reserves its asset amount. New proposals use `spendable = balance - reserved`, preventing parallel proposals from overcommitting that tracked asset. |
| **Policy lock** | A pending policy task, such as `set_policy`, blocks new transfer proposals and transfer voting or execution until the policy task reaches a final state. |
| **Restricted account actions** | Container and create-redeem paths are allowed only in sole-self-signer mode. The V2 contract, not only the UI, must enforce the restriction. |

Reservations are not a universal accounting system for every arbitrary call. They protect the asset and amount classes recognized by the V2 transfer task model.

### Manager discovery

The owner is manager position zero; other managers are de-duplicated and ordered. An application discovers manageable institutional accounts from both directions:

```text
accounts created by the viewer
        ∪
Factory accountsOfManager(viewer)
```

The periodic pending-task reader then fetches chain state for those accounts. Chat notifications can improve UX, but a missing message must not hide an on-chain pending task.

### Cross-chain address does not mean cross-chain state

Deploying the same V2 init code with the same CREATE2 salt can produce the same account address on CoNET and Base. Each chain still has its own:

- balances and reservations;
- EntryPoint nonces;
- manager and policy state;
- pending, executed, cancelled, and expired tasks;
- transaction history and finality.

Applications must always include the chain in task identifiers, caches, signatures, and UI context. A vote signed for one chain is not a vote on another chain.

## What exists today

| Surface | Current implementation |
| --- | --- |
| **Beamio Consumer PWA** | Institutional-account creation, proposal, approval, rejection, pending-task, history, and co-manager discovery interfaces |
| **x402sdk Cluster / Master** | Institutional creation and task relay paths, with precheck and gas-sponsored submission |
| **V2 account model** | On-account task storage, threshold snapshots, reservations, policy locking, and manager discovery |
| **Background task reader** | Periodic chain-backed discovery of pending and recent tasks for co-managers |

The current CoNET V2 Factory is [`0xE9577cFd00A00E97D26854243B6AB4B11D5E907f`](https://mainnet.conet.network/address/0xE9577cFd00A00E97D26854243B6AB4B11D5E907f). Its Explorer record identifies `BeamioFactoryInstitutionalV2` with verified Solidity source. This address is a CoNET production reference, not evidence that an optional deployment on another chain has identical configuration.

Published sources:

| Component | GitHub | npm |
| --- | --- | --- |
| **Consumer institutional UI** | [CoNET-project/SilentPassUI](https://github.com/CoNET-project/SilentPassUI) | — |
| **Cluster / Master relays** | [settleonbase/x402sdk](https://github.com/settleonbase/x402sdk) | [`@settle402/sdk`](https://www.npmjs.com/package/@settle402/sdk) |
| **DePIN Chat integration** | [CoNET-project/chat-sdk](https://github.com/CoNET-project/chat-sdk) | [`@conet.project/chat-sdk`](https://www.npmjs.com/package/@conet.project/chat-sdk) |

The engineering workspace retains the CoNET V2 verification input at `deployments/conet-BeamioAccountInstitutionalV2-verify-buildinfo.json`. The current `src/BeamioAccount/` tree is not cited here as a complete reproducible V2 source tree. The verified Explorer source and deployment input establish code provenance; they do not constitute an independent audit of the Factory, generated accounts, upgrade authority, signature domain, or relay.

## What remains in development

- Publish independent contract, upgrade-authority, signature-domain, and relay security reviews.
- Publish a per-chain deployment registry for every supported V2 Factory and generated account version, including optional Base configuration if it is offered.
- Improve hardware-wallet support, manager onboarding, recovery, policy explanation, and transaction simulation.
- Expand policy types only with explicit reservation and lock semantics.
- Improve relayer failover and user-visible handling when a valid task exists but gas-sponsored submission is unavailable.
- Add operational monitoring for pending-task discovery, chain reorganization handling, stale local caches, and cross-chain context errors.
- Define migration guidance for teams that previously used abandoned V1 institutional-style accounts; those accounts are not silently converted.

## Trust and security boundary

| Boundary | Security implication |
| --- | --- |
| **Manager keys** | M-of-N reduces single-key control only when the threshold and manager independence are meaningful. Compromising M managers compromises the wallet. |
| **V2 account contract** | Enforces votes and task state. Safety depends on deployed bytecode, storage layout, upgrade authorization, and chain configuration. |
| **Relayer / Paymaster** | Can delay, censor, or fail gas-sponsored submissions, but must not manufacture a manager signature or bypass the on-chain threshold. |
| **EIP-712 domain** | Must bind the intended chain, account, task, call data, deadline, and snapshot context. Incorrect domain handling can authorize the wrong action or make signatures unusable. |
| **Reserved accounting** | Protects recognized transfer assets; arbitrary calls may have effects outside the reservation model and require separate policy review. |
| **Policy lock** | Prevents transfers during a pending policy change, but a deliberately stalled policy task can also block operations until finalized or cancelled. |
| **Local task cache** | Improves discovery and UX but is not authoritative. Failed reads must preserve prior trusted data rather than invent an empty task list. |
| **Cross-chain deployment** | Same address is only a deterministic deployment property. No balances, votes, reservations, policies, or task outcomes are shared across chains. |

DePIN Chat can reference a task, but only the selected chain’s V2 account state determines whether the task exists and what it can do.

## Related

- [Beamio](beamio.md)
- [Applications](README.md)
- [DePIN Chat](depin-chat.md)
- [Assets on L1](../l1/assets.md)
- [Resources](../resources.md)
- Implementation anchors in the Beamio monorepo: `deployments/conet-BeamioAccountInstitutionalV2-verify-buildinfo.json`, `src/SilentPassUI/src/pages/Wallet/AaMultisigPage.tsx`, `src/SilentPassUI/src/utils/aaInstitutionalV2PendingDaemon.ts`, and `src/x402sdk/src/aaInstitutionalV2Multisig.ts`
