# Contributing to torhunt

torhunt stays small on purpose. The best way in is to read the code you're about to touch, match how it already works, and keep your change tight.

## Set up

```sh
git clone <repo-url>
cd torhunt
npm install
npm run dev
```

`npm run dev` runs the live TUI through tsx, no build step.

## Before you submit a change

Run these and make sure they're clean:

```sh
npm run typecheck   # tsc --noEmit, zero errors
npm test            # vitest, all green
```

## Standards

### Match the existing grain

Reuse what's there before you write something new. Cursor movement goes through `wrapStep` (`src/ui/move.ts`). Key hints live in the `Hint` / `HELP_GROUPS` / `footerHints` system (`src/ui/keymap.ts`). Shared app state is the `Store` interface (`src/ui/store.ts`).

If you catch yourself adding a parallel way to do something the codebase already does, stop and use the one that's already there.

### Stay additive, never break muscle memory

People already have the current keys in their fingers. New behavior should layer on, not overwrite. If your change retrains an existing key, it needs a real reason.

### Cross-platform or it doesn't ship

torhunt runs on Windows, macOS, and Linux, so anything that touches the OS must handle all three. See `writeClipboard` in `src/util/clipboard.ts` for the pattern: powershell on win32, pbcopy on darwin, then wl-copy/xclip/xsel on linux.

### Fail soft, never crash

When something the user can't control goes wrong, degrade gracefully and say so. Print a friendly message and exit cleanly. Return `false` and surface a notice when a tool is missing. Never throw when a fallback exists.

### Test the logic

Non-trivial logic gets a vitest test. Pure functions are easy — see `src/util/format.test.ts`. For code that shells out, mock the node built-in — see `src/util/clipboard.test.ts` mocking `node:child_process`.

### Wire the UI surface

torhunt shows one contextual footer plus a `?` cheatsheet, never a wall of commands. When you add a key:

- Update both halves of `src/ui/keymap.ts`: `HELP_GROUPS` (the `?` sheet) and `footerHints` (the footer).
- Add a matching entry to `makeStore` in `scripts/render-previews-impl.tsx` so preview generation doesn't break.

## Commits

- Use [Conventional Commits](https://www.conventionalcommits.org) prefixes: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`.
- Say why, not just what. The diff already shows the what.
- One concern per commit. Two unrelated ideas are two commits.
