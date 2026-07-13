# Coding standards

This directory holds the coding standards for **this project**. Agents and humans
working in the repo should read them before writing or reviewing code.

**This is a template, so this directory starts empty of real standards.** Write your
project's standards as flat Markdown files here (e.g. `typescript.md`, `python.md`,
`api.md`) once you've chosen a stack. Keep them short and specific — they're read as
context by the agent harness.

## `examples/` — replace per project, do not inherit blindly

The `examples/` subdirectory contains a **stack-specific** set of standards carried
over from a previous project (a React + Zustand + single-global-CSS frontend written
in TypeScript). They are kept only as a worked example of the *shape* and *tone* a
good standards file has.

⚠️ **They are NOT active commitments for your project.** If your project doesn't use
React, Zustand, or that CSS approach, these will actively mislead you and the agent.

When you start a new project:

1. Read `examples/` for reference on how to write a standard.
2. Delete `examples/` (or the files in it you don't want).
3. Write your own standards as top-level files in this directory.

Nothing in the repo auto-loads `examples/`; they only matter if a human or agent
opens them, so an unused stack won't silently leak in — but delete them anyway to
avoid confusion.
