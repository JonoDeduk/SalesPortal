# After cloning this template

This repo is a generic starting point. Work through the checklist below to turn it
into your actual project. Delete this file (`TEMPLATE.md`) once you're done.

## Checklist

- [ ] **Rename the package.** In `package.json`, set `name` and `description` to your
      project (currently `project-template`). Run your package manager's install so
      `package-lock.json` (or your lockfile) picks up the new name.

- [ ] **Fill in `CLAUDE.md`.** Replace the three `TODO` sections — *Project State*,
      *Building & Running*, *Architecture* — with your project's real details, and
      remove the template blockquote at the top. Keep or trim the "Template machinery"
      section as you like.

- [ ] **Choose and write your standards.** In `.claude/standards/`:
      - Read `examples/` for reference on tone/shape, then **delete it**.
      - Write your own standards as top-level `.md` files for the stack you actually use.
      - See `.claude/standards/README.md`.

- [ ] **Set the agent's feedback loops.** `.sandcastle/prompt.md` defaults to
      `pnpm run test` and `pnpm run typecheck`. Update those commands (package manager
      and script names) to match your `package.json`, or remove them until they exist.

- [ ] **Pick the agent model.** `.sandcastle/main.ts`, `interactive.ts`, and `test.ts`
      reference a Claude model id (default `claude-opus-4-6`). Update to your preferred
      current model.

- [ ] **Update the README.** Rewrite `README.md` to describe *your* project. The
      current version describes the template.

- [ ] **Configure `.env`.** Run `npm run init` to create `.sandcastle/.env` from
      `.sandcastle/.env.example`. Add any project-specific keys to the example file first.

- [ ] **Sanity-check tooling.** `tsconfig.json` and the harness assume Node/TypeScript.
      If your project isn't TypeScript, keep this config for the `.sandcastle/` harness
      but add your project's own build tooling alongside it.

- [ ] **Clean up IDE files.** IntelliJ/`.idea` module files may still reference the
      template name; regenerate them from your IDE if needed.

- [ ] **Delete this file** (`TEMPLATE.md`) when the checklist is complete.
