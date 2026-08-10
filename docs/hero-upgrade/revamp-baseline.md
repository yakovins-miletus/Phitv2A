# Pre-change floor: hero revert + 3D playground revamp (2026-08-10)

**git HEAD:** 169ed2f | **git status:** clean

## Build results

| Command | Exit Code | Result |
|---------|-----------|--------|
| `yarn typecheck` | 0 | ✓ Pass |
| `yarn lint` | 1 | 27 errors, 210 warnings (237 total); 198 are `no-restricted-syntax` |
| `yarn test` | 1 | 3 failed / 211 passed (214 tests across 21 files) |

## Lint details

**ESLint summary:** 27 errors, 210 warnings

- **Total errors:** 27
  - 2 × `@typescript-eslint/no-explicit-any`
  - 1 × React Compiler `react-compiler/preserve-manual-memoization`
  - 24 × React hooks (`react-hooks/refs`, `react-hooks/set-state-in-effect`)
  
- **Total warnings:** 210
  - 198 × `no-restricted-syntax` (raw hex colors, raw cubic-bezier values)
  - 12 × other

## Test details

**Vitest summary:** 211 passed, 3 failed out of 214 tests in 21 files

### Failing tests

1. **tests/home-reduced-motion.test.tsx > reduced motion: every pitch section is reachable, not just the first**
   - Error: Unable to find an accessible element with the role "heading" and name "Elite Technical Talent"

2. **tests/home-route.test.tsx > home route loads via the router: hero, services, new visual sections**
   - Error: Unable to find an accessible element with the role "heading" and name "Technical Talent"

3. **tests/motion/ground-stops.test.ts > home page stops use lightmode grounds**
   - Error: blog (#0A2A66): expected 39.528800000000004 to be greater than 200

## How to repeat this

From the repo root:

```bash
yarn typecheck
yarn lint
yarn test
```

All three commands produce deterministic output for the baseline. Any changes to these counts or test failures indicate movement from this floor.
