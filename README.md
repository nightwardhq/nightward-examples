# Nightward examples

Runnable, minimal examples of instrumenting an AI provider with the [Nightward](https://nightward.io)
SDKs — attribute every provider call to an actor, see attributable spend, catch abuse.

> **This repository is generated.** It is mirrored automatically from the Nightward monorepo on every
> change. Each example is compiled and smoke-tested against the real SDK in CI, and the snippets shown in
> our docs are extracted from these exact files — so what you copy is what we test. **Please don't send PRs
> here**; open issues instead (fixes land upstream and sync back).

## Layout

| Example | What it shows |
|---|---|
| `node-openai` | OpenAI via `nw.fetch`, actor attribution with `withActor` (+ org id) |
| `node-anthropic` | Anthropic via the same `fetch` seam |
| `node-express` | Setting actor context once with Express middleware |
| `python-openai` | OpenAI via `nw.httpx_client()`, `with nw.actor(...)` (+ org id) |
| `python-anthropic` | Anthropic via the same transport seam |
| `python-fastapi` | Actor context via FastAPI/Starlette middleware |

## Running one

Node examples:

```bash
cd node-openai
npm install
# set NIGHTWARD_API_KEY and OPENAI_API_KEY, then run your app
```

Python examples:

```bash
cd python-openai
pip install -e .
# set NIGHTWARD_API_KEY and OPENAI_API_KEY, then run your app
```

Each example takes only `apiKey` — the hash salt and policy are resolved from the signed policy package the
SDK fetches with your key. Get a key by signing up at [nightward.io](https://nightward.io).
