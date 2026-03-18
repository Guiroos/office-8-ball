#!/usr/bin/env python3
"""Validate rule content for tone, length, and structure."""

import argparse
import re
import sys


FIRST_SECOND_PERSON = re.compile(
    r'\b(I|me|my|mine|myself|you|your|yours|yourself|we|our|ours|ourselves)\b',
    re.IGNORECASE,
)

VAGUE_TERMS = re.compile(
    r'\b(good|bad|proper|properly|nice|nicely|appropriate|appropriately|best practice)\b',
    re.IGNORECASE,
)


def validate_content(text: str) -> list[str]:
    """Validate a rule's text content. Returns list of error messages."""
    errors = []

    # Check for first/second person
    matches = FIRST_SECOND_PERSON.findall(text)
    if matches:
        errors.append(
            f'TONE ERROR: Found first/second-person terms: {", ".join(set(matches))}. '
            'Use third-person imperative instead.'
        )

    # Check for vague terms
    matches = VAGUE_TERMS.findall(text)
    if matches:
        errors.append(
            f'SPECIFICITY WARNING: Found vague terms: {", ".join(set(matches))}. '
            'Replace with concrete, actionable language.'
        )

    # Check sentence count (rough heuristic)
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip() and len(s.strip()) > 10]
    if len(sentences) > 7:
        errors.append(
            f'LENGTH WARNING: Rule has ~{len(sentences)} sentences. '
            'Target 2-5 sentences per rule for conciseness.'
        )

    return errors


def validate_file(filepath: str) -> list[str]:
    """Validate a complete rule file. Returns list of error messages."""
    errors = []

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        return [f'FILE ERROR: {filepath} not found.']
    except Exception as e:
        return [f'FILE ERROR: Could not read {filepath}: {e}']

    lines = content.strip().split('\n')

    # Check frontmatter validity
    if lines[0] == '---':
        try:
            end_idx = lines.index('---', 1)
            frontmatter = '\n'.join(lines[1:end_idx])
            body_lines = lines[end_idx + 1:]

            # Check paths field format
            if 'paths:' in frontmatter:
                path_lines = [l for l in frontmatter.split('\n') if l.strip().startswith('- ')]
                for pl in path_lines:
                    pattern = pl.strip().lstrip('- ').strip('"\'')
                    if not pattern:
                        errors.append('FRONTMATTER ERROR: Empty path pattern found.')
        except ValueError:
            errors.append('FRONTMATTER ERROR: Unclosed frontmatter (missing closing ---).')
            body_lines = lines
    else:
        body_lines = lines

    body = '\n'.join(body_lines)

    # Check for heading structure
    headings = [l for l in body_lines if l.startswith('#')]
    if not headings:
        errors.append('STRUCTURE ERROR: No markdown headings found. Add at least one # heading.')

    # Check line count
    non_empty = [l for l in body_lines if l.strip()]
    if len(non_empty) > 50:
        errors.append(
            f'SIZE WARNING: File has {len(non_empty)} non-empty lines. '
            'Target under 50 lines to avoid context bloat. Consider splitting.'
        )

    # Validate rule content tone
    # Extract only bullet/paragraph content (skip headings and frontmatter)
    rule_text = ' '.join(
        l.lstrip('- ').strip()
        for l in body_lines
        if l.strip() and not l.startswith('#') and not l.startswith('---')
    )
    if rule_text:
        errors.extend(validate_content(rule_text))

    return errors


def main():
    parser = argparse.ArgumentParser(description='Validate Claude Code rule files or content.')
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--content', type=str, help='Rule text content to validate.')
    group.add_argument('--file', type=str, help='Path to a .claude/rules/ markdown file.')
    args = parser.parse_args()

    if args.content:
        errors = validate_content(args.content)
    else:
        errors = validate_file(args.file)

    if errors:
        for err in errors:
            print(err, file=sys.stderr)
        sys.exit(1)
    else:
        print('SUCCESS: Rule content is valid.')
        sys.exit(0)


if __name__ == '__main__':
    main()
