#!/usr/bin/env python3
"""Run repeatable SEO tracking for GitHub repositories.

Default behavior:
- GitHub search is automated through GitHub CLI.
- Bing web search is automated only when BING_SEARCH_V7_SUBSCRIPTION_KEY is set.
- Baidu and app-based AI search prompts are emitted as manual tasks.
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import os
import pathlib
import subprocess
import sys
import urllib.parse
import urllib.request
from typing import Any


FIELDNAMES = [
    "timestamp_utc",
    "run_id",
    "channel",
    "engine",
    "repo",
    "query",
    "target",
    "target_rank",
    "result_count",
    "visibility_score",
    "top_1",
    "top_3",
    "top_10",
    "top_20",
    "top_50",
    "status",
    "evidence_path",
    "manual_url",
    "notes",
]


def utc_now() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


def iso_timestamp() -> str:
    return utc_now().isoformat().replace("+00:00", "Z")


def run_id_now() -> str:
    return utc_now().strftime("%Y%m%dT%H%M%SZ")


def slug(value: str) -> str:
    safe = []
    for char in value:
        if char.isalnum() or char in "-_":
            safe.append(char)
        else:
            safe.append("_")
    return "".join(safe).strip("_")[:120] or "query"


def visibility_score(rank: int | None) -> int:
    if rank is None:
        return 0
    if rank == 1:
        return 100
    if rank <= 3:
        return 70
    if rank <= 10:
        return 50
    if rank <= 20:
        return 30
    if rank <= 50:
        return 10
    if rank <= 100:
        return 5
    return 0


def bool_text(value: bool) -> str:
    return "1" if value else "0"


def metric_row(
    *,
    run_id: str,
    channel: str,
    engine: str,
    repo: str,
    query: str,
    target: str,
    rank: int | None,
    result_count: int,
    status: str,
    evidence_path: pathlib.Path | str,
    manual_url: str = "",
    notes: str = "",
) -> dict[str, str]:
    score = visibility_score(rank)
    return {
        "timestamp_utc": iso_timestamp(),
        "run_id": run_id,
        "channel": channel,
        "engine": engine,
        "repo": repo,
        "query": query,
        "target": target,
        "target_rank": "" if rank is None else str(rank),
        "result_count": str(result_count),
        "visibility_score": str(score),
        "top_1": bool_text(rank == 1),
        "top_3": bool_text(rank is not None and rank <= 3),
        "top_10": bool_text(rank is not None and rank <= 10),
        "top_20": bool_text(rank is not None and rank <= 20),
        "top_50": bool_text(rank is not None and rank <= 50),
        "status": status,
        "evidence_path": str(evidence_path),
        "manual_url": manual_url,
        "notes": notes,
    }


def load_json(path: pathlib.Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def ensure_csv(path: pathlib.Path) -> None:
    if path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDNAMES)
        writer.writeheader()


def append_rows(path: pathlib.Path, rows: list[dict[str, str]]) -> None:
    ensure_csv(path)
    with path.open("a", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDNAMES)
        writer.writerows(rows)


def write_rows(path: pathlib.Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(rows)


def run_github_query(item: dict[str, Any], top_n: int, run_dir: pathlib.Path, run_id: str) -> dict[str, str]:
    query = item["query"]
    repo = item["repo"]
    evidence = run_dir / "github" / f"{slug(repo)}__{slug(query)}.json"
    stderr_path = run_dir / "github" / f"{slug(repo)}__{slug(query)}.stderr.txt"
    evidence.parent.mkdir(parents=True, exist_ok=True)

    command = [
        "gh",
        "search",
        "repos",
        query,
        "--limit",
        str(top_n),
        "--json",
        "fullName,url,description,stargazersCount,updatedAt",
    ]
    completed = subprocess.run(command, text=True, capture_output=True, check=False)
    evidence.write_text(completed.stdout or "[]", encoding="utf-8")
    stderr_path.write_text(completed.stderr or "", encoding="utf-8")

    if completed.returncode != 0:
        return metric_row(
            run_id=run_id,
            channel="github",
            engine="github",
            repo=repo,
            query=query,
            target=repo,
            rank=None,
            result_count=0,
            status="error",
            evidence_path=evidence,
            notes=f"gh exit code {completed.returncode}; stderr: {stderr_path}",
        )

    try:
        results = json.loads(completed.stdout or "[]")
    except json.JSONDecodeError as exc:
        return metric_row(
            run_id=run_id,
            channel="github",
            engine="github",
            repo=repo,
            query=query,
            target=repo,
            rank=None,
            result_count=0,
            status="error",
            evidence_path=evidence,
            notes=f"invalid JSON: {exc}",
        )

    rank = None
    for index, result in enumerate(results, start=1):
        if result.get("fullName") == repo:
            rank = index
            break

    return metric_row(
        run_id=run_id,
        channel="github",
        engine="github",
        repo=repo,
        query=query,
        target=repo,
        rank=rank,
        result_count=len(results),
        status="ok" if rank is not None else "not_found",
        evidence_path=evidence,
        notes=f"group={item.get('group', '')}",
    )


def rank_url(results: list[dict[str, Any]], target_url: str) -> int | None:
    normalized = target_url.rstrip("/")
    for index, result in enumerate(results, start=1):
        url = str(result.get("url") or "").rstrip("/")
        if url == normalized or url.startswith(normalized + "/"):
            return index
    return None


def run_bing_query(item: dict[str, Any], top_n: int, run_dir: pathlib.Path, run_id: str) -> dict[str, str]:
    key = os.environ.get("BING_SEARCH_V7_SUBSCRIPTION_KEY")
    query = item["query"]
    repo = item["repo"]
    target_url = item["target_url"]
    if not key:
        manual_url = "https://www.bing.com/search?q=" + urllib.parse.quote(query)
        return metric_row(
            run_id=run_id,
            channel="web",
            engine="bing",
            repo=repo,
            query=query,
            target=target_url,
            rank=None,
            result_count=0,
            status="needs_manual",
            evidence_path="",
            manual_url=manual_url,
            notes="Set BING_SEARCH_V7_SUBSCRIPTION_KEY to automate Bing ranking checks.",
        )

    evidence = run_dir / "bing" / f"{slug(repo)}__{slug(query)}.json"
    evidence.parent.mkdir(parents=True, exist_ok=True)
    endpoint = "https://api.bing.microsoft.com/v7.0/search"
    params = urllib.parse.urlencode({"q": query, "count": min(top_n, 50), "mkt": "zh-CN"})
    request = urllib.request.Request(
        f"{endpoint}?{params}",
        headers={"Ocp-Apim-Subscription-Key": key},
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            body = response.read().decode("utf-8")
    except Exception as exc:  # noqa: BLE001 - keep routine resilient
        evidence.write_text(json.dumps({"error": str(exc)}, ensure_ascii=False, indent=2), encoding="utf-8")
        return metric_row(
            run_id=run_id,
            channel="web",
            engine="bing",
            repo=repo,
            query=query,
            target=target_url,
            rank=None,
            result_count=0,
            status="error",
            evidence_path=evidence,
            notes=str(exc),
        )

    evidence.write_text(body, encoding="utf-8")
    payload = json.loads(body)
    results = payload.get("webPages", {}).get("value", [])
    rank = rank_url(results, target_url)
    return metric_row(
        run_id=run_id,
        channel="web",
        engine="bing",
        repo=repo,
        query=query,
        target=target_url,
        rank=rank,
        result_count=len(results),
        status="ok" if rank is not None else "not_found",
        evidence_path=evidence,
    )


def manual_web_query(item: dict[str, Any], run_id: str) -> dict[str, str]:
    engine = item["engine"]
    query = item["query"]
    if engine == "baidu":
        manual_url = "https://www.baidu.com/s?wd=" + urllib.parse.quote(query)
    else:
        manual_url = ""
    return metric_row(
        run_id=run_id,
        channel="web",
        engine=engine,
        repo=item["repo"],
        query=query,
        target=item["target_url"],
        rank=None,
        result_count=0,
        status="needs_manual",
        evidence_path="",
        manual_url=manual_url,
        notes="Manual ranking check required; keep screenshot or copied SERP evidence in this run folder.",
    )


def manual_ai_prompt(item: dict[str, Any], run_id: str) -> dict[str, str]:
    return metric_row(
        run_id=run_id,
        channel="ai_search",
        engine=item["engine"],
        repo=item["repo"],
        query=item["prompt"],
        target=item["target"],
        rank=None,
        result_count=0,
        status="needs_manual",
        evidence_path="",
        manual_url="",
        notes="Ask this prompt in the target AI search app. Record mention rank, cited URLs, and screenshot manually.",
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Run GitHub SEO tracking.")
    parser.add_argument("--config", default="07_METRICS/tracking-config.json")
    parser.add_argument("--out", default="07_METRICS")
    parser.add_argument("--top-n", type=int, default=None)
    parser.add_argument("--skip-github", action="store_true")
    args = parser.parse_args()

    root = pathlib.Path.cwd()
    config_path = (root / args.config).resolve()
    out_dir = (root / args.out).resolve()
    config = load_json(config_path)
    top_n = args.top_n or int(config.get("top_n", 100))
    run_id = run_id_now()
    run_dir = out_dir / "runs" / run_id
    run_dir.mkdir(parents=True, exist_ok=True)

    rows: list[dict[str, str]] = []
    manual_rows: list[dict[str, str]] = []

    if not args.skip_github:
        for item in config.get("github_queries", []):
            rows.append(run_github_query(item, top_n, run_dir, run_id))

    for item in config.get("web_queries", []):
        if item.get("engine") == "bing":
            row = run_bing_query(item, top_n, run_dir, run_id)
        else:
            row = manual_web_query(item, run_id)
        rows.append(row)
        if row["status"] == "needs_manual":
            manual_rows.append(row)

    for item in config.get("ai_prompts", []):
        row = manual_ai_prompt(item, run_id)
        rows.append(row)
        manual_rows.append(row)

    metrics_path = out_dir / "metrics.csv"
    run_metrics_path = run_dir / "metrics.csv"
    append_rows(metrics_path, rows)
    write_rows(run_metrics_path, rows)
    if manual_rows:
        write_rows(run_dir / "manual_tasks.csv", manual_rows)

    summary = {
        "run_id": run_id,
        "metrics_path": str(metrics_path),
        "run_metrics_path": str(run_metrics_path),
        "manual_tasks_path": str(run_dir / "manual_tasks.csv") if manual_rows else "",
        "rows": len(rows),
        "manual_rows": len(manual_rows),
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
