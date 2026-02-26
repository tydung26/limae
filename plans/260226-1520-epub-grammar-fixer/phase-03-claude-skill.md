---
phase: 3
title: "Claude Skill"
status: pending
priority: P2
effort: 30m
---

# Phase 3 — Claude Skill

## Overview

Project-scope Claude skill at `.claude/skills/fix-grammar/SKILL.md` so the tool is invokable as `/fix-grammar <path>` from within Claude Code in this project.

## Files to Create

- `.claude/skills/fix-grammar/SKILL.md`

## Implementation

The skill instructs Claude to run the TypeScript script with the provided EPUB path.

**`.claude/skills/fix-grammar/SKILL.md` content:**

```markdown
# Fix Grammar Skill

AI-powered EPUB grammar fixer. Processes each chapter through Claude Haiku,
corrects grammar/spelling/punctuation, outputs a fixed EPUB + changes report.

## Usage

/fix-grammar <path-to-epub>

## Execution

Run the following command with the provided epub path:

npx tsx src/fix-grammar.ts <path-to-epub>

Show the command output to the user as-is.
If ANTHROPIC_API_KEY is not set, inform the user to export it first.
If the file path is missing, show usage: npx tsx src/fix-grammar.ts <input.epub>

## Output

- {name}-fixed.epub  — corrected ebook
- {name}-changes.md  — per-chapter changes table
```

## Todo

- [ ] Create `.claude/skills/fix-grammar/` directory
- [ ] Create `.claude/skills/fix-grammar/SKILL.md`

## Success Criteria

- `/fix-grammar mybook.epub` is recognized as a skill in this project
- Claude runs the script and displays output
