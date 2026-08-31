# Privacy-first Decentralized AI

**Maturity: Design direction.** This page is the public landing digest. The
full architecture paper is
[Privacy-first Decentralized AI — Whitepaper](privacy-first-ai-whitepaper.md).
This is not a shipped GPU marketplace, training network, data market, or
decentralized AI product.

Public site: [https://gitbook.conet.network/applications/privacy-first-ai.html](https://gitbook.conet.network/applications/privacy-first-ai.html)

The same narrative appears on [conet.network](https://conet.network/#privacy-first-ai)
and in the L0 thesis
[Permissionless cloud and zero-trust applications](../l0/permissionless-cloud.md).

## PRIVACY-FIRST DECENTRALIZED AI

### Three independent roles. One open intelligence economy.

Centralized AI combines models, data, and user agents under one platform.
CoNET separates them across independent wallet-addressed participants—and
uses private application paths and programmable micropayments to make that
separation economically sustainable.

Models, data, and AI agents need neither mutual trust nor ownership by the
same platform. Layer Minus and `web3://` reduce the need for one network
intermediary to observe the complete user–service relationship. That
benefit is conditional on operator separation, client-side key control,
route diversity, limited identifier reuse, and the absence of collusion.
CoNET-DLE micropayments are designed so value can move among independent
participants for each measurable contribution. That is not a claim that
wallet payments or DLE automatically hide prompts, datasets, or the
service graph. The one-basis-point protocol-value fee is a target for
specified classes of applicable value movement, not a universal all-in
fee for every AI task. AI event classes are proposed, not frozen DLE
tip classes.

**Design principle:** Do not ask users to trust a platform that calls itself
neutral. Make bias, interest, and authority visible enough to compare,
refuse, and replace. A contestable model is not assumed to be unbiased. The
goal is not neutral intelligence. It is an intelligence market in which no
single model owner can make its bias unavoidable. Independently sourced
data means data contributed under the provider’s own provenance, license,
disclosure, and payment terms—not exclusively selected and preconditioned
by the platform that owns the model and the user agent. Three wallets do
not prove three independent powers. Role separation becomes meaningful
only when ownership, infrastructure, logging, authorization, and economic
interest are also separated—or when their overlap is explicitly disclosed.
Decentralization is not the number of addresses. It is the inability of
one control domain to reconstruct and govern the whole relationship.

### Observation, prediction, and intervention

Platform analysis, prediction, and choice-shaping are related, but they
are not the same capability.

| Stage | Capability | Risk |
| --- | --- | --- |
| **Observation** | Collects behavioral and relational metadata | Privacy and power asymmetry |
| **Prediction** | Infers preference, risk, and the next action | Covert classification and differential treatment |
| **Intervention** | Changes ranking, price, content, or agent action | The user's choice environment is manipulated |

**Prediction is not intervention.** The governance risk becomes more
severe when the same actor that predicts a user also controls the
ranking, price, recommendation, or agent action presented to that user.
Independent prediction is not automatically manipulation.

A model can be packaged and replaced as a capability. An agent is a
continuing relationship: it retains context, holds authority, selects
services, and mediates action over time.

**Full paper:**
[Privacy-first Decentralized AI — Whitepaper](privacy-first-ai-whitepaper.md)
— Executive Thesis, including observation, prediction, and intervention
(§1.3); the closed AI power loop; contestable data, models, and
agents (independently sourced data, contestable model supply, user-controlled
agents, independence as a verifiable property, and the operational
evaluation matrix); three independent roles and Figure 1; private and
economic coordination; protocol requirements; threat model; governance;
maturity and roadmap.

## Three independent roles

| Role | Line | Meaning |
| --- | --- | --- |
| **MODEL BUILDERS** | Build intelligence without owning the user. | Publish models or verifiable artifacts. Do not automatically receive complete user prompts or control the data-provider network. |
| **DATA PROVIDERS** | Contribute data without surrendering control. | Contribute and attest inputs. Fragment and encrypt sensitive material so one collector does not become the universal data custodian. |
| **AI AGENTS** | Act for users without becoming the platform. | Request work, protect private context, and return results to the user. Do not silently become the model owner and data authority. |

No single role should own the model, the complete private input, and the user
relationship at once. Three wallets, three companies, or three product cards
do not prove that split if they share one beneficiary, one cloud, one login,
one analytics store, one logging SDK, one payment address, or an exclusive
contract.

## PRIVATE COORDINATION

**Implementation status.** Layer Minus forwarding is an implemented L0
capability. `web3://` has implemented v1 components, including wallet
locators, signed requests, encrypted response correlation, Linux runtime
support, and early persistent streams. Complete cross-platform handling
and general public hosting remain under development.

Layer Minus and `web3://` reduce the need for one network intermediary to
observe the complete user–service relationship.

This benefit is conditional on operator separation, client-side key
control, route diversity, limited identifier reuse, and the absence of
collusion. Protocol-role separation alone does not prove legal-entity or
infrastructure independence.

- In the proposed application model, the durable application owner is
  represented by a wallet identity. Layer Minus routing additionally
  depends on OpenPGP identity and mailbox-route bindings; an exact
  `@BeamioTag` may provide an application-facing alias. Wallet addressing
  is **pseudonymous, not automatically anonymous**.
- Entry, mailbox, and application hosts must be **different control
  domains**. One company can still run A, B, and C.
- Users must not reuse one public wallet for every model, data, and
  payment task. A stable wallet can recreate the relationship graph.
- Entry, mailbox, and hop nodes carry ciphertext. They are not the product
  platform.
- L0 GPU or other compute hosts remain **untrusted**. Encrypted
  fragmentation, independently controlled keys, and verifiable or
  redundant execution stay application-layer work.
- Applications should encrypt and fragment sensitive state so that no
  single storage provider receives enough material to reconstruct the
  whole. Fragmentation thresholds, redundancy, recovery, deletion, and
  availability verification remain application-specific requirements.
  Layer Minus provides forwarding and mailbox primitives; fragmentation
  is not an automatic property of all L0 traffic.

See [How to use Layer Minus](../l0/using-l0.md) and the
[`web3://` Application Protocol](../l0/web3-application-protocol.md).

## ECONOMIC COORDINATION

CoNET-DLE is designed for small, frequent payments among agents, models, data
providers, and infrastructure operators. Each participant can earn from a
measurable contribution without controlling the entire AI stack.

The current DLE economic design targets a one-basis-point protocol value
fee for specified classes of applicable value movement. This is not a
universal all-in fee for every AI task. Inference execution, data access,
proof verification, L1 settlement, retries, storage, and availability may
carry separate measured costs under future class-specific fee schedules.

#### AI event classes are proposed, not yet normative

Examples such as one model inference, one licensed data access, or one
verification result are **candidate** AI-market events. They are not
presently frozen DLE tip classes. Each would require its own
deterministic state machine, evidence format, replay rules, completion
criteria, dispute process, privacy boundary, and release gates.

Official developer documentation still lists DLE as a **normative
design and experimental environment**, not a production SDK or a
launched L2 service. See [L2 development](../developers/l2.md).

### Privacy-preserving settlement requirement

A future AI payment protocol should prove only the service right, amount,
and settlement condition required for one interaction. It should avoid
placing prompts, dataset identifiers, long-term agent identity, or the
complete service graph on a public ledger.

This property requires a specified payment-session and unlinkability
design; it is not provided automatically by wallet payments or by DLE.

A public-chain micropayment can add metadata rather than hide it.

See [L2 — CoNET-DLE](../l2/README.md) and [L2 economics](../l2/economics.md).

## Closing

Privacy creates independence.

Micropayments make independence sustainable.

## What this page does not claim

- A general GPU marketplace, training network, or data market is in
  production.
- That Layer Minus provides anonymity, or that A/B/C role labels prove
  legal-entity or infrastructure independence.
- That protocol-role separation alone hides the complete user–service
  relationship without operator separation, limited identifier reuse, and
  the absence of collusion.
- CoNET-DLE already settles AI micropayments in production, or that
  listed AI events are frozen DLE tip classes.
- That the one-basis-point protocol-value fee is a universal all-in fee
  for every AI task.
- That wallet payments or DLE automatically hide prompts, dataset
  identifiers, long-term agent identity, or the complete service graph.
  Privacy-preserving settlement is a specified design requirement, not a
  live capability.
- CoNET hosts a globally unbiased dataset or a zero-bias model.
- Decentralized AI is a live CoNET product name.
- Any listed Guardian node is an honest compute or data host.
- That `web3://` is a complete production cross-platform handler or
  general public hosting service.
- That Layer Minus application identity is only a wallet address.
- That all L0 traffic is automatically fragmented so no node holds a
  reconstructable whole.
- That every predictive analysis is manipulation. Prediction and
  intervention are distinct stages.

## Related

- [Privacy-first Decentralized AI — Whitepaper](privacy-first-ai-whitepaper.md)
- [conet.network — Privacy-first Decentralized AI](https://conet.network/#privacy-first-ai)
- [Permissionless cloud and zero-trust applications](../l0/permissionless-cloud.md)
- [`web3://` wallet-addressed applications](web3-url.md)
- [L2 economics](../l2/economics.md)
