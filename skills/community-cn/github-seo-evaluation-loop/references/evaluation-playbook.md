# GitHub SEO Evaluation Playbook

## Purpose

Run a repeatable SEO evaluation loop for the user's GitHub repositories:

1. Measure discoverability.
2. Compare against prior runs.
3. Classify what is validated, weak, or unverified.
4. Produce the next optimization experiment proposal.

This playbook favors broad Chinese category and scenario searches over easy exact-match wins.

## Cloud Runner Boundary

`github-seo-cloud-runner` is a monitoring and fact-package repository, not an optimizer.

GitHub Actions may:

- start on schedule
- collect GitHub search ranking and business proxy metrics
- save raw evidence, CSV, JSON, and Markdown monitor outputs
- create `07_METRICS/fact-packs/<fact_pack_id>/fact-pack.json`
- create rule-level anomaly flags such as `primary_queries_not_in_top20` or `primary_query_declined`
- commit monitoring artifacts back to the cloud-runner repo

GitHub Actions scripts must not:

- decide the best SEO action
- infer SEO causality
- write README, README_zh, Description, Topics, releases, profile pages, branches, commits, PRs, issues, discussions, skills, automation, or external content

The model automation after monitoring must read the latest fact package and then produce the analysis, candidate experiments, concrete rewrite proposal, risk review, rollback plan, and any authorized implementation or PR. If implementation authorization is missing, it must stop at planning.

## Output Language

All human-facing outputs should be Simplified Chinese.

- `weekly-summary.md`: Chinese title, section headings, explanations, known facts, hypotheses, validation paths, unverified conclusions, and next experiments.
- `manual_tasks.csv`: keep machine-readable headers and enum values, but write `skip_reason` and `notes` in Chinese.
- JSON files: keep stable machine-readable keys; write human-readable string values in Chinese when practical.
- If a JSON file needs human interpretation, create a Chinese Markdown companion file, for example `query-validation.zh.md` or `comparison.zh.md`.
- English may remain only for fixed field names, enum values, commands, paths, repo names, API names, and original query text where changing it would damage reproducibility.

## Repository Defaults

Resolve the lab root from the current workspace or a user-supplied path. Confirm the required method and tracking files before running:

```text
<github-seo-lab-root>
```

Core files:

- `06_METHOD/measurement-framework.md`
- `06_METHOD/keyword-methodology.md`
- `06_METHOD/repo-seo-standard.md`
- `06_METHOD/channel-seo-strategy.md`
- `07_METRICS/tracking-config.json`
- `07_METRICS/templates/query-record-template.csv`
- `07_METRICS/templates/manual-task-template.csv`
- `07_METRICS/templates/weekly-summary-template.md`
- `07_METRICS/evidence-registry.csv`

## Automation Capability Audit

Create these files for every run:

- `run-status.json`
- `automation-capability.json`
- `automation-capability.zh.md`
- `run-compatibility.zh.md`
- `evidence-registry-delta.zh.md`
- `asset-readiness.csv`

Reliability rule:

- In the GitHub SEO lab, run the fixed monitor entrypoint first: `python 03_CODEX/scripts/run_seo_tracking.py --no-diagnostic-gh-search`.
- A scheduled monitor must not end after only reading methodology or checking protocols.
- Every run must create `run-status.json`.
- Successful runs use `status=completed`; blocked runs use `status=blocked` and must still include a Chinese `weekly-summary.md` explaining the blocker.
- Post-monitor analysis should only analyze `status=completed` runs. If the latest run is blocked, create a blocker analysis instead of optimization proposals.

Check and record:

- `gh auth status`
- Whether `BING_SEARCH_V7_SUBSCRIPTION_KEY` is configured.
- Whether `TAVILY_API_KEY` is configured.
- Whether DeepSeek, Doubao/Volcengine, or Baidu credentials are configured.
- Do not print secret values.

Use blocker labels:

- `missing_credentials`
- `invalid_auth`
- `insufficient_permission`
- `no_official_api`
- `no_legal_automated_path`
- `network_error`
- `rate_limited`

Do not describe a blocked automated check merely as "not measured."

## GitHub Business Proxy Metrics

Collect for every configured repo when GitHub API access permits:

- Repository metadata: stars, forks, watchers/subscribers if available, open issues, pushed_at, updated_at.
- Traffic views: `gh api repos/<owner>/<repo>/traffic/views`.
- Traffic clones: `gh api repos/<owner>/<repo>/traffic/clones`.
- Popular referrers: `gh api repos/<owner>/<repo>/traffic/popular/referrers`.
- Popular paths: `gh api repos/<owner>/<repo>/traffic/popular/paths`.
- Release downloads: `gh api repos/<owner>/<repo>/releases --paginate`, summing asset `download_count`.

Save:

- raw JSON under `github_business/`
- `business-metrics.csv`
- `business-metrics.zh.md`

If a call fails, retry once and then record the exact blocker: invalid auth, forbidden/insufficient permission, not found, network error, rate limit, or no releases.

These are business proxy metrics. They can support interpretation but do not prove SEO causality.

## Query Width

Every query must have `keyword_width`:

| keyword_width | Meaning | Weight in interpretation |
| --- | --- | --- |
| `broad_category` | Category words users may search before knowing the project | Primary discovery signal |
| `scenario_problem` | Problem or use-case searches | Primary discovery signal |
| `platform_tool` | Platform, framework, upstream, or tool terms | Supporting signal |
| `exact_long_tail` | Precise phrase likely created by the SEO copy | Precision recall only |
| `brand` | Project or repo name | Navigational recall only |

If broad/scenario terms are absent but exact/brand terms rank, write: `真实曝光未验证`.

If a repo has fewer than five stable broad/scenario GitHub queries, label group-level trend conclusions as `小样本未证实`.

## Visibility Score

Use this diagnostic score:

| Rank | Score |
| ---: | ---: |
| 1 | 100 |
| 2-3 | 70 |
| 4-10 | 50 |
| 11-20 | 30 |
| 21-50 | 10 |
| 51-100 | 5 |
| Not found | 0 |

Do not combine scores across GitHub, web search, and AI search.

## One Query Row

Each query record should include:

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
- `top_1`
- `top_3`
- `top_10`
- `top_20`
- `top_50`
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
- `notes`

## Channel Rules

GitHub:

- Use the public unauthenticated GitHub Search REST API as the canonical ranking protocol when available:
  - `GET https://api.github.com/search/repositories?q=<query>&per_page=<top_n>`
  - no Authorization header
  - set a clear User-Agent
  - record `logged_in=false`
- Respect unauthenticated rate limits; if blocked, record `rate_limited`.
- Use authenticated `gh search repos` only as a secondary diagnostic or fallback, and record `query_method=gh_cli_authenticated`, `logged_in=true`.
- Record sort mode, login state, locale, endpoint, result count, and raw evidence.
- Ranking changes are observations, not algorithm explanations.
- Do not compare authenticated and unauthenticated ranks as the same protocol.

Baidu and Bing:

- Maximize automation before creating manual tasks.
- Bing: use Bing Search API when `BING_SEARCH_V7_SUBSCRIPTION_KEY` is configured. If not, a sanctioned alternative such as Tavily may be used only as `web_surrogate`, not as `bing_rank`.
- Baidu: use only an official or legal configured path. Without credentials or a stable legal browser/session path, record `no_legal_automated_path` or `missing_credentials`.
- Record whether target URL is indexed, whether it appears in top20/top50, page type, market/language, and evidence screenshot/export path.
- Do not treat URL submission or indexing as ranking improvement without later validation.

AI search:

- Track `mention`, `recommendation`, `citation`, `citation_target`, `answer_position`, and `accuracy_status`.
- Do not treat mention, recommendation, and citation as the same metric.
- If the answer mentions the project without a citation, classify as weak evidence.
- Automate only when the target engine has a configured API or browser/session path that can produce answers and citations.
- DeepSeek model API without web/citation capability is not the same as DeepSeek AI search.
- If no such path exists, create a blocked task with `missing_credentials` or `no_official_api`.

Site and citation assets:

- Record `asset_path`: `github_repo_only`, `docs_or_pages_available`, `external_site_available`, or `deferred_by_user`.
- If a controllable site/docs asset exists, record sitemap, robots, schema/JSON-LD, canonical URL, `llms.txt`, Bing Webmaster/Search Console access, IndexNow readiness, and Baidu submit readiness.
- Treat these as asset-readiness or indexing observations, not ranking proof.
- If site work is deferred by the user, do not create site tasks beyond noting `deferred_by_user`.
- Always record release, profile README, docs/site, external content, package registry, issues/discussions, and AI citation target readiness in `asset-readiness.csv` when practical.

## Evidence Levels

Use these labels:

- `observed_once`
- `confirmed_weekly`
- `repo_specific`
- `channel_specific`
- `portfolio_candidate`
- `standardized`

Do not upgrade a term into the global standard after one run or one repo.

Rows with `evidence_level=post_change_smoke` are immediate diagnostics. Exclude them from `validated_signal`, `confirmed_weekly`, `portfolio_candidate`, and `standardized` decisions unless later compatible weekly runs confirm the same broad/scenario signal.

## Weekly Summary

`weekly-summary.md` must contain:

- `run_id`
- automation capability audit
- total query count
- GitHub automatic query count
- manual task count
- repo-level GitHub diagnostics
- GitHub business proxy metrics: stars, views, clones, release downloads, referrers, paths
- GitHub search protocol and login-state bias check
- Top10/Top20/Top50 changes
- broad/scenario movements
- brand/exact movements
- Baidu/Bing/AI manual task summary
- site/docs asset status and deferred items
- AI citation targets and accuracy notes
- evidence-level changes
- run compatibility summary
- asset readiness summary
- evidence registry delta
- known facts
- candidate hypotheses
- validation paths
- unverified conclusions
- next experiment proposals
- next actions grouped by automation status

## Executive Summary For Post-Monitor Analysis

Post-monitor analysis runs must also write `executive-summary.zh.md`.

Purpose: give the user a short decision memo before the detailed reports.

Rules:

- Write in plain Simplified Chinese for a non-technical reader.
- Recommended length: 600-1000 Chinese characters; hard maximum 1200 Chinese characters unless the user explicitly asks for more.
- Do not copy long tables from detailed reports.
- Do not use causal wording such as "已修复" or "已生效" unless evidence rules support it.
- Clearly separate proven facts from candidate hypotheses.
- The summary must be self-contained. The user must not need to open another candidate file, experiment file, CSV, or detailed report to understand whether the next action is reasonable.
- Do not use internal IDs such as `experiment_id` as the main name of an action. If an internal ID is needed for traceability, place it in parentheses after the plain Chinese action.
- Every recommended action must include: repo or product, exact field to change, plain-language intended change, evidence or reason, risk or unverified status, and whether user approval is required.
- Translate technical surfaces on first mention. For example, explain `GitHub Description` as `GitHub 搜索结果里显示的一句简介`, and `README` as `项目说明文档`.
- Avoid pointer phrases such as "详见候选实验文档" when the missing context is required for a decision. Include the needed context in the summary itself.

Required sections:

- `一句话结论`
- `现在是什么状态`
- `建议的下一步动作`
- `为什么这么建议`
- `暂时不要做什么`
- `需要用户决定的事`

The final user-facing response from an automation should lead with the same short conclusion and then link to detailed files.

## Decision Rules

Effective:

- At least two compatible weekly runs support the signal.
- At least one broad or scenario query improves.
- Protocol changes do not explain the movement.
- Related query groups or downstream metrics provide supporting evidence.
- Smoke-test-only rows are excluded from the effective classification.

Watch:

- Single-run movement.
- Smoke-test-only movement.
- Small sample query group.
- AI mention without citation.
- Movement only in exact or brand terms.

No signal:

- Two compatible weekly runs still show not found.
- Ranking drops without offsetting gains.
- Query is irrelevant or produces no meaningful results.

## Next Experiment Format

When proposing optimization, output:

- `experiment_id`
- repo
- hypothesis
- changed fields proposed
- unchanged fields
- target query groups
- expected signal
- known confounders
- evidence level
- required authorization

Do not implement the experiment inside this evaluation skill.

Set `requires_user_approval=true` for any experiment that edits README, README_zh, README.en, Description, Topics, releases, profile pages, or external content.

## Recurring Automation Prompt

Use this prompt for a weekly Codex automation:

```text
Use the `github-seo-evaluation-loop` skill to run the weekly GitHub SEO evaluation.

Mode: audit_only.

Working project:
<github-seo-lab-root>

Before scheduling, replace `<github-seo-lab-root>` with the validated absolute lab root. Never execute the literal placeholder.

Tasks:
1. Read 06_METHOD/measurement-framework.md, 06_METHOD/keyword-methodology.md, 06_METHOD/repo-seo-standard.md, 06_METHOD/channel-seo-strategy.md, and 07_METRICS/tracking-config.json.
2. Write all human-facing outputs in Simplified Chinese. Keep machine-readable field names and enum values stable.
3. Create a UTC run_id and a new 07_METRICS/runs/<run_id>/ folder.
4. Run automation capability audit and save automation-capability.json plus automation-capability.zh.md.
5. Collect GitHub business proxy metrics for every configured repo when GitHub API access permits; save raw evidence, business-metrics.csv, and business-metrics.zh.md.
6. Validate every query has keyword_width and that Chinese-user repos are measured with Chinese-first broad/scenario queries. If the query set is too narrow, record the issue in Chinese.
7. Run GitHub top100 tracking when possible. Use the existing project-local script only if it matches the current config; otherwise perform equivalent evidence-backed checks.
8. For Baidu, Bing, and AI search, maximize automation first. If not available, create manual_tasks.csv with automation_possible, blocker_type, blocker_reason, required_credential_or_tool, next_action, exact query, target URL/repo, fields to record, and evidence requirements; write skip_reason and notes in Chinese.
9. Append or create 07_METRICS/metrics.csv with one row per query.
10. Update 07_METRICS/evidence-registry.csv only for evidence-level changes.
11. Compare with the previous compatible run. Separate broad/scenario gains from brand/exact gains.
12. Write 07_METRICS/runs/<run_id>/weekly-summary.md in Chinese with automation capability audit, GitHub business proxy metrics, known facts, candidate hypotheses, validation paths, unverified conclusions, and next actions.

Restrictions:
- Do not edit README, README_zh, Description, Topics, releases, profile pages, branches, commits, PRs, issues, discussions, or external pages.
- Do not claim causal fixes or platform algorithm explanations without evidence.
- Do not combine GitHub, Baidu/Bing, and AI search into one score.
- Do not treat brand or exact-long-tail ranking as proof of real discovery.
```

## 24-48 Hour Follow-Up Prompt

Use this after an SEO copy or metadata experiment is merged:

```text
Use the `github-seo-evaluation-loop` skill to run a 24-48 hour SEO experiment follow-up.

Mode: audit_only.

Working project:
<github-seo-lab-root>

Before running, replace `<github-seo-lab-root>` with the validated absolute lab root. Never execute the literal placeholder.

Tasks:
1. Identify the most recent merged SEO experiment or PR record.
2. Re-run the affected repo queries with the same protocol as the baseline.
3. Compare baseline, immediate smoke test if available, and this follow-up.
4. Classify changes as validated_signal, watch, no_signal, or unverified.
5. Pay special attention to broad_category and scenario_problem queries. If only exact_long_tail or brand improved, write `真实曝光未验证`.
6. Save the result under 07_METRICS/runs/<run_id>/experiment-followup.md.
7. Propose the next experiment without editing any repository.

Restrictions:
- Do not edit repositories or GitHub metadata.
- Do not open, merge, or close PRs.
- Do not explain ranking movement as platform causality without evidence.
```
