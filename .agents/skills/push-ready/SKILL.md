---
name: push-ready
description: >-
  Repo-wide pre-commit/pre-push readiness checklist for the Atlass Fin monorepo.
  Use when the user asks to "verify everything is ready to commit and push"
  (ES: "verifica que todo esté listo para comitear y pushear"), or asks to commit
  and/or push changes. Runs the full quality gate, audits git hygiene and
  secrets, keeps docs aligned, and commits/pushes safely. Global skill: applies
  to client/, api/ and root.
---

# Atlass Fin — Push Readiness (global skill)

Normative. Keywords: **MUST** (required), **SHOULD** (recommended), **MAY** (optional).
This is a **repo-wide** skill; use it together with the `quality-rules` and
`test-quality` skills of the app you touched.

## When to use

Trigger phrases (any language): "verifica que todo esté listo para comitear y
pushear", "check everything is ready to commit and push", "¿está listo para
commitear?", "prepará el commit/push", or a direct request to commit and/or push.

## Guardrails (MUST)

- Treat "verify ... ready to commit/push" as a **verification** request: run the
  gate, inspect, and **report**. **Do NOT** commit or push until the user
  explicitly asks or confirms (e.g. "dale, comiteá y pusheá"). If the request
  itself explicitly includes committing/pushing, proceed once the gate is green.
- NEVER run `git config`, `git push --force`/`--force-with-lease`, `--no-verify`,
  `--no-gpg-sign`, `git reset --hard`, or amend a commit that was already pushed.
- NEVER commit secrets (`.env`, keys, tokens) or real financial data; only the
  demo seed and `demo@atlassfin.app` / `Demo1234!`.
- NEVER push to `main`/`master` without explicit confirmation; warn if the current
  branch is `main`/`master`.
- If a hook fails: fix the issue and create a **new** commit (never amend a failed
  one).
- Ignore `node_modules/`, `.next/`, `out/`, build artifacts, `android/**/build`,
  APKs and `.env` — they are git-ignored; flag them if they show up as stageable.

## 1. Inspect the working tree

```bash
git rev-parse --abbrev-ref HEAD
git status -sb                 # branch + ahead/behind
git status                     # staged / unstaged / untracked
git diff                       # unstaged
git diff --cached              # staged
git log --oneline -5           # match commit style
```

- Identify what SHOULD be in the change and what should not.
- Audit untracked files that would be added:
  `git ls-files --others --exclude-standard`. Flag generated artifacts,
  binaries, secrets or real data.

## 2. Run the full gate from the repo root (MUST all pass)

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

- These aggregate across `client/` and `api/` via `scripts/run-in-projects.sh`
  and skip projects that are not set up yet.
- This is exactly what the **pre-push** hook enforces; run it first so the push
  does not fail.
- If `format:check` fails: run `npm run format`, review the diff, then re-run
  `npm run format:check`.
- Report each command's result per project.

## 3. Hygiene and documentation

- No secrets, tokens or real financial data in the diff (NFR-SEG-007).
- Confirm `.gitignore` still covers new artifacts (e.g. new native/build output).
- If code contradicts `docs/*`, **align the docs in the same change**.
  - New/changed endpoint or DTO: update `docs/backend.md` §7 and both sides.
  - Client behavior/stack changes: update `docs/frontend.md`.
- Update the relevant `AGENTS.md` / skills if conventions or commands changed.

## 4. Commit (only when instructed)

- Stage the intended files (`git add <paths>`); keep unrelated changes out.
- Commit message: English, conventional, focused on **why**, matching the repo
  style from `git log` (e.g. `feat(client): add android build script`).
- Do not commit `.env*` or secrets; warn the user if they ask you to.
- Run `git commit`; if the hook fails, fix and create a new commit.

## 5. Push (only when instructed)

```bash
git status -sb
git push                    # first push of a new branch: git push -u origin <branch>
```

- Ensure the branch tracks a remote; use `-u` on the first push.
- Never force push. If the branch is `main`/`master`, stop and confirm.

## 6. Pull request (optional)

If asked, open it with `gh pr create` following
`.github/pull_request_template.md` and return the PR URL.

## 7. Report back

Summarize concisely: current branch, gate results (per project), notable diffs,
docs updated, and — when done — commit hash/message, push result and PR URL.
Explicitly call out anything that is **not** ready.
