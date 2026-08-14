# L1 decentralization and verifiability

**Evidence level: Production reference.** The measurements on this page are live contract views and Explorer facts. They describe what an outsider can reproduce today. They are not a claim that CoNET L1 is maximally decentralized, that unique addresses are independent operators, or that a running network is automatically a diverse one.

A live chain is evidence of **operation**. Decentralization requires additional public facts: who may join, who may change protocol state, how stake and geography concentrate, and which clients actually produce blocks.

## What this page does and does not measure

| Question | What is published here | What is not inferred |
| --- | --- | --- |
| Is L1 running? | Yes. Explorer reports continuous block production on `chainId` **224422**. | Continuous blocks do not prove operator independence. |
| How many consensus validators are staked? | `ValidatorDepositRedeem.totalStakedValidatorCount()` | That count is not a Guardian count and not a live-miner count. |
| How is validator stake sized? | Each counted validator is **32 CNET** (`VALIDATOR_STAKE_WEI`). | Uniform per-validator stake does not prove independent operators. |
| How many Guardian service nodes are registered? | `GuardianNodesInfoV6.getAllNodes` length and `getUniqueOwnerCount()` | A unique owner address is not a unique legal or infrastructure operator. |
| Where are Guardians labeled? | `getAllRegions()` and `getRegionNodes(region)` | Region labels are registry strings, not ASN, hosting, or jurisdiction proofs. |
| Which clients produce blocks? | The documented production stack is **Geth + Prysm**. | No public client-diversity census (Lighthouse, Teku, Nethermind, Reth, and so on) is published for this chain. |
| Who governs mutations? | Guardian writes are `adminList`-gated. ValidatorDepositRedeem is a UUPS proxy with admin-gated upgrades. Treasury miner quorum is a separate owner-managed set. | There is no published token-vote or DAO that elects L1 validators. |

Do not collapse these ledgers:

- **L1 validators** — proof-of-stake consensus participants.
- **Guardian Nodes** — DePIN registry identities.
- **Runtime miners / SI listeners** — currently reachable service processes.
- **Treasury miners** — the allowlisted set that votes on TreasuryBridgeV3 operations.

## Observed snapshot

The following values were read from `https://rpc1.conet.network` at **2026-08-14T04:16:17Z**, CoNET L1 block **831043**. Re-read the same views for a current figure. Do not treat this table as a constant.

| Measurement | Value | Source |
| --- | --- | --- |
| Explorer average block time | 6.0 s | `GET https://mainnet.conet.network/api/v2/stats` |
| Staked L1 validators | **475** | `ValidatorDepositRedeem.totalStakedValidatorCount()` |
| Validator deposit unit | **32 CNET** | `VALIDATOR_STAKE_WEI` |
| Funded validator deposits | **15,200 CNET** | `fundedDepositTotal()` (= 475 × 32) |
| Registered Guardian IPs | **472** | `getAllNodes(start, 1)` last occupied index + 1 |
| Unique Guardian owner addresses | **472** | `getUniqueOwnerCount()` |
| Guardian regions | **7** | `getAllRegions()` |
| Treasury miner set | **4** addresses | `TreasuryBridgeV3.miners()` |
| Treasury execution quorum | **3** | `requiredVotes()` = `ceil(2N/3)` for N = 4 |
| Treasury owner | `0x87cAeD4e51C36a2C2ece3Aaf4ddaC9693d2405E1` | `owner()`; this address is also one of the four miners |

`475` validators and `472` Guardian IPs are close but **not the same number**. Do not report one as the other.

## Validator stake

`ValidatorDepositRedeem` at [`0xc71e246DD78B37C2fABc905D340932F28F503433`](https://mainnet.conet.network/address/0xc71e246DD78B37C2fABc905D340932F28F503433) is the UUPS proxy for validator deposits and beneficiary binding. The implementation is verified on the Explorer as `ValidatorDepositRedeem`.

Protocol facts that can be checked without trusting this page:

```bash
RPC=https://rpc1.conet.network
VDR=0xc71e246DD78B37C2fABc905D340932F28F503433

cast call $VDR "totalStakedValidatorCount()(uint256)" --rpc-url $RPC
cast call $VDR "VALIDATOR_STAKE_WEI()(uint256)" --rpc-url $RPC
cast call $VDR "fundedDepositTotal()(uint256)" --rpc-url $RPC
```

Because every counted validator uses the same 32 CNET unit, **address-level stake is uniform per validator**. Concentration, if it exists, is therefore an **operator- or key-control** question, not a “some validators posted 10,000 CNET and others posted 32 CNET” question.

The deposit-contract pointer on this proxy currently reads `0x4242424242424242424242424242424242424242`, the conventional consensus-layer deposit address used by the Prysm / Ethereum-style stack. That value identifies the consensus deposit path. It is not a CoNET application treasury.

The Explorer’s generic `GET /api/v2/validators` route is **not available** for this chain type (`Endpoint not available for current chain type`). A per-pubkey CL-reward JSON exists at `https://beamio.app/api/v2/conet/validators/{pubkey}` for already-known BLS keys. It is not a validator-set census.

## Guardian independence and geography

`GuardianNodesInfoV6` at [`0xBC6b53065b5647261396d002bDBA0d3396E0722f`](https://mainnet.conet.network/address/0xBC6b53065b5647261396d002bDBA0d3396E0722f) is verified on the Explorer. `addNode`, `removeNode`, and related mutations require `adminList`.

```bash
RPC=https://rpc1.conet.network
G=0xBC6b53065b5647261396d002bDBA0d3396E0722f

cast call $G "getUniqueOwnerCount()(uint256)" --rpc-url $RPC
cast call $G "getAllRegions()(string[])" --rpc-url $RPC
cast call $G "getRegionNodes(string)(string[])" "PA.US" --rpc-url $RPC
```

`getUniqueOwnerCount()` returns the length of the on-chain `_ownerList`. At the snapshot above, unique owners equal registered IPs (**472 = 472**). That is a strong **address-level** statement: the registry did not show multi-IP owners at that block. It is still a weak **operator-independence** statement. One person, company, or hosting account can control many addresses.

Region labels and IP counts at the same snapshot:

| Region label | Registered IPs | Share of 472 |
| --- | ---: | ---: |
| `PA.US` | 153 | 32.4% |
| `BW.DE` | 103 | 21.8% |
| `LND.GB` | 98 | 20.8% |
| `MD.ES` | 85 | 18.0% |
| `NW.DE` | 26 | 5.5% |
| `ND.US` | 4 | 0.8% |
| `NJ.US` | 3 | 0.6% |

The three largest labels (`PA.US`, `BW.DE`, `LND.GB`) held **354 / 472** IPs (**75.0%**). That is geographic concentration of **registry labels**, not a proven hosting or legal-entity concentration.

## Client diversity

Public evidence for the current L1 stack is a **single execution / consensus pair**:

| Layer | Documented client family |
| --- | --- |
| Execution | Geth |
| Consensus | Prysm `beacon-chain` |
| Validator client | Prysm `validator` |

Shared read-only beacon hosts in the current operations inventory run Geth 1.17.x with Prysm v7.1.x. That inventory is an operations fact, not a complete public validator census, and it does not introduce a second client family.

No Explorer API on this chain currently publishes a validator client-diversity breakdown. Until a second production EL/CL pair is documented and observed, **client diversity must be described as unpublished / single-family**, not as “diverse because many validator keys exist.”

## Governance

L1 has several control planes. They are not one committee.

### Guardian registry

- Admission and removal are `requireAddressInAdminlist`.
- The constructor sets `adminList[msg.sender] = true`.
- Later admins are added or removed by an existing admin (`changeAddressInAdminlist`).
- Registration is therefore **permissioned**, even though the resulting node list is publicly readable.

### Validator deposit / redeem

- The canonical address is an ERC-1967 proxy.
- Implementation upgrades use UUPS `_authorizeUpgrade` under the contract admin role.
- `addAdmin` / `removeAdmin` and redeem-admin roles are explicit privileged functions.
- Validator **stake size** is a constant (32 CNET). Validator **membership** still depends on deposit, registration, and admin-gated bindings such as `registerNodeValidators`.

### Cross-chain Treasury

[`TreasuryBridgeV3`](cross-chain-treasury.md) at `0xa208982212978550594A7FEEB70a61665d129003` uses an owner-managed miner list, not the 472 Guardian owners.

At the snapshot above:

- four miner addresses;
- quorum **3**;
- `owner()` equals the first miner.

That quorum governs Treasury policy and bridge operations. It does **not** vote L1 blocks. Do not present the 472 Guardian owners as the live Treasury voter set. The historical `ConetTreasury.requiredVotes` comment on `getUniqueOwnerCount` describes a deprecated treasury path.

### What is not published as L1 governance

- No token-weighted vote that seats or removes L1 validators.
- No public operator-domain registry on L1 equivalent to the DLE `OperatorDomainRegistryV1` specification.
- No published Nakamoto coefficient, hosting-provider table, or legal-entity map.

Those absences are part of the current public record. They should be stated, not filled with estimates.

## How to reproduce the snapshot

1. Confirm `chainId` **224422** on `https://rpc1.conet.network` (backup `https://publicrpc.conet.network`). Do not use deprecated `https://rpc.conet.network`.
2. Read the Explorer contract pages and confirm `is_verified` or `is_partially_verified` for the Guardian registry, the VDR proxy, and the VDR implementation.
3. Call the view functions listed above. Compare `fundedDepositTotal / 32 ether` with `totalStakedValidatorCount`.
4. Page `getAllNodes(start, 1)` until the first empty start index; that index is the Guardian IP count.
5. Sum `getRegionNodes` lengths and confirm they equal the Guardian IP count.
6. Treat any failed RPC or Explorer response as **untrusted**. Do not overwrite a previous successful read with zero.

## Source anchors

- [`GuardianNodesInfoV6`](https://mainnet.conet.network/address/0xBC6b53065b5647261396d002bDBA0d3396E0722f) — verified registry; public source also in [beamio-APP/BeamioContract](https://github.com/beamio-APP/BeamioContract)
- [`ValidatorDepositRedeem` proxy](https://mainnet.conet.network/address/0xc71e246DD78B37C2fABc905D340932F28F503433) — `totalStakedValidatorCount`, `VALIDATOR_STAKE_WEI`, `fundedDepositTotal`
- [`TreasuryBridgeV3`](https://mainnet.conet.network/address/0xa208982212978550594A7FEEB70a61665d129003) — miner quorum, not L1 consensus
- [Validators](validators.md) — consensus role boundary
- [Guardian Nodes](guardian-staking.md) — DePIN role boundary
- [Resources](../resources.md) — public git map
- [CoNET-DLE operator-domain spec](https://github.com/CoNET-project/CoNET-DLE/blob/main/src/whitepaper/DLE-OperatorDomainRegistryV1-Spec.md) — L2 identity/correlation design; not an L1 census

## Next

[Guardian Nodes →](guardian-staking.md)
