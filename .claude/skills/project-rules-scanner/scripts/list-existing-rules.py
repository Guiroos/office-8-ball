#!/usr/bin/env python3
"""
list-existing-rules.py
Reads all .claude/rules/*.md files and prints a deduplicated list of
topics/headings already documented, so the scanner can avoid duplicates.

Usage: python3 .claude/skills/project-rules-scanner/scripts/list-existing-rules.py
"""

import sys
import re
from pathlib import Path


def extract_topics(path: Path) -> list[str]:
    topics = []
    for line in path.read_text(encoding="utf-8").splitlines():
        m = re.match(r"^#{1,3}\s+(.+)", line)
        if m:
            topics.append(f"[{path.name}] {m.group(1).strip()}")
    return topics


def main() -> None:
    rules_dir = Path(".claude/rules")
    if not rules_dir.exists():
        print("No .claude/rules/ directory found — no existing topics to exclude.", file=sys.stdout)
        return

    all_topics: list[str] = []
    for md_file in sorted(rules_dir.glob("*.md")):
        all_topics.extend(extract_topics(md_file))

    if not all_topics:
        print("No headings found in existing rule files.", file=sys.stdout)
        return

    print("Existing documented topics (skip these in the scan):")
    for topic in all_topics:
        print(f"  - {topic}")


if __name__ == "__main__":
    main()
