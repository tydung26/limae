# Limae

> *The final file. Before you publish.*

AI-powered EPUB grammar fixer. Extracts your ebook, fixes grammar chapter-by-chapter using Claude Haiku, and repacks it — preserving your original voice and style.

## What it does

- Fixes grammar, spelling, and punctuation errors
- Preserves the author's original voice, tone, and word choices
- Detects the natural language of the text (no translation)
- Processes 4 chapters concurrently for speed
- Outputs a before/after changes report

## Output

Given `mybook.epub`, it produces:

| File | Description |
|------|-------------|
| `mybook/` | Extracted EPUB folder (inspectable) |
| `mybook-fixed.epub` | Repacked corrected EPUB |
| `mybook-changes.md` | Per-chapter changes table |

## Requirements

- Node.js 20+
- `ANTHROPIC_API_KEY` env var

## Setup

```bash
npm install
export ANTHROPIC_API_KEY=sk-...
```

## Usage

```bash
npx tsx src/fix-grammar.ts path/to/mybook.epub
```

Or via Claude Code skill (from this project):

```
/fix-grammar path/to/mybook.epub
```

## Stack

- **Runtime:** TypeScript + Node.js
- **AI:** Claude Haiku (`claude-haiku-4-5-20251001`)
- **EPUB:** jszip + cheerio
