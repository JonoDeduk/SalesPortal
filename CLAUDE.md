# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Fill this in per project.** This repo is a template. The sections below describe
> the template's own machinery, plus `TODO` placeholders you must replace with your
> project's specifics once you know the stack. Delete this blockquote when you do.

## Template machinery (keep this section, or trim it once you're comfortable)

This repository ships with an agent harness so an AI agent can pick up GitHub issues
and work them autonomously. It is stack-agnostic — none of it assumes a particular
language or framework.

- **Sandcastle** (`.sandcastle/`) runs an agent against this repo. `main.ts` runs it
  in a Docker sandbox over the open GitHub issues; `interactive.ts` runs it locally
  without a sandbox; `test.ts` is a minimal smoke test. The agent's working
  instructions live in `.sandcastle/prompt.md`.
- **Run the agent:** `npm run sandcastle` (see `README.md` for setup).
- **Init:** `npm run init` reads `.sandcastle/.env.example` and writes `.sandcastle/.env`.
- **Standards:** `.claude/standards/` is where per-project coding standards go. It
  currently holds an *example* set (see `.claude/standards/README.md`) — replace or
  delete them for your project.

## Project State

TODO: Describe what this project is and its current stage. Replace this whole section.
_Example: "Early-stage TypeScript web app. Vite + React frontend, no backend yet."_

## Building & Running

TODO: Document the real build/run/test commands once a build tool is chosen.
_Example:_

```bash
# Install
<package-manager> install

# Dev
<package-manager> run dev

# Test / typecheck
<package-manager> run test
<package-manager> run typecheck
```

> Note: `.sandcastle/prompt.md` currently assumes `pnpm run test` and
> `pnpm run typecheck` as its feedback loops. Update it to match whatever you put here.

## Architecture

TODO: Describe the entry points and how the code is organized. Replace this section
once there is code to describe.
