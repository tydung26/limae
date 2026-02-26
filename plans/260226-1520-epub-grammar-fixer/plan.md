---
title: "EPUB Grammar Fixer"
description: "TypeScript CLI + Claude skill to fix grammar in EPUB files chapter-by-chapter using Claude API, with a changes summary report"
status: pending
priority: P1
effort: 3h
tags: [typescript, epub, claude-api, cli, skill]
created: 2026-02-26
---

# EPUB Grammar Fixer

## Overview

Local TypeScript tool that processes an EPUB file, corrects grammar chapter-by-chapter using Claude Haiku API, and produces a corrected EPUB + detailed changes summary. Accessible via a project-scope Claude skill (`/fix-grammar`).

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Project Setup | Pending | 30m | [phase-01](./phase-01-project-setup.md) |
| 2 | Implementation | Pending | 2h | [phase-02-implementation](./phase-02-implementation.md) |
| 3 | Claude Skill | Pending | 30m | [phase-03-claude-skill](./phase-03-claude-skill.md) |

## File Ownership

```
Phase 1: package.json, tsconfig.json
Phase 2: src/fix-grammar.ts, src/epub-processor.ts, src/grammar-fixer.ts
Phase 3: .claude/skills/fix-grammar/SKILL.md
```

## Dependencies

- `@anthropic-ai/sdk` — Claude API
- `jszip` — EPUB (ZIP) read/write
- `cheerio` — XHTML parsing
- `tsx` + `typescript` — run TS directly
