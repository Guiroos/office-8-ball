#!/usr/bin/env python3
"""Audit a CLAUDE.md file for anti-patterns and token budget violations."""

import argparse
import re
import sys


ANTI_PATTERNS = [
    {
        "id": "AP-01",
        "label": "Style rules belong in a linter",
        "patterns": [r"\bindent(ation)?\b", r"\bsemicolon\b", r"\bquote style\b", r"\bprettier\b.*rule", r"\bspace(s)? per tab\b"],
        "message": "Style rules detected. Move to .eslintrc / prettier.config.js and remove from CLAUDE.md.",
    },
    {
        "id": "AP-03",
        "label": "Vague instructions",
        "patterns": [r"\bwrite clean code\b", r"\bfollow best practices\b", r"\bbe careful\b", r"\buse good judgment\b"],
        "message": "Vague instruction detected. Replace with a specific, actionable rule.",
    },
    {
        "id": "AP-04",
        "label": "Long prose paragraphs",
        "patterns": [],
        "paragraph_threshold": 4,  # consecutive non-bullet lines
        "message": "Long prose paragraph detected. Rewrite as bullet-point imperatives.",
    },
]

REQUIRED_SECTIONS = [
    "common commands",
    "tech stack",
]


def check_line_count(lines):
    errors = []
    count = len(lines)
    if count > 300:
        errors.append(f"LINE-COUNT ERROR: {count} lines exceeds the 300-line hard limit. Extract the largest section to .claude/rules/ and use an @import.")
    elif count > 150:
        errors.append(f"LINE-COUNT WARNING: {count} lines exceeds the 150-line target. Consider pruning or using @imports.")
    return errors


def check_anti_patterns(lines):
    errors = []
    consecutive_prose = 0
    for i, line in enumerate(lines, 1):
        stripped = line.strip()

        # Check paragraph length
        is_prose = stripped and not stripped.startswith(("#", "-", "*", ">", "|", "@", "`", "!"))
        if is_prose:
            consecutive_prose += 1
            if consecutive_prose >= ANTI_PATTERNS[-1].get("paragraph_threshold", 4):
                errors.append(f"AP-04 (line {i}): Long prose paragraph. Rewrite as bullet-point imperatives.")
                consecutive_prose = 0
        else:
            consecutive_prose = 0

        # Check regex patterns
        for ap in ANTI_PATTERNS:
            for pattern in ap.get("patterns", []):
                if re.search(pattern, stripped, re.IGNORECASE):
                    errors.append(f"{ap['id']} (line {i}): {ap['message']}")
                    break

    return errors


def check_required_sections(content):
    errors = []
    content_lower = content.lower()
    for section in REQUIRED_SECTIONS:
        if section not in content_lower:
            errors.append(f"MISSING-SECTION: No '{section}' section found. Add one with exact runnable command strings.")
    return errors


def check_vague_project_overview(lines):
    errors = []
    in_overview = False
    for line in lines:
        lower = line.lower()
        if "project overview" in lower or "## overview" in lower:
            in_overview = True
            continue
        if in_overview and line.startswith("##"):
            break
        if in_overview:
            stripped = line.strip()
            if stripped and len(stripped) > 120:
                errors.append("AP-04 (overview): Project overview exceeds one sentence. Trim to a single high-signal sentence.")
    return errors


def main():
    parser = argparse.ArgumentParser(description="Audit a CLAUDE.md file for anti-patterns.")
    parser.add_argument("--file", required=True, help="Path to CLAUDE.md file")
    args = parser.parse_args()

    try:
        with open(args.file, "r", encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        print(f"ERROR: File not found: {args.file}", file=sys.stderr)
        sys.exit(1)

    lines = content.splitlines()
    errors = []

    errors.extend(check_line_count(lines))
    errors.extend(check_anti_patterns(lines))
    errors.extend(check_required_sections(content))
    errors.extend(check_vague_project_overview(lines))

    if errors:
        for e in errors:
            print(e, file=sys.stderr)
        sys.exit(1)
    else:
        print(f"SUCCESS: {args.file} passes all anti-pattern checks ({len(lines)} lines).")
        sys.exit(0)


if __name__ == "__main__":
    main()
