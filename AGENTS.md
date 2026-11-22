# AGENTS.md

- Purpose: A browser-based website that runs Monte Carlo simulations of ETF portfolios under different investment strategies (e.g. lump sum vs. DCA) and visualizes the distribution of outcomes.

## Orientation

Keep the docs up to date when something changes.

| Document                 | Why                                                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `README.md`              | User facing description. Keep up to date.                                                                         |
| `docs/architecture.md`   | Architecture overview                                                                                             |
| `docs/glossary.md`       | Definitions of domain terms                                                                                       |
| `docs/known-pitfalls.md` | if you encounter problems or pitfalls add them here, either to avoid them in the future or for us to fix later on |
| `docs/specs/README.md`   | Index of feature specs with their status, conventions and template                                                |

## Project

- Stack: TypeScript, React, Vite, Tailwind + shadcn/ui (Radix, sonner, Recharts), TanStack Query, Zod; Bun (via mise) for packages/scripts, Biome, Vitest, Playwright
- Test: `bun run test` (unit) · `bun run test:e2e` (browser) · Lint: `bun run lint` (fix: `bun run format`) · Typecheck: `bun run typecheck` · Run: `bun run dev`
- Screenshots: `bun run screenshots` regenerates `docs/screenshots/*.png` (pages listed in `e2e/screenshots.spec.ts`); use them in the README and attach them to PRs with UI changes.

## Principles

> [!NOTE]
> These are no absolutes, decide when it's appropriate to apply them.

- Follow SOLID principles: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.
- Decide when it's appropriate to apply DRY, YAGNI and KISS.
- spec-first, TDD (red → green → refactor), BDD acceptance criteria. DDD only where the domain warrants it; always use domain terms (`docs/glossary.md`).

## Tiers

0. No behavior change → tests pass.
1. Bug (code violates a REQ) → regression test referencing the REQ, then fix.
2. Small feature or spec gap → `spec.md` first. A wrong or missing spec is a spec change, not a bug.
3. Large or architectural → `spec.md` + `plan.md` (with tasks)

## Specs

`docs/specs/NNN-name/`. IDs are `REQ-NNN-XX`: never reused, deprecated rather than deleted, and referenced in tests. Spec and code change together.

- `spec.md`: Status, Goal, Requirements (Given/When/Then), Out of scope, Assumptions, Verification (REQ | test | result). No implementation details.
- `plan.md`: Approach, Tasks (linked to REQs).

## Definition of Done

- Every REQ in scope has a test that you saw fail, then pass.
- Full test suite and lint run in this session and pass.
- Verification table and spec status updated.
- No unrelated changes.
- If there's UI changes, attach screenshots to the PR to illustrate the changes.
- Summary: tier, REQs touched, results, open issues.

## Git

Stay on the current branch. commit or push only if explicitly asked for.

## Note

For issues and pull requests you create put the following note at the top of the description:

```md
> [!Note]
> 🤖 {Model e.g. Claude Opus 5.5} writing on behalf of {Human}
```
