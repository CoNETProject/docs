# Lab honesty track

**Evidence level: laboratory review.** This page records the 2026-08-17 CoNET-DLE MVP review. It is **not** a production SDK, **not** a production signing specification, and **not** 30-day qualification.

Public site: [https://gitbook.conet.network/l2/lab-honesty-track.html](https://gitbook.conet.network/l2/lab-honesty-track.html)

Developer how-to: [L2 development](../developers/l2.md). Explorer facts: [DLE explorer](explorer.md). Controlling design: whitepaper revision **2026-08-17**.

## Status in one sentence

The laboratory **control plane** (P0–P11, M6–M7, P5) is live. The laboratory **honesty track** (P12–P22) is landed in the repository engine and unit tests (`npm run runtime:test` **153/153**). A keep-data deploy of that honesty track to the official seven G1 hosts is **not claimed**. `pilotStartedAt` remains **null**.

## What is live

| Band | Result | Still not |
| --- | --- | --- |
| P0–P4 control plane | Isolated 7-host lab, read-only explorer, JSON-RPC facade | Production OperatorDomain / production DePIN gossip |
| P5 L1 stack | 16/16 Blockscout-verified UUPS on CoNET L1 `224422`, `deployBlock=847316` | Verified bytecode ≠ 5+2 qualification |
| P6–P11 seating | Live seating facade, full-open hosted set, extra joiner `fd-08` unofficial | Production \(C_G\) / 30-day gate |
| M6–M7 plane | `liveGroupCount: 2`; typed `tipStateRoot` / `membershipRoot` | G2 BFT and on-demand stay off |

Official Home **Archives** stays **7** (5 active + 2 standby). Extra standby `fd-08` / `fd-08-hosthatch-hk1` may join the lab but **does not** count as an official seat.

## What is engine-only (P12–P22)

These gates replace laboratory HMAC envelopes with laboratory EIP-712 typed data in the **repository engine**. They reuse the seating key and the existing `string` `groupId` field. They are **not** production `OperatorDomain` / secp256k1 / L1 settle.

| Gate | Engine object | Not |
| --- | --- | --- |
| P12 | `ArchiveSyncQualificationCertificate` seating votes | L1 MembershipCheckpoint settle |
| P13 | Freeze-then-bind lab beacon | Live CL RANDAO from `publicrpc` / `rpc1` |
| P14 | Lab freezer hosted-set vs production \(C_G\) split | Writing 2249 lab chains as production \(C_G\) |
| P15 | `ArchiveStateChallenge` opening / challenge | Production challenge bytes |
| P16 | `ArchiveBftVote` Archive Certificate votes | Frozen L1 wrapper / corpus SSZ |
| P17 | `ArchiveOnDemandAttest` | Production beacon / 30-day |
| P18 | `ArchiveValidatorQuorumAttest` (\(Q_V\)) | Production validator committee |
| P19 | On-demand freeze-then-bind lab keccak | Live CL RANDAO |
| P20 | Wait-hook honesty (hooks are not gossip) | Production DePIN gossip |
| P21 | Lab BFT binds `hashIndexRoot`; tree `committedInAc` stays false | Production AC commitment |
| P22 | `ArchiveStandbyReadiness`; extra `fd-08` does not count | Production OperatorDomain; wiring `node.ts` |

`node.ts` is **not** wired to the new-chain official-standby gate. `lab-cli` may return `409` `ERR_NEWCHAIN_STANDBY_NOT_READY` until two official standbys are ready.

## Largest honesty gap

The repository honesty track is **ahead of** this public book’s previous 2026-08-16 HMAC narrative, and it is **ahead of** any claimed seven-host keep-deploy of P12–P22.

Do **not** treat `153/153` unit tests as evidence that the seven live G1 hosts already serve EIP-712 seating, challenge, BFT, on-demand, or standby envelopes.

## Next laboratory gates (not landed)

| Gate | Goal | Forbidden |
| --- | --- | --- |
| **P23** | Keep-data deploy of the landed P12–P22 engines to the official G1 seven hosts. Scrape `/health` overlays (`seatingEip712`, `challengeEip712`, `bftEip712`, `ondemandEip712`, `officialStandbysReady`). Collect new-chain `409` then accept evidence. Extra `fd-08` stays unofficial. G2 stays BFT/ondemand off. | Claiming the repo test run is live-host evidence; wipe; `pilotStartedAt`; promoting `fd-08`; forcing G2 voting |
| **P24** | After P23 evidence, wire `node.ts` new-chain accept to the same `officialStandbysReady` callback as `lab-cli`. | Wiring before P23; production OperatorDomain; changing `archiveSeating.ts` |
| **P25** | Explorer read-only overlays for `officialStandbysReady` / `hashIndexCommittedInAc`. Green pills stay `seatingQualified === true` only. | Changing seating logic; painting overlays as production AC or 30-day |

## Parked

IdentityEligible / OperatorDomain / \(U_e\); flipping tree `committedInAc`; production DePIN gossip; live CL RANDAO / production \(C_G\); `PilotQualificationGate`; a second independent Archive implementation; 10 USDC / 1.2× coverage.

## Explorer rule that does not change

A green seating pill is allowed **only** when `seatingQualified === true`. Heartbeat `lastQuorumOk` is reachability. Do not invent additional `dle.*` hostnames. The authorized explorer is [https://dle.conet.network/](https://dle.conet.network/).

## Related

- [L2 overview](README.md)
- [L2 development](../developers/l2.md)
- [DLE explorer](explorer.md)
- [Normative sources](specs-index.md)
- Public repository: [CoNET-project/CoNET-DLE](https://github.com/CoNET-project/CoNET-DLE)

## Next

[DLE explorer →](explorer.md)
