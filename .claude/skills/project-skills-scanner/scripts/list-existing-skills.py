#!/usr/bin/env python3
"""
list-existing-skills.py
Reads all .claude/skills/*/SKILL.md files and prints their name + description
from the frontmatter, so the scanner can avoid proposing duplicate skills.

Usage: python3 .claude/skills/project-skills-scanner/scripts/list-existing-skills.py
"""

import sys
import re
from pathlib import Path


def extract_frontmatter(path: Path) -> dict[str, str]:
    """Extract name and description from YAML frontmatter block."""
    text = path.read_text(encoding="utf-8")
    match = re.match(r"^---\n(.*?)\n---", text, re.DOTALL)
    if not match:
        return {}

    result: dict[str, str] = {}
    for line in match.group(1).splitlines():
        if line.startswith("name:"):
            result["name"] = line.split(":", 1)[1].strip()
        elif line.startswith("description:"):
            result["description"] = line.split(":", 1)[1].strip()
    return result


def main() -> None:
    skills_dir = Path(".claude/skills")
    if not skills_dir.exists():
        print("No .claude/skills/ directory found — no existing skills to exclude.", file=sys.stdout)
        return

    skill_files = sorted(skills_dir.glob("*/SKILL.md"))
    if not skill_files:
        print("No SKILL.md files found in .claude/skills/.", file=sys.stdout)
        return

    print("Existing skills (avoid proposing duplicates for these):")
    for skill_file in skill_files:
        meta = extract_frontmatter(skill_file)
        name = meta.get("name", skill_file.parent.name)
        desc = meta.get("description", "(no description)")
        # Truncate long descriptions for readability
        if len(desc) > 120:
            desc = desc[:117] + "..."
        print(f"  - {name}: {desc}")


if __name__ == "__main__":
    main()
