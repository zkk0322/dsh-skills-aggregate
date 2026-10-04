#!/usr/bin/env python
"""Verify local README image references, dimensions, and basic render health."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from PIL import Image, ImageStat


MARKDOWN_IMAGE = re.compile(r"!\[([^\]]*)\]\(([^)\s]+)(?:\s+['\"][^'\"]*['\"])?\)")
HTML_IMAGE = re.compile(r"<img\b[^>]*\bsrc=['\"]([^'\"]+)['\"][^>]*>", re.IGNORECASE)
HTML_ALT = re.compile(r"\balt=['\"]([^'\"]*)['\"]", re.IGNORECASE)
README_CANDIDATES = ("README.md", "README_zh.md", "README.en.md", "README_EN.md")


def parse_expected_size(value: str) -> tuple[str, tuple[int, int]]:
    try:
        path, size = value.rsplit("=", 1)
        width, height = size.lower().split("x", 1)
        return path.replace("\\", "/"), (int(width), int(height))
    except ValueError as exc:
        raise argparse.ArgumentTypeError("expected PATH=WIDTHxHEIGHT") from exc


def image_refs(markdown: str) -> list[dict[str, str]]:
    refs = [
        {"src": match.group(2), "alt": match.group(1).strip(), "syntax": "markdown"}
        for match in MARKDOWN_IMAGE.finditer(markdown)
    ]
    for match in HTML_IMAGE.finditer(markdown):
        tag = match.group(0)
        alt_match = HTML_ALT.search(tag)
        refs.append({
            "src": match.group(1),
            "alt": alt_match.group(1).strip() if alt_match else "",
            "alt_present": bool(alt_match),
            "syntax": "html",
        })
    return refs


def is_remote(src: str) -> bool:
    lowered = src.lower()
    return lowered.startswith(("http://", "https://", "data:", "#"))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", type=Path, default=Path.cwd())
    parser.add_argument("--readme", action="append", default=[])
    parser.add_argument("--expected-size", action="append", default=[], type=parse_expected_size)
    args = parser.parse_args()

    repo = args.repo.expanduser().resolve()
    expected_sizes = dict(args.expected_size)
    readme_names = args.readme or [name for name in README_CANDIDATES if (repo / name).exists()]
    errors: list[str] = []
    warnings: list[str] = []
    readme_results: list[dict] = []
    seen_local_paths: set[str] = set()

    if not readme_names:
        errors.append("no README files found")

    local_counts: dict[str, int] = {}
    for name in readme_names:
        readme_path = (repo / name).resolve()
        if repo not in readme_path.parents and readme_path != repo:
            errors.append(f"README escapes repository: {name}")
            continue
        if not readme_path.exists():
            errors.append(f"README not found: {name}")
            continue

        refs = image_refs(readme_path.read_text(encoding="utf-8"))
        images: list[dict] = []
        for ref in refs:
            src = ref["src"]
            if is_remote(src):
                images.append({**ref, "remote": True})
                continue
            normalized = src.split("#", 1)[0].split("?", 1)[0]
            image_path = (readme_path.parent / normalized).resolve()
            if repo not in image_path.parents:
                errors.append(f"image escapes repository: {name} -> {src}")
                continue
            item = {**ref, "remote": False, "path": image_path.relative_to(repo).as_posix()}
            seen_local_paths.add(item["path"])
            if ref["syntax"] == "markdown" and not ref["alt"]:
                errors.append(f"missing alt text: {name} -> {src}")
            if not image_path.exists():
                errors.append(f"missing image: {name} -> {src}")
                images.append(item)
                continue
            if image_path.suffix.lower() == ".svg":
                item["vector"] = True
                images.append(item)
                continue
            try:
                with Image.open(image_path) as image:
                    width, height = image.size
                    rgb = image.convert("RGB")
                    stat = ImageStat.Stat(rgb.resize((32, 32)))
                    extrema = rgb.getextrema()
                    luminance = sum(stat.mean) / 3
                    dynamic_range = max(high for _, high in extrema) - min(low for low, _ in extrema)
                item.update({"width": width, "height": height})
                expected = expected_sizes.get(item["path"])
                if expected and (width, height) != expected:
                    errors.append(
                        f"wrong dimensions: {item['path']} is {width}x{height}, expected {expected[0]}x{expected[1]}"
                    )
                if dynamic_range <= 10 and max(stat.stddev) <= 3:
                    errors.append(f"probable blank or uniform render: {item['path']}")
            except Exception as exc:
                errors.append(f"unreadable image: {item['path']}: {exc}")
            images.append(item)

        local_counts[name] = sum(1 for item in images if not item.get("remote"))
        readme_results.append({"readme": name, "images": images})

    if len(local_counts) > 1 and len(set(local_counts.values())) > 1:
        warnings.append(f"localized README local-image counts differ: {local_counts}")
    for expected_path in sorted(set(expected_sizes) - seen_local_paths):
        errors.append(f"expected-size path is not referenced by inspected READMEs: {expected_path}")

    report = {
        "ok": not errors,
        "repo": str(repo),
        "errors": errors,
        "warnings": warnings,
        "readmes": readme_results,
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
