# WS-14 — Clear the lint backlog, make `lint` a real gate

**Owner files (exclusive):** none permanently — this workstream touches many files with
**mechanical, non-behavioural** edits only. Coordinate by running it when no other
workstream is mid-flight, or by taking the files no active workstream owns.
**Exception:** the four diagram files are **WS-07's** — it clears their `react-hooks/refs`
errors as part of its own work. Do not touch them here.
**Depends on:** nothing. **Agents:** Haiku to inventory, Sonnet to fix.

---

## Why

`yarn lint` has been failing for a long time. From `docs/perf-baseline.md` (2026-08-02),
recorded as **already failing before any of that work began**:

| Rule | Count |
|---|---|
| `react-refresh/only-export-components` | 11 |
| `typescript-eslint/no-unused-vars` | 3 |
| `typescript-eslint/no-explicit-any` | 3 |
| `react-hooks/exhaustive-deps` | 1 |
| `react-hooks/refs` | `SignalDiagram`, `ReachMap`, `PipelineDiagram`, `FollowTheSunDiagram` |
| `react-hooks/set-state-in-effect` | `useNavAutohide.ts:74` |
| | **30 errors, 12 warnings total** |

A permanently-red gate is the same as no gate. Nothing new is caught, because everything is
already failing. `react-hooks/exhaustive-deps` and `set-state-in-effect` in particular are
the class of bug that shows up as *"some bits of lag"* and stale UI — the symptom the brief
opens with.

## Target state

`yarn lint` exits 0, and stays that way because CI enforces it.

## Steps

1. Re-run `yarn lint` and capture the **current** counts — the table above is from August
   and will have drifted. Write the fresh inventory to `ws-14-lint-inventory.md`.
2. Fix by rule, lowest-risk first, one commit per rule so any regression is bisectable:
   - `no-unused-vars` — delete. Zero behavioural risk.
   - `react-refresh/only-export-components` — move non-component exports into sibling
     modules. Mechanical, but it moves imports; typecheck after each.
   - `no-explicit-any` — type properly. If a type is genuinely unknowable, use `unknown`
     with a narrowing guard, never a suppression comment.
   - `react-hooks/exhaustive-deps` — ⚠️ **the one with real behavioural risk.** Adding a
     missing dep can turn a run-once effect into a run-every-render effect. Read each case
     and fix the *logic*; do not blanket-add deps.
   - `set-state-in-effect` in `useNavAutohide.ts:74` — this is a render-loop smell in the
     navbar, which is on every page. Treat it as a real bug, not a lint nit.
3. Leave the four diagram files to WS-07.
4. Once green, wire `yarn lint` into CI as a blocking check. **Without this step the
   backlog simply regrows and the workstream was wasted.**

## ⚠️ Rules for this workstream

- **No `eslint-disable` comments.** Suppressing is not clearing. If a rule is genuinely
  wrong for this codebase, change the config once, centrally, with a comment explaining why.
- **No behavioural changes.** If a fix requires changing what the code *does*, stop and
  raise it — that is a bug fix belonging to its own workstream, not to a lint sweep.
- Typecheck and test after each rule group, not once at the end.

## Verification

```bash
cd " Master P Frontend/Phitv2A" && yarn lint && yarn typecheck && yarn test && yarn build
```

- `yarn lint` exits 0 with zero errors and zero warnings.
- `grep -rn "eslint-disable" src/` — no new suppressions versus the starting count.
- Full test suite green.
- Manual smoke: navbar autohide still behaves (it's the `set-state-in-effect` site), and
  HMR still works after the `react-refresh` moves.
- CI config shows lint as a blocking step.

## Out of scope

The four diagram files (WS-07). Any behavioural fix a lint rule exposes — record it and
raise it separately. Formatting/Prettier churn.
