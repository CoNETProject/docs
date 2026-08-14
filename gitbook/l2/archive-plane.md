# Archive availability and finality

DLE separates **block production** from **archive certification**. The two stages have different members, quorums, and authority.

## Candidate production

For a tip event, the target protocol selects seven validators and requires five accept signatures:

\[
N_V = 7,\qquad Q_V = 5
\]

The validator certificate makes a candidate eligible for archive review. It does not by itself finalize the DLE block.

Only the validator committee produces the candidate block. Archive nodes must not create substitute blocks, control blocks, or empty anchor blocks.

## Archive group

Each hosting archive group has:

- five active voters;
- two ordered, non-voting standbys; and
- a quorum of four active voters.

\[
N_A = 5,\qquad f = 1,\qquad Q_A = 4
\]

Standbys do not occupy certificate signer slots unless a finalized membership transition promotes them. Existing groups retain their assigned tips; group growth does not remap all chains.

Operator independence is not inferred from distinct wallet addresses. `OperatorDomainRegistryV1` defines challengeable identity, infrastructure, and role-domain commitments used by membership decisions and bound into `membershipRoot`.

## Availability before finality

The archive path is not a storage-only acknowledgement. Before a non-nil precommit, each voting archive implementation must:

1. obtain the canonical full candidate body;
2. validate the validator certificate and current membership context;
3. deterministically replay the class state transition;
4. re-encode the body under `dle.rs.v1`;
5. recompute the data and state commitments; and
6. reject a candidate whose bytes, transition, or availability evidence do not match.

`dle.rs.v1` freezes Reed–Solomon `(n,k)=(7,4)` encoding and exact commitment rules. Possessing four Merkle-authenticated chunks is not, by itself, permission to vote: the signer must reconstruct and verify the canonical body.

## Tendermint-style finality

The archive state machine follows:

`Proposal → PrevoteQC → PrecommitQC`

A non-nil `PrecommitQC` is the **Archive Certificate (AC)**. The protocol includes nil votes, round changes, lock and valid-round semantics, timeout certificates, candidate-reject certificates, and write-ahead-log rules that prevent double signing across restart.

Finality is reached only when the current candidate has the required non-nil archive precommit certificate. A coordinator, one archive node, or the validator certificate alone cannot finalize it.

## Membership and exit

Archive membership changes are explicit state transitions. A planned exit retains duties until the replacement root is active, promotes the first ordered standby, and does not lower the four-of-five quorum. Equivocation, invalid availability claims, premature shutdown, and failed handover belong to archive accountability; user asset force exit is a separate gateway state machine.

## Implementation status

The archive conformance document is a **normative draft** with an executable v2 corpus and an Archive A deterministic MVP. It does not authorize production signing.

The specification lists open production blockers:

- one canonical EIP-712/SSZ verification wrapper;
- reproduction by a second independent production-language implementation with differential tests; and
- production networking, key custody and rotation, L1 checkpoint verification, signature recovery, and crash-injection integration.

Until those blockers close, the normative specification states that no archive signer may be enabled for production.

## Source anchors

- Whitepaper: §§5.2–5.2.1; §§6.2 and 6.5; §§7.8–7.9
- `DLE-Archive-Tendermint-Conformance-Spec.md`: §§1–11
- `DLE-OperatorDomainRegistryV1-Spec.md`: §§2–11
- [Normative sources](specs-index.md) — paths and precedence

## Next

[Ledger classes →](tip-classes.md)
