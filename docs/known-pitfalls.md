# Known pitfalls

Problems hit during development — either to avoid them in the future or to fix later on.

| Pitfall                                                       | Symptom                                                                                                                       | Workaround / fix                                                            | Status     |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------- |
| Vitest `forks` pool under the Bun runtime (no Node installed) | `child.channel?.unref is not a function`, no tests run                                                                        | `pool: "threads"` in `vite.config.ts`                                       | workaround |
| TypeScript 7 removed `baseUrl`                                | `TS5102: Option 'baseUrl' has been removed`                                                                                   | Use `paths` only                                                            | fixed      |
| `shadcn add` without `shadcn init`                            | Generated components import `cn` from the npm package `"cn"` instead of `@/lib/utils`, and no theme CSS variables are written | Fix the import after adding a component; theme vars live in `src/index.css` | open       |
