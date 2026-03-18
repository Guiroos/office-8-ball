#!/usr/bin/env python3
"""
scan-conventions.py
Scans the project src/ directory to print observed naming and structural
conventions that may not be documented in agent rules.

Usage: python3 .claude/skills/project-rules-scanner/scripts/scan-conventions.py

Outputs groups:
  - File naming patterns
  - Directory layout
  - Test co-location patterns
  - Export conventions (default vs named)
"""

import sys
import re
from pathlib import Path
from collections import Counter, defaultdict


def group_by_pattern(paths: list[Path]) -> dict[str, list[str]]:
    groups: dict[str, list[str]] = defaultdict(list)
    for p in paths:
        name = p.name
        if name.startswith("use-") or name.startswith("use_"):
            groups["hooks"].append(str(p))
        elif ".test." in name or ".spec." in name:
            groups["test files"].append(str(p))
        elif name == "index.tsx" or name == "index.ts":
            groups["index barrels"].append(str(p))
        elif name.endswith(".test.ts") or name.endswith(".test.tsx"):
            groups["test files"].append(str(p))
        elif "-" in name:
            groups["kebab-case files"].append(str(p))
        elif "_" in name:
            groups["snake_case files"].append(str(p))
        else:
            groups["other"].append(str(p))
    return groups


def check_test_colocation(src: Path) -> list[str]:
    findings = []
    test_files = list(src.rglob("*.test.ts")) + list(src.rglob("*.test.tsx"))
    for tf in test_files:
        impl_candidates = [
            tf.parent / tf.name.replace(".test.ts", ".ts"),
            tf.parent / tf.name.replace(".test.tsx", ".tsx"),
        ]
        colocated = any(c.exists() for c in impl_candidates)
        findings.append(f"{'COLOCATED' if colocated else 'SEPARATE'}: {tf}")
    return findings


def detect_export_style(src: Path) -> Counter:
    counter: Counter = Counter()
    for f in list(src.rglob("*.ts")) + list(src.rglob("*.tsx")):
        if ".test." in f.name:
            continue
        try:
            text = f.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        if re.search(r"^export default ", text, re.MULTILINE):
            counter["default exports"] += 1
        named = len(re.findall(r"^export (const|function|class|type|interface) ", text, re.MULTILINE))
        if named:
            counter["named exports"] += named
    return counter


def main() -> None:
    src = Path("src")
    if not src.exists():
        print("ERROR: src/ directory not found. Run from the project root.", file=sys.stderr)
        sys.exit(1)

    all_files = list(src.rglob("*.ts")) + list(src.rglob("*.tsx"))
    print(f"=== File Naming Patterns (total: {len(all_files)} files) ===")
    groups = group_by_pattern(all_files)
    for group, files in groups.items():
        print(f"\n  [{group}] ({len(files)} files)")
        for f in files[:5]:
            print(f"    {f}")
        if len(files) > 5:
            print(f"    ... and {len(files) - 5} more")

    print("\n=== Directory Layout (top-level src/ dirs) ===")
    top_dirs = sorted({p.parent.relative_to(src).parts[0] for p in all_files if p.parent != src})
    for d in top_dirs:
        count = len([f for f in all_files if str(f).startswith(str(src / d))])
        print(f"  src/{d}/  ({count} files)")

    print("\n=== Test Co-location ===")
    coloc = check_test_colocation(src)
    if not coloc:
        print("  No test files found.")
    else:
        colocated = sum(1 for l in coloc if l.startswith("COLOCATED"))
        separate = sum(1 for l in coloc if l.startswith("SEPARATE"))
        print(f"  Colocated with impl: {colocated}")
        print(f"  In separate dir:     {separate}")
        for line in coloc[:8]:
            print(f"    {line}")
        if len(coloc) > 8:
            print(f"    ... and {len(coloc) - 8} more")

    print("\n=== Export Conventions ===")
    export_counts = detect_export_style(src)
    for style, count in export_counts.most_common():
        print(f"  {style}: {count}")


if __name__ == "__main__":
    main()
