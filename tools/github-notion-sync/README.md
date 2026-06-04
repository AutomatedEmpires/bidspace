# GitHub → Notion Sync Worker

Mirrors every **issue** and **pull request** from `AutomatedEmpires/bidspace`
into a managed Notion database, refreshed on a schedule.

One direction only: this worker never writes to GitHub, so it can't corrupt
implementation truth. The reverse (Notion → GitHub) is the separate
`notion-github-issue-dispatcher` worker.

## What it does

- Declares one managed Notion database, `BidSpace — GitHub`, keyed on the
  GitHub `node_id` (unique across issues and PRs).
- `worker.sync("githubSync", { mode: "replace", schedule: "30m" })` re-fetches
  all issues and PRs every 30 minutes. `replace` mode prunes anything not seen
  in a cycle, so closed/deleted items fall out automatically.
- Two phases per cycle: issues first (PRs are filtered out of the issues
  endpoint), then pulls (needed to tell **Merged** apart from **Closed**).

## Database schema

| Property | Type | Source |
| --- | --- | --- |
| Title | Title | `#<number> <title>` |
| Node ID | Text (primary key) | GitHub `node_id` |
| Number | Number | issue / PR number |
| Type | Select | Pull Request / Issue |
| State | Select | Open / Closed / Merged |
| Author | Text | `user.login` |
| Labels | Text | comma-joined label names |
| Branch | Text | PR head ref (PRs only) |
| URL | URL | `html_url` |
| Created / Updated | Date | `created_at` / `updated_at` |

Properties defined in code are worker-controlled; you can add extra properties
in Notion and those stay editable.

## Configuration

Set via `ntn workers env set KEY=value` (or a local `.env`, see `.env.example`):

| Variable | Required | Notes |
| --- | --- | --- |
| `GITHUB_TOKEN` | yes | PAT with **repo: read** (fine-grained, scoped to the one repo is ideal). |
| `GITHUB_OWNER` | no | Defaults to `AutomatedEmpires`. |
| `GITHUB_REPO` | no | Defaults to `bidspace`. |

## Develop / deploy

```bash
pnpm --filter @bidspace/github-notion-sync check        # tsc --noEmit
pnpm --filter @bidspace/github-notion-sync build        # emit dist/ for hosted deploys
ntn doctor                                              # validate the worker
ntn workers sync trigger githubSync --preview           # dry run, writes nothing
ntn workers deploy                                      # creates the managed DB
ntn workers sync trigger githubSync                     # first real sync
```

> ⚠️ Deploying Notion Workers requires a **Business plan or above**. The CLI and
> local testing work on any plan; hosted deploy does not.

## Notes

- This package is intentionally **not** in the root `pnpm-workspace.yaml`; it
  type-checks standalone via its own `check` script. `build` emits `dist/` for
  hosted `ntn workers deploy`.
- `workers.json` records the Notion workspace ID. After the first `ntn workers
  deploy`, the generated `workerId` will be written back to this file and
  committed.
