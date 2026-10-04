---
name: github-repo-seo-standard
description: Use when auditing, planning, measuring, or implementing GitHub repository discoverability work, including README/README_zh SEO review, Description or Topics proposals, release copy review, search ranking tracking, competitor or alternative term handling, Baidu/Bing/AI search channel assessment, site asset readiness, or portfolio rollout.
---

# GitHub Repo SEO Standard

## Overview

Use this skill to improve GitHub repository discoverability without unsupported claims, spam, or fake popularity signals. Treat SEO as an evidence loop: define facts, assess channels, measure, change only within permission, then retest.

## Mode Gate

Choose a mode before any work:

- `audit_only`: read-only findings. Do not edit files, push branches, open PRs, change GitHub metadata, create releases, issues, or discussions.
- `planning_only`: draft copy, metadata proposals, keyword plans, measurement plans. Do not modify online state or open PRs.
- `implementation`: edit only after explicit user authorization. Stay within the requested write scope.

If the user did not explicitly authorize implementation, default to `planning_only` or `audit_only`.

## Automation Implementation Guard

Cron, heartbeat, and recurring automation runs default to `audit_only` or `planning_only`.

They must not enter `implementation` unless the automation prompt contains all of:

- a current explicit user authorization for implementation
- a specific `experiment_id`
- the exact repositories and fields allowed to change
- the required verification and rollback or stop condition

If those are missing, output candidate experiments and `requires_user_approval=true` instead of editing README files, GitHub metadata, releases, branches, PRs, issues, discussions, or external pages.

## Workflow

1. Define product facts and forbidden claims:
   - What the project is.
   - Who it is for.
   - What action it performs.
   - Which platforms and integrations are real.
   - Which upstream or competitor relationships are true.
   - Which claims are forbidden because they are unverified.
2. Assess channel fit:
   - GitHub, Baidu, Bing, AI search, docs/GitHub Pages, and external content.
   - For each channel, record `execute`, `manual_task`, or `skip`.
   - If skipped, record `skip_reason`.
   - For Chinese-user projects, default to at least Baidu and AI-search manual tasks unless product facts make them irrelevant.
   - Classify the controllable asset path: `github_repo_only`, `docs_or_pages_available`, `external_site_available`, or `deferred_by_user`.
   - If a docs/site asset exists, check sitemap, robots, schema/JSON-LD, canonical URL, `llms.txt`, Bing Webmaster/Search Console access, and IndexNow/Baidu submit readiness.
   - If the user paused site work, mark docs/site work `deferred_by_user`; do not design or publish pages.
3. Define target language and keyword breadth:
   - If target users are Chinese, use Chinese-first README/Description proposals and Chinese-first baseline queries.
   - Do not use easy English exact-match rankings as a substitute for Chinese discovery.
   - Mark `keyword_width`: `broad_category`, `scenario_problem`, `platform_tool`, `exact_long_tail`, or `brand`.
   - At least 60% of baseline queries should be `broad_category` or `scenario_problem`.
   - If only `brand` or `exact_long_tail` queries rank well, state "real discovery is unverified."
4. Build keyword candidates with evidence level:
   - `brand`, `category`, `scenario`, `technical`, `competitor`, `alias`.
   - Allowed evidence levels: `observed_once`, `confirmed_weekly`, `repo_specific`, `channel_specific`, `portfolio_candidate`, `standardized`.
5. Run baseline measurement before edits:
   - GitHub top100 for candidate queries.
   - Bing/Baidu checks or manual tasks.
   - AI prompts for DeepSeek/Doubao/Kimi/etc. or manual tasks.
   - Record query protocol: method, locale, region, logged-in state, sort mode, result type, endpoint, reviewer, raw evidence path/hash.
6. Choose one experiment theme:
   - Record hypothesis, changed fields, unchanged fields, target query groups, expected signal, confounders, and evidence level.
7. Draft or edit controlled fields only if mode allows:
   - Repository Description proposal.
   - Topics proposal.
   - README and README_zh first screen.
   - Release body.
   - Profile README for portfolio-level discovery.
8. Apply anti-stuffing review:
   - H1: project name plus at most one category or alias.
   - Description: at most one core category, one scenario, and one necessary relationship term.
   - First screen: no comma-separated keyword strings.
   - Competitor terms must be truthful, explained, and evidence-backed.
   - The copy must still help a real user after removing the SEO motive.
9. Verify and record:
   - Save pre-change metadata.
   - Use draft PRs for README changes when implementation is authorized.
   - Run `git diff --check`.
   - Run or queue tracking.
   - Mark immediate smoke results separately from stable 24-48 hour results.
   - List unverified conclusions.
10. Produce standard artifacts:
   - `baseline-ranking.csv`
   - `metadata-proposal.md`
   - `readme-change-summary.md`
   - `post-change-smoke.csv` when a smoke test is run
   - `asset-readiness.csv` for release, profile, docs/site, package registry, issue/discussion, and AI citation assets
   - Optional `GITHUB-SEO-REPORT.md` and `GITHUB-ACTION-PLAN.md` when a user asks for a portable report.

## README First-Screen Standard

The first screen should contain:

- H1 with project name plus one category or alias.
- One sentence explaining user, platform, and job-to-be-done.
- A natural search-intent line with at most three phrase clusters, prioritizing the target user's language and broad category/scenario terms.
- Release/download or quick-start link.
- Essential trust boundary: privacy, upstream relation, non-official relationship, or unsupported claims.

Avoid turning the first screen into an unrelated keyword list. Keywords must read naturally and match real product capabilities.

## Competitor and Upstream Terms

Default placement:

- Prefer README relation paragraph, Alternatives, or FAQ.
- Use Topics or Release only when evidence and context support it.
- Avoid H1. Use Description only when search-intent evidence and relationship clarity justify it.

Allowed examples:

- `OpenLess-based`
- `基于 OpenLess 改造`
- `Typeless alternative direction`
- `Typeless 替代方向`

Forbidden examples without evidence:

- `OpenLess official`
- `Typeless official`
- `达到 80% Typeless 效果`
- `better than Typeless`
- Accuracy, latency, cost, ranking, or adoption claims without measurement.

If evidence is weak, label the statement as a hypothesis and keep it out of user-facing README copy.

## Measurement

Use the bundled script only when it matches the current lab format and the task permits running it:

Resolve the directory containing this `SKILL.md` as `skill_root`, then run the bundled script by its actual absolute path:

```bash
python "<resolved-skill-root>/scripts/run_seo_tracking.py"
```

Do not pass the literal placeholder to the shell.

When working in the GitHub SEO lab, prefer the project-local script if a script run is requested:

```bash
python 03_CODEX/scripts/run_seo_tracking.py
```

Visibility score is diagnostic only. Do not treat it as platform weight or proof of causality. GitHub rank, web rank, and AI mention/citation must be judged separately.

## Website and AI Citation Assets

Separate GitHub repo SEO from website SEO:

- GitHub repo SEO controls README, Description proposals, Topics proposals, releases, and profile README.
- Website SEO controls page titles, meta descriptions, sitemap, robots, schema/JSON-LD, canonical URLs, IndexNow/Baidu submission, and webmaster data.
- AI citation readiness controls clear public pages, truthful entity descriptions, FAQ/limitations, release notes, upstream relationship notes, and optional `llms.txt`.

Use sitemap, URL submission, IndexNow, and Baidu push as indexing/discovery actions only. Do not record them as ranking improvements unless later measurement supports that.

Treat `llms.txt`, schema/JSON-LD, and brand entity coherence as candidate AI-search hypotheses. They are useful to consider when a controllable site exists, but they are not proven ranking levers for GitHub repo pages.

## Release And Profile SEO

When release or profile work is in scope, audit or draft:

- release title, tag, asset names, download explanation, verification notes, platform words, and user-facing changelog
- repository profile or owner profile README language, project grouping, flagship links, and clear boundaries
- issue/discussion templates only as discoverability and support assets, not ranking proof

Release/profile copy must describe real artifacts and use cases. Do not add unsupported performance, quality, popularity, or competitor claims.

## Hard Rules

- Do not edit GitHub metadata, push branches, open PRs, create releases, or change online repository state unless the user explicitly requested implementation.
- Do not let recurring automation perform implementation by default; it may only propose candidate experiments unless it has a specific user-approved `experiment_id` and write scope.
- Do not present a fix or causal explanation when evidence is insufficient; output known facts, candidate hypotheses, validation paths, temporary mitigations, and unverified conclusions.
- Do not optimize only for precise, low-result, or English exact-match queries when the target users search in Chinese.
- Do not present high rank on brand or exact-long-tail queries as proof of real exposure.
- Do not buy, trade, simulate, or automate stars, clicks, rankings, or low-quality backlinks.
- Do not use black-hat Baidu SEO, click scripts, site networks, or mechanically duplicated external content.
- Do not treat sitemap submission, URL submission, IndexNow, Baidu push, schema, or `llms.txt` as ranking proof; they require later validation.
- Do not design, create, or publish docs/GitHub Pages/site pages when the user has deferred site work.
- Do not put competitor terms in H1/Description/Topics unless the relationship is truthful, explained, and supported by search-intent evidence.
- Do not repeat the same keyword family across H1, Description, first screen, Topics, and Release without a user-readable reason.
- Do not treat AI mention as rank, citation, or recommendation unless the evidence separately supports that label.

Read `references/repo-seo-standard.md` for the compact execution reference.
