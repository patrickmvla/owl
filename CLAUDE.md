@AGENTS.md

# Owl Project Rules

## Sub-Agent Rules

- **Always use Sonnet** (`model: "sonnet"`) for sub-agents unless explicitly told otherwise
- When encountering ANY Hono issue (types, middleware, routing, OpenAPI, adapters), spawn a sub-agent to query the Hono docs before guessing:

```
Agent prompt: "Read docs/hono-llms.txt and answer: [your question about Hono]"
```

- When encountering ANY Next.js issue, read the relevant guide in `node_modules/next/dist/docs/` first
- Never load `docs/hono-llms.txt` (14K lines) into the main context — always delegate to a sub-agent

## Reference Docs (for sub-agents only — never load into main context)

| Doc | Path | When to use |
|-----|------|-------------|
| Hono core docs | `docs/hono-llms.txt` | Hono routing, middleware, context, adapters |
| Hono Zod OpenAPI | `docs/hono-zod-openapi.md` | `@hono/zod-openapi` — `OpenAPIHono`, `createRoute`, `app.doc()`, schemas |
| Next.js docs | `node_modules/next/dist/docs/` | Any Next.js API, convention, or deprecation question |
| ADRs | `docs/adrs/` | Architecture decisions, tech choices, design rationale |

## Code Style

- Feature-based folder structure (ADR-006)
- No cross-feature imports except `features/real-time/stores/`
- Conventional commits with scopes: `auth`, `market`, `real-time`, `portfolio`, `watchlist`, `alerts`, `peg`, `correlation`, `settlement`, `api`, `db`, `ui`, `infra`, `relay`
- Dark mode primary, stark white accent, teal-green/warm-red financial colors
- `tabular-nums` on all number displays
- TypeScript strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`
