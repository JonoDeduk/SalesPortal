# Project Template

A stack-agnostic starting point for a new project, pre-wired with the
[Sandcastle](https://github.com/mattpocock/sandcastle) agent harness so an AI agent
can pick up GitHub issues and work them autonomously.

**This is a template.** After cloning, work through [`TEMPLATE.md`](TEMPLATE.md) to
strip the placeholders and make it yours.

## Using this as a template

1. Click **Use this template** on GitHub (or fork it).
2. Clone your new repo:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   cd YOUR_REPO_NAME
   ```
3. Follow the **Setup** steps below, then the checklist in [`TEMPLATE.md`](TEMPLATE.md).

## What's in here

- `.sandcastle/` — the agent harness (runner, Docker sandbox, agent prompt). Generic;
  keep it.
- `scripts/init.sh` — interactive `.env` setup. Generic; keep it.
- `.claude/standards/` — where your project's coding standards go. Ships with an
  *example* set to replace; see [`.claude/standards/README.md`](.claude/standards/README.md).
- `CLAUDE.md` — guidance for Claude Code, with per-project `TODO` placeholders.
- `package.json` / `tsconfig.json` — Node/TypeScript config for the harness itself.
  Swap in your project's real build tooling when you pick a stack.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the init script to configure your environment:
   ```bash
   npm run init
   ```
   This reads `.sandcastle/.env.example` and prompts you for each required key, writing the result to `.sandcastle/.env`.

## Running

Start the Sandcastle agent:
```bash
npm run sandcastle
```

## Environment Variables

See `.sandcastle/.env.example` for the full list of required keys. Never commit `.sandcastle/.env` — it is gitignored.
