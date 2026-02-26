---
name: fix-grammar
description: "AI-powered EPUB grammar fixer. Extracts EPUB to folder, processes chapters through Claude Haiku (grammar/spelling/punctuation), repacks into fixed EPUB with per-chapter changes report."
argument-hint: "<path-to-epub>"
license: MIT
---

# Fix Grammar

AI-powered EPUB grammar fixer. Extracts the EPUB to a folder, processes 4 chapters
concurrently through Claude Haiku, and repacks into a fixed EPUB with a per-chapter
changes report.

## When to Use

- Fix grammar, spelling, and punctuation errors in an EPUB ebook
- Preserve author's original voice and style — no rephrasing
- Process multilingual ebooks (auto-detects language, does not translate)

## Usage

```
/fix-grammar <path-to-epub>
```

## Execution

Run this command with the provided EPUB path argument:

```
npx tsx src/fix-grammar.ts <path-to-epub>
```

Show the full command output to the user.

## Output

All output files are placed in the same directory as the input:

| File                | Description                               |
| ------------------- | ----------------------------------------- |
| `{name}/`           | Extracted EPUB folder (kept, inspectable) |
| `{name}-fixed.epub` | Repacked corrected EPUB                   |
| `{name}-changes.md` | Per-chapter before/after changes table    |

## Errors

- Missing argument → show usage: `npx tsx src/fix-grammar.ts <input.epub>`
- File not found → confirm the path exists and is a valid `.epub` file
