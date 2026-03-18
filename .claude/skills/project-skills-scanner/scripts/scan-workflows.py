#!/usr/bin/env python3
"""
scan-workflows.py
Scans the project for automatable workflows: npm scripts, Makefile targets,
and scripts/ directory contents. Groups npm scripts by inferred category.

Usage: python3 .claude/skills/project-skills-scanner/scripts/scan-workflows.py
"""

import sys
import json
import re
from pathlib import Path


CATEGORY_PATTERNS: list[tuple[str, list[str]]] = [
    ("dev / build", ["dev", "build", "start", "preview", "compile"]),
    ("test", ["test", "e2e", "coverage", "spec", "playwright", "vitest"]),
    ("lint / format", ["lint", "format", "check", "typecheck", "tsc"]),
    ("database", ["prisma", "migrate", "seed", "db", "studio"]),
    ("release / deploy", ["release", "deploy", "publish", "version", "tag"]),
    ("codegen", ["generate", "gen", "codegen", "openapi", "graphql"]),
]


def categorize_script(name: str) -> str:
    lower = name.lower()
    for category, keywords in CATEGORY_PATTERNS:
        if any(k in lower for k in keywords):
            return category
    return "other"


def scan_npm_scripts() -> None:
    pkg = Path("package.json")
    if not pkg.exists():
        print("  [skip] package.json not found", file=sys.stderr)
        return

    data = json.loads(pkg.read_text(encoding="utf-8"))
    scripts: dict[str, str] = data.get("scripts", {})
    if not scripts:
        print("  No scripts found in package.json.")
        return

    grouped: dict[str, list[tuple[str, str]]] = {}
    for name, cmd in scripts.items():
        cat = categorize_script(name)
        grouped.setdefault(cat, []).append((name, cmd))

    print("=== npm scripts (package.json) ===")
    for cat in [c for c, _ in CATEGORY_PATTERNS] + ["other"]:
        if cat not in grouped:
            continue
        print(f"\n  [{cat}]")
        for name, cmd in grouped[cat]:
            print(f"    {name}: {cmd}")


def scan_makefile() -> None:
    makefile = Path("Makefile")
    if not makefile.exists():
        return

    print("\n=== Makefile targets ===")
    targets = []
    for line in makefile.read_text(encoding="utf-8").splitlines():
        m = re.match(r"^([a-zA-Z][a-zA-Z0-9_-]*):", line)
        if m and not m.group(1).startswith("."):
            targets.append(m.group(1))
    for t in targets:
        print(f"  {t}")


def scan_scripts_dir() -> None:
    scripts_dir = Path("scripts")
    if not scripts_dir.exists():
        return

    files = sorted(scripts_dir.iterdir())
    if not files:
        return

    print("\n=== scripts/ directory ===")
    for f in files:
        if f.is_file():
            print(f"  {f.name}")


def main() -> None:
    scan_npm_scripts()
    scan_makefile()
    scan_scripts_dir()


if __name__ == "__main__":
    main()
