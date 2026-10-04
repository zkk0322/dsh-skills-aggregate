---
name: github-seo-evaluation-loop
description: Use when running recurring GitHub repository SEO evaluation, comparing broad Chinese search visibility over time, producing metrics evidence, weekly summaries, manual Baidu/Bing/AI search tasks, or deciding whether an SEO experiment should trigger another optimization round.
---

# GitHub SEO Evaluation Loop

## Overview

Use this skill to run the measurement half of an SEO loop: measure, compare, classify evidence, and recommend the next experiment. It is read-only for online repositories by default; it may write local metric files and summaries inside the SEO lab.

For detailed fields, templates, and automation prompts, read `references/evaluation-playbook.md`.

## Project Root Resolution

Resolve `<github-seo-lab-root>` from the current workspace or a path supplied by the user. Confirm it contains `06_METHOD/measurement-framework.md` and `07_METRICS/tracking-config.json` before running. If no matching root can be found, report the missing-root blocker or ask the user for the path; never assume a personal drive or username.

## Output Language

Write all human-facing outputs in Simplified Chinese by default.

- Use Chinese headings, explanations, conclusions, and recommendations in `weekly-summary.md`.
- Keep machine-readable column names, enum values, paths, repository names, command names, and API names unchanged when needed.
- In `manual_tasks.csv`, keep headers and enums stable, but write `skip_reason` and `notes` in Chinese.
- JSON keys may remain machine-readable English; if human interpretation is needed, add a Chinese Markdown companion such as `query-validation.zh.md` or `comparison.zh.md`.

## Mode Gate

Default to `audit_only`.

Allowed in `audit_only`:

- Read local method docs, tracking config, previous runs, and public search results.
- Run local tracking scripts if they already exist and match the project format.
- Write local evidence, metrics, manual task CSVs, and weekly summaries.
- Recommend candidate experiments.

Forbidden unless the user explicitly authorizes implementation:

- Editing README, README_zh, Description, Topics, releases, or profile pages.
- Creating branches, commits, PRs, issues, discussions, or external content.
- Claiming a causal fix when evidence is insufficient.

If an optimization action is needed, output a proposed next experiment and route implementation through `github-repo-seo-standard`.

## Cloud Runner Boundary

When the task runs through `github-seo-cloud-runner`, GitHub Actions is only the monitoring and fact-package layer.

Allowed for GitHub Actions scripts:

- Start on a schedule.
- Collect GitHub search ranking, stars, traffic, clones, release downloads, and raw evidence.
- Save CSV / JSON / Markdown monitor results.
- Generate `07_METRICS/fact-packs/<fact_pack_id>/` with facts and rule-level anomaly flags.
- Commit those artifacts back to the cloud-runner repository.

Forbidden for GitHub Actions scripts:

- Generate a "best action plan".
- Judge SEO causality.
- Edit README, Description, Topics, releases, profile pages, branches, commits, PRs, issues, discussions, skills, automation, or external pages.

Codex/ChatGPT model automations own the analysis and optimization layer: read the latest fact package, interpret signal versus noise, design experiments, audit risk, draft concrete copy, and implement only when the automation prompt contains explicit implementation authorization and scope.

## Core Loop

1. Read the project context:
   - `github-seo-lab/06_METHOD/measurement-framework.md`
   - `github-seo-lab/06_METHOD/keyword-methodology.md`
   - `github-seo-lab/06_METHOD/repo-seo-standard.md`
   - `github-seo-lab/06_METHOD/channel-seo-strategy.md`
   - `github-seo-lab/07_METRICS/tracking-config.json`
2. Create a `run_id` using UTC time and create `github-seo-lab/07_METRICS/runs/<run_id>/`.
   - When working in the GitHub SEO lab, first try the fixed local entrypoint: `python 03_CODEX/scripts/run_seo_tracking.py --no-diagnostic-gh-search`.
   - Do not stop after a protocol audit or script mismatch observation. Every scheduled monitor run must create `run-status.json`.
   - If collection succeeds, write `status=completed`; if collection is blocked, write `status=blocked`, `weekly-summary.md`, and a Chinese blocker reason.
   - Post-monitor analysis may analyze only runs whose `run-status.json` has `status=completed`; blocked runs require blocker analysis, not optimization proposals.
3. Run an automation capability audit:
   - Check `gh auth status`.
   - Check whether required environment variables are configured without printing secret values.
   - Save `automation-capability.json` and `automation-capability.zh.md`.
   - Classify blockers as `missing_credentials`, `invalid_auth`, `insufficient_permission`, `no_official_api`, `no_legal_automated_path`, `network_error`, or `rate_limited`.
4. Validate the query set:
   - Every query has `keyword_width`.
   - At least 60% of baseline GitHub queries are `broad_category` or `scenario_problem`.
   - Chinese-user projects use Chinese-first queries.
   - Brand and exact-long-tail queries are marked as supporting diagnostics, not real discovery proof.
5. Collect GitHub business proxy metrics for every configured repo:
   - Stars, forks, watchers/subscribers if available, open issues, pushed_at, updated_at.
   - Traffic views, clones, popular referrers, and popular paths through GitHub API when auth permits.
   - Release asset download counts through GitHub API.
   - Save raw evidence under `github_business/`, write `business-metrics.csv`, and write `business-metrics.zh.md`.
   - If a call fails, record the exact blocker; do not collapse it into "not measured."
6. Run or queue channel checks:
   - GitHub top100 repo search: use unauthenticated public GitHub Search REST API as the canonical ranking protocol when possible.
   - Use authenticated `gh search repos` only as a secondary diagnostic or fallback; record `logged_in=true` and do not compare it directly with unauthenticated runs without marking protocol differences.
   - Baidu, Bing, and AI search: execute only when the environment has a stable legal path; otherwise create blocked/manual tasks with exact blocker type.
   - Record whether each repo is `github_repo_only`, has docs/GitHub Pages, has an external site, or has site work `deferred_by_user`.
   - If a controllable site exists, track sitemap, robots, schema/JSON-LD, canonical URL, `llms.txt`, webmaster access, and URL submission status as asset-readiness fields, not ranking proof.
7. Record one row per query with protocol fields:
   - timestamp, run_id, channel, engine, repo, query_group, keyword_width, query, target, rank, score, status, evidence path, query method, locale, region, login state, sort mode, result type, device, endpoint, reviewer, raw hash.
8. Compare against the previous compatible run:
   - New Top10/Top20/Top50 appearances.
   - Lost Top10/Top20/Top50 appearances.
   - Broad/scenario movement separately from brand/exact movement.
   - Query protocol changes that make comparisons unreliable.
   - Save `run-compatibility.zh.md` listing comparable runs, excluded runs, and exclusion reasons.
9. Classify conclusions:
   - `validated_signal`: repeated weekly evidence, especially broad/scenario improvement.
   - `watch`: smoke-test-only, single-run, small sample, or AI mention without citation.
   - `no_signal`: repeated not found or worse without compensating query groups.
   - `unverified`: plausible but not yet supported.
   - Exclude `post_change_smoke` rows from `validated_signal` decisions unless a later compatible weekly run confirms them.
   - If a repo has fewer than five stable broad/scenario GitHub queries, mark group-level trend conclusions as `小样本未证实`.
10. Output:
   - Append or create `07_METRICS/metrics.csv`.
   - Append or create `07_METRICS/business-metrics.csv` when practical.
   - Save `evidence-registry-delta.zh.md`; update `07_METRICS/evidence-registry.csv` only when evidence level changes are supported by compatible weekly evidence.
   - Save `asset-readiness.csv` for release, profile, docs/site, package registry, issue/discussion, external content, and AI citation target readiness.
   - Save `weekly-summary.md`.
   - For post-monitor analysis runs, save `executive-summary.zh.md`: a 600-1000 Chinese-character self-contained plain-language decision summary. The user must be able to decide without opening any other file. Do not use internal experiment IDs as action labels; if an ID is unavoidable, put it after a plain Chinese action. Each proposed action must name the repo/product, exact field, intended change, reason/evidence, risk or unverified status, and whether user approval is required.
   - Save `manual_tasks.csv` when required.
   - List candidate next experiments and concrete next actions without editing repos.

## Automation-First Rule

Maximize automation before creating manual tasks. Manual tasks are the last resort.

Every blocked/manual task must include:

- `automation_possible`
- `blocker_type`
- `blocker_reason`
- `required_credential_or_tool`
- `next_action`

Do not write vague reasons like "needs manual" when the real blocker is missing credentials, invalid GitHub auth, insufficient permission, lack of an official API, legal/TOS risk, or missing browser/session capability.

## GitHub Search Bias Control

For ranking measurement, prefer the public unauthenticated GitHub Search REST API with `logged_in=false`. This reduces possible owner/account/session bias when measuring the user's own repositories.

Authenticated `gh search repos` is acceptable for:

- spot checks
- fallback when unauthenticated API is blocked
- business proxy metrics that require authentication

When authenticated search is used, record `query_method=gh_cli_authenticated`, `logged_in=true`, and the protocol difference. Do not compare authenticated and unauthenticated ranks as if they were the same protocol.

## Evidence Rules

- Do not present high rank on `brand` or `exact_long_tail` as proof of real exposure.
- Do not add GitHub, Baidu/Bing, and AI scores into one combined score.
- Treat `visibility_score` as a diagnostic only, not platform weight or traffic proof.
- Treat GitHub traffic, clones, stars, release downloads, referrers, and paths as business proxy metrics. They must be collected when API access allows, but they do not prove SEO causality by themselves.
- Treat sitemap submission, URL submission, IndexNow, Baidu push, schema/JSON-LD, and `llms.txt` as asset or indexing observations, not ranking proof.
- If only precise terms rank and broad/scenario terms do not, write: `真实曝光未验证`.
- If evidence is insufficient, output only known facts, candidate hypotheses, validation paths, temporary mitigations, and unverified conclusions.

## Success Criteria

An SEO experiment is effective only when all are true:

- At least two compatible weekly runs support the signal.
- At least one `broad_category` or `scenario_problem` query improves.
- The improvement is not explained solely by protocol changes.
- Supporting movement appears in related query groups or downstream business metrics.
- The signal is not based only on `post_change_smoke`.

If only brand/exact terms improve, classify the result as precision recall, not discovery growth.

## Next Actions

Every `weekly-summary.md` must include next actions grouped as:

- `可以直接自动执行`
- `需要配置凭证后自动执行`
- `需要用户人工完成`
- `暂缓/不建议执行`

Do not leave the next-action section empty.
