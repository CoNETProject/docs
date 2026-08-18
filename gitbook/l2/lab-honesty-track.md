# Lab honesty track

**Evidence level: laboratory review.** This page records the 2026-08-17 CoNET-DLE MVP review, the 2026-08-18 clock + Explorer clock overlay, and the **2026-08-18T23:41Z runtime scrape** (~13.8h into the clock). It is **not** a production SDK, **not** a production signing specification, and **not** 30-day qualification.

Public site: [https://gitbook.conet.network/l2/lab-honesty-track.html](https://gitbook.conet.network/l2/lab-honesty-track.html)

Developer how-to: [L2 development](../developers/l2.md). Explorer facts: [DLE explorer](explorer.md). Controlling design: whitepaper revision **2026-08-18**.

## Status in one sentence

The laboratory **control plane** (P0–P11, M6–M7, P5) is live. The laboratory **honesty track** (P12–P22) is landed in the repository engine and unit tests (`npm run runtime:test` **159/159**). **P23** keep-data deploy evidence is landed: **6/7 `LIVE_OK`**, fd-01 new-chain **409 → accept**, official standby **fd-06 HTTP unstable** (later remapped). **P24** wires isolated `node.ts` to the same `officialStandbysReady` callback as `lab-cli`. **P25** lands Explorer Certificates + Home **non-green** overlays for `officialStandbysReady` / `hashIndexCommittedInAc`. The public SPA on [dle.conet.network](https://dle.conet.network/) now serves `index-C8IdTq4H.js` (published 2026-08-18T10:15:00Z; `explorer:test` **10/10**; replaced pre-clock `index-U1o9ul_I.js`). **Clock started 2026-08-18T09:53:58.092Z** (`pilotRunning=true`, `pilotQualified=false`, `clockIsNotQualification=true`). Home + Certificates show a **non-green** clock chip. Green pills stay `seatingQualified === true` only. **Runtime scrape 2026-08-18T23:41Z (~13.8h / ~1.92% of 30d):** 8/8 HTTP OK + clock-aligned + seating `QUALIFIED`; `pilotQualified` still false; `lastQuorumOk` **6/8** (fd-02 false peer=5; fd-07 false **peer=0**); this scrape omitted `leafCount` / `officialStandbysReady` / AC roots on all eight hosts — **missing fields ≠ zero / empty inventory**. This is **not** 30-day qualification. Next: **continue 30-day wait / review**. Do **not** invent P26.

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
| P22 | `ArchiveStandbyReadiness`; extra `fd-08` does not count | Production OperatorDomain |
| P24 | Isolated `node.ts` uses the same `officialStandbysReady` callback as `lab-cli` | Production OperatorDomain; `sync.start()` against dummy peer URLs |
| P25 | Explorer Certificates + Home **non-green** overlays for `officialStandbysReady` / `hashIndexCommittedInAc` | Changing seating green pills; painting overlays as production AC / 30-day |
| Clock overlay (not P26) | Home + Certificates **non-green** `pilotClockPill`; public SPA `index-C8IdTq4H.js` | Claiming 30-day qualification; inventing P26 |

`lab-cli` and isolated `node.ts` may return `409` `ERR_NEWCHAIN_STANDBY_NOT_READY` until two official standbys are ready. Isolated `node.ts` does **not** start the seating tick and does **not** freeze inventory.

## P23 live keep-deploy (landed, honest 6/7)

`npm run lab:deploy-g1-keep` (keep-data; merge G1+G2 `planeDirectory`; do **not** restart G2) put the P12–P22 binary on the official G1 roster.

| Host | Deploy | Overlay |
| --- | --- | --- |
| fd-01 … fd-05, fd-07 | `LIVE_OK` | `seatingEip712` / `challengeEip712` / `bftEip712` / `ondemandEip712` / `standbyReadyEip712` under `health.syncQualification` |
| fd-06 official standby | `STARTED` after hung-lab-cli SIGKILL; **no** `LIVE_OK`. Keep-data retry still missed liveness | `/liveness` and `/health` timeout (event-loop starve). **Not** a stable official standby host |

fd-01 `POST /newchain/request` walked **409** `ERR_NEWCHAIN_STANDBY_NOT_READY` (`officialStandbyReadyCount=0` at `2026-08-17T23:13:41.428Z`) → **200** accept (`requestId` `0xe8229f1635d681d5b48430b5cd4a09e2c7787d4e4338a60c512ce9ab9d81b472`, `count=2` at `2026-08-17T23:18:22.095Z`).

`officialStandbysReady` is **not** a durable seven-host true. After the accept window, some LIVE_OK hosts dropped back to `count=0` when inventory roots drifted. Extra `fd-08` stays unofficial. G2 BFT/ondemand stay off. Evidence: CoNET-DLE `pilot/evidence/conet-dle-p23-live-2026-08/`.

Do **not** treat unit tests alone as the live proof, and do **not** write “seven hosts already cut over and stay healthy.”

## P24 isolated `node.ts` gate (landed)

`startArchiveNode` now passes the same `officialStandbysReady` callback into `createNewChainEngine` as `lab-cli` `syncHolder`. Extra `fd-08` still does not count. Isolated `node.ts` does **not** `sync.start()` and does **not** apply inventory freeze. Test: CoNET-DLE `runtime/test/node-standby-gate.test.ts`. Full `npm run runtime:test` was **154/154** at P24; current engine/tests are **159/159**.

This is **not** a live seven-host redeploy and **not** 7/7 healthy.

## P25 Explorer overlays (landed)

Explorer Certificates + Home show **non-green** read-only chips for `officialStandbysReady` / `hashIndexCommittedInAc` (`explorer/src/lib/labOverlays.ts`). Green seating pills stay `seatingQualified === true` only (`archiveSeating.ts` unchanged). Missing overlay fields omit the chip.

This is **not** production AC commitment, **not** seating, and **not** 30-day qualification.

**P25 seating-copy honesty (same gate, not P26):** Home Seating gauge and archive detail must say **lab EIP-712 seated**, never **lab HMAC**. Green pills stay `seatingQualified === true` only. This is leftover P12 display honesty, **not** a new serial gate.

The first P25 public SPA was `index-U1o9ul_I.js` (2026-08-18T00:18:49Z). That bundle is **historical**. The current public SPA is the later clock-overlay publish below.

## Clock + Explorer clock overlay (2026-08-18, not P26)

Operator authorized `lab:start-pilot-clock`. Live `pilotStartedAt=2026-08-18T09:53:58.092Z` (`warmupStartedAt=2026-08-14T17:10:16.786Z`). `/health` shows `pilotRunning=true`, `pilotQualified=false`, `clockIsNotQualification=true`. Counters stay `0`.

Explorer Home + Certificates show a **non-green** `pilotClockPill` (`30-day clock running (not qualified)` when running; `30-day clock not started` when explicit null). Missing clock fields omit the chip. `pilotQualified: true` is ignored. The clock chip is never green.

Tests: `npm run explorer:test` **10/10**. Runtime tests: `npm run runtime:test` **159/159**. Pilot tests: **19/19**.

**Public SPA publish (not P26):** parent-repo `scripts/deployDleExplorer.sh` rsynced the clock-overlay bundle to `70.35.205.77:/var/www/dle.conet.network/` and reloaded the explorer nginx vhost only. [dle.conet.network](https://dle.conet.network/) now serves `index-C8IdTq4H.js` (2026-08-18T10:15:00Z). It did **not** restart EL/CL/validator and did **not** change archive seating.

Starting the clock and painting the clock are **not** 30-day qualification. Do **not** invent P26.

## Runtime scrape (~13.8h into clock, 2026-08-18T23:41Z)

Direct `GET :27101/health` on official 7 + extra `fd-08` (not a new serial gate; not P26):

| Check | Result |
| --- | --- |
| HTTP OK / `pilotRunning` / clock aligned | **8/8** |
| `pilotQualified` | **0/8** true |
| Seating `QUALIFIED` / `seatingQualified` | **8/8** |
| `lastQuorumOk` | **6/8** — fd-02 false (`lastPeerOk=5`); fd-07 false (`lastPeerOk=0`) |
| `leafCount` / `officialStandbysReady` / `lastACRef` / `hashIndexRoot` | **omitted** on all eight this scrape — do **not** treat omit as `0` / false / empty inventory (clock-start evidence had leaf **9750** on most seats) |
| `bftProcessStarted` | **false** on all eight |
| Public SPA | still `index-C8IdTq4H.js` |

Evidence JSON: CoNET-DLE `pilot/evidence/conet-dle-p23-live-2026-08/runtime-review-2026-08-18T2341Z.json`. Canvas archive: BeamioContract `src/canvas/dle-mvp-runtime-review-2026-08-18.md`.

fd-07 `peer=0` is a **reachability watch**, not seating eviction and **not** authorization to auto-promote standby. Public nginx upstream only rotates active keepers; a single public `/health` hit must not be read as the whole fleet.

## Next laboratory gates

No further serial Explorer overlay gate is open. Remaining work is **30-day wait / review** (wall clock toward about `2026-09-17T09:53:58.092Z`). Do **not** invent P26. Do **not** claim qualification.

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
