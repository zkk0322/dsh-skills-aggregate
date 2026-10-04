# GitHub Repo SEO Reference

Version: 2026-06-21.3

## Mode Rule

Start by choosing a mode:

- `audit_only`: read and report only. No file edits, PRs, pushes, metadata changes, releases, issues, or discussions.
- `planning_only`: draft copy and plans only. No online state changes.
- `implementation`: only after explicit authorization, within the requested write scope.

If the user did not explicitly authorize implementation, do not implement.

## Automation Implementation Guard

Cron, heartbeat, and recurring automation tasks are read-only by default.

They may not edit repositories, GitHub metadata, releases, branches, PRs, issues, discussions, skills, or external pages unless the prompt contains:

- current explicit user authorization for implementation
- a specific `experiment_id`
- the exact repository list
- the exact changed fields allowed
- verification steps
- rollback or stop condition

Without those fields, output candidate experiments with `requires_user_approval=true`.

## Evidence Rule

Do not present a cause or fix when evidence is insufficient. Use these labels:

- Known fact.
- Candidate hypothesis.
- Validation path.
- Temporary mitigation.
- Unverified conclusion.

Evidence levels:

- `observed_once`
- `confirmed_weekly`
- `repo_specific`
- `channel_specific`
- `portfolio_candidate`
- `standardized`

Do not promote a keyword or field-placement rule into the global standard until it has evidence beyond a single repo/run.

## Channel Fit

For every repo, record:

- `github`: execute / manual_task / skip
- `baidu`: execute / manual_task / skip
- `bing`: execute / manual_task / skip
- `ai_search`: execute / manual_task / skip
- `docs_or_pages`: execute / manual_task / skip
- `asset_path`: `github_repo_only` / `docs_or_pages_available` / `external_site_available` / `deferred_by_user`

Also record asset readiness fields when practical:

- `release_available`
- `profile_readme_available`
- `docs_or_pages_available`
- `external_content_available`
- `package_registry_available`
- `issues_discussions_available`
- `ai_citation_target_available`

Every skip needs `skip_reason`. Chinese-user projects default to Baidu and AI-search manual tasks unless product facts make them irrelevant.

Separate GitHub repo SEO from website SEO:

- GitHub repo SEO: README, Description proposal, Topics proposal, releases, profile README.
- Website SEO: page titles, meta descriptions, sitemap, robots, schema/JSON-LD, canonical URLs, IndexNow/Baidu submission, webmaster data.
- AI citation readiness: clear public pages, FAQ/limitations, release notes, upstream relation notes, optional `llms.txt`.

If the user has paused site/page work, mark website actions `deferred_by_user`; do not design or publish pages.

## Language and Keyword Breadth

Choose the target search language before selecting keywords.

- Chinese-user projects must use Chinese-first README/Description proposals and Chinese-first baseline queries.
- English exact-match rankings cannot stand in for Chinese discovery.
- Mark `keyword_width` for every query:
  - `broad_category`
  - `scenario_problem`
  - `platform_tool`
  - `exact_long_tail`
  - `brand`
- At least 60% of baseline queries should be `broad_category` or `scenario_problem`.
- If only `brand` or `exact_long_tail` queries rank well, write: real discovery is unverified.
- Do not promote precise low-result query wins into the global standard.

## Field Placement

| Keyword type | Best location |
|---|---|
| Core category | Description, README H1, first sentence |
| User scenario | README first screen, examples, FAQ |
| Technical term | Topics, architecture, release notes |
| Competitor / alternative | README relation paragraph, Alternatives, FAQ |
| Brand / alias | H1, release, profile README |
| Risky comparison | Avoid user-facing copy unless verified |

Competitor terms in Description or Topics require search-intent evidence and a clear relation paragraph. Avoid competitor terms in H1.

## Anti-Stuffing Checklist

- H1 has project name plus at most one category or alias.
- Description has at most one core category, one scenario, and one necessary relationship term.
- README first screen has no comma-separated keyword string.
- Same competitor term is not repeated across H1, Description, Topics, and Release without a user-readable reason.
- Topics represent real abilities, platforms, technologies, and a few scenarios.
- The copy remains useful to a real user without the SEO motive.

## Release SEO Checklist

Use this checklist for release copy audits or implementation:

- release title states version and user-visible value
- asset names describe platform and package type
- release body explains who should download which file
- verification or checksum notes exist when practical
- changelog is concrete and not keyword-stuffed
- download, install, and privacy/security boundaries are clear

Release SEO is a discoverability and conversion asset. It is not ranking proof until later measurement supports it.

## Profile And Portfolio SEO Checklist

Use this checklist for repository owner/profile work:

- profile README groups flagship projects by user problem, not only by tech stack
- project links use natural Chinese category and scenario wording when target users are Chinese
- profile copy avoids unsupported popularity or quality claims
- archived/forked projects are separated from active original products
- profile changes are measured as portfolio-level experiments, not repo-level proof

## Query Protocol

Use one row per query and include:

- `timestamp_utc`
- `run_id`
- `channel`
- `engine`
- `repo`
- `query_group`
- `keyword_width`
- `query`
- `target`
- `target_rank`
- `result_count`
- `visibility_score`
- `status`
- `evidence_level`
- `evidence_path`
- `query_method`
- `locale`
- `region`
- `logged_in`
- `sort_mode`
- `result_type`
- `device_profile`
- `query_url_or_endpoint`
- `manual_reviewer`
- `raw_result_hash`

Visibility scoring:

- Rank 1: 100
- Rank 2-3: 70
- Rank 4-10: 50
- Rank 11-20: 30
- Rank 21-50: 10
- Rank 51-100: 5
- Not found: 0

Use visibility score as a diagnostic only. Do not compare GitHub rank, web rank, and AI mention as one total score.

## Experiment Loop

1. Baseline.
2. Choose one experiment theme.
3. Record hypothesis, changed fields, unchanged fields, target query groups, expected signal, confounders, and evidence level.
4. Edit only if mode allows.
5. Immediate smoke test.
6. Wait 24-48 hours.
7. Full top100 retest.
8. Compare query groups.
9. Put effective terms into evidence registry first, not directly into the global standard.
10. Mark unsupported terms as unverified or ineffective.

Recurring automations stop at step 3 unless explicitly authorized for implementation. Implementation is a separate step with a user-approved `experiment_id`.

## Standard Artifacts

For implementation work, produce or update:

- `baseline-ranking.csv`
- `metadata-proposal.md`
- `readme-change-summary.md`
- `post-change-smoke.csv` when a smoke test is run
- `asset-readiness.csv` when portfolio or channel readiness is audited

When a portable report is requested, use:

- `GITHUB-SEO-REPORT.md`
- `GITHUB-ACTION-PLAN.md`

Do not create these files in `audit_only` unless the user asks for local report artifacts.

## Technical SEO Boundaries

- Sitemap, robots, schema/JSON-LD, canonical URLs, IndexNow, Baidu push, and webmaster data apply only when a controllable site/docs asset exists.
- URL submission and IndexNow are indexing/discovery actions, not ranking proof.
- `llms.txt`, schema/JSON-LD, and brand entity coherence are candidate AI-search hypotheses; validate before promoting them into standards.
- Black-hat Baidu SEO, click scripts, site networks, mechanically duplicated pages, fake links, and fake citations are forbidden.

## Portfolio Rollout

Prioritize original, non-archived repos with clear product value. Forks are lower priority unless they support personal brand SEO.

For each repo:

1. Read README, Description, Topics, Release.
2. Define product facts and forbidden claims.
3. Run channel fit assessment.
4. Generate candidate keyword groups.
5. Run GitHub baseline and non-GitHub manual tasks.
6. Draft README/README_zh and metadata proposals.
7. If implementation is authorized, use a draft PR for README changes.
8. Run or queue tracking.
9. Record known facts, hypotheses, validation paths, and unverified conclusions.
