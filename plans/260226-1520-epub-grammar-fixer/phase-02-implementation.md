---
phase: 2
title: "Implementation"
status: pending
priority: P1
effort: 2h
---

# Phase 2 — Implementation

## Overview

Three focused TypeScript modules under `src/`:

```
src/
├── epub-processor.ts    # Extract EPUB to disk folder, parse OPF for chapters, repack
├── grammar-fixer.ts     # Claude Haiku API, batch paragraph fixing, change tracking
└── fix-grammar.ts       # CLI: orchestrate, progress output, summary to console + .md report
```

## Architecture & Data Flow

```
input: ~/books/mybook.epub
         │
         ▼
  extractEpub()
         │  jszip → extract ALL files to disk
         ▼
  ~/books/mybook/              ← extracted folder (kept after processing)
    ├── META-INF/container.xml
    ├── OEBPS/content.opf
    ├── OEBPS/Text/ch001.xhtml  ◄─┐
    ├── OEBPS/Text/ch002.xhtml  ◄─┤  grammar fix (read → fix → write back in-place)
    ├── OEBPS/Images/...            │
    └── ...                     ◄─┘
         │
         ▼
  packEpub()
         │  walk folder → new JSZip → write
         ▼
  ~/books/mybook-fixed.epub    ← repacked output
         │
         ▼
  ~/books/mybook-changes.md    ← per-chapter changes report
```

---

## Module 1: `src/epub-processor.ts`

**Exports:**
```typescript
export interface Chapter {
  id: string;       // itemref idref from OPF spine
  filePath: string; // absolute path on disk (within extractDir)
  zipPath: string;  // relative path inside ZIP (for repacking)
}

export async function extractEpub(
  inputPath: string,
  extractDir: string
): Promise<Chapter[]>

export async function packEpub(
  extractDir: string,
  outputPath: string
): Promise<void>
```

**`extractEpub` flow:**
1. `jszip.loadAsync(fs.readFileSync(inputPath))`
2. For every file in zip (skip dirs): write to `path.join(extractDir, zipPath)`, create parent dirs
3. Parse `META-INF/container.xml` from disk → find OPF path
4. Parse OPF → build manifest (xhtml items only) + spine order
5. Resolve chapter file paths: `path.join(extractDir, opfDir, itemHref)`
6. Return ordered `Chapter[]`

**`packEpub` flow:**
1. Create new `JSZip`
2. If `mimetype` file exists in extractDir: add first, `compression: 'STORE'`
3. Walk all other files recursively → add with relative path, `compression: 'DEFLATE'`
4. `zip.generateAsync({ type: 'nodebuffer' })` → write to `outputPath`

**Edge cases:**
- OPF at root (opfDir = "")
- Skip non-xhtml spine items (nav, cover image pages)
- Use `path.posix` for ZIP paths (always forward slashes)

---

## Module 2: `src/grammar-fixer.ts`

**Exports:**
```typescript
export interface FixResult {
  content: string;  // corrected XHTML string
  changesCount: number;
  changes: Array<{ original: string; fixed: string }>;
}

export async function fixChapterGrammar(
  chapterPath: string,  // absolute path to .xhtml file on disk
  chapterName: string
): Promise<FixResult>
```

**Flow:**
1. `fs.readFileSync(chapterPath, 'utf8')` → raw XHTML
2. `cheerio.load(content)` (xmlMode: false — tolerant HTML)
3. Collect `p, h1, h2, h3, h4, h5, h6, li, blockquote` where `text.length > 15`
4. Batch into groups of 30: `Array<{ id: number; html: string }>` (using `$(el).html()`)
5. Per batch → Claude API:
   - Model: `claude-haiku-4-5-20251001`
   - `max_tokens: 4096`
   - Prompt: fix grammar/spelling/punctuation in text content, preserve all HTML tags exactly, return JSON array `[{id, html}]`
6. Parse response: extract with `/\[[\s\S]*\]/` regex for safety
7. Apply `$(el).html(fixedHtml)` for changed items, track `{original, fixed}` pairs
8. Return `{ content: $.html(), changesCount, changes }`

**Error handling:**
- JSON parse fail → warn + return original content unchanged (0 changes)
- Length mismatch → warn + return original unchanged
- API error → propagate to CLI

**Prompt template:**
```
Fix grammar, spelling, and punctuation in each HTML fragment.
Preserve all HTML tags and attributes exactly. Only fix text content.
Return ONLY a JSON array with structure [{id: number, html: string}].

Input: [{"id":0,"html":"He <em>runed</em> to store."},...]
```

---

## Module 3: `src/fix-grammar.ts`

**Responsibility:** CLI entry. Load → extract → fix chapters → repack → report.

**Usage:** `npx tsx src/fix-grammar.ts <input.epub>`

**Flow:**
1. Parse `process.argv[2]` — exit with usage if missing, error if file not found
2. Derive paths:
   - `extractDir` = `{inputDir}/{basename}` (no extension)
   - `outputEpub` = `{inputDir}/{basename}-fixed.epub`
   - `changesReport` = `{inputDir}/{basename}-changes.md`
3. Create `extractDir` (`fs.mkdirSync(..., { recursive: true })`)
4. `extractEpub(inputPath, extractDir)` → `chapters`
5. Print: `📚 {basename}.epub — {N} chapters\n`
6. For each chapter `[i/total]`:
   - `process.stdout.write(`  [{i+1}/{total}] {name}... `)`
   - `fixChapterGrammar(chapter.filePath, name)` → result
   - Write fixed content back to disk: `fs.writeFileSync(chapter.filePath, result.content)`
   - Print: `{changesCount} fix(es)\n`
   - Accumulate results
7. `packEpub(extractDir, outputEpub)`
8. Write `{basename}-changes.md`
9. Print summary

**Console summary:**
```
──────────────────────────────────
📝 Summary
   Chapters processed : 12
   Chapters modified  : 9
   Total fixes        : 147
   Extracted folder   : ~/books/mybook/
   Output EPUB        : ~/books/mybook-fixed.epub
   Changes report     : ~/books/mybook-changes.md
──────────────────────────────────
```

**Changes report (`{basename}-changes.md`):**
```markdown
# Grammar Fix Report: mybook.epub
Generated: 2026-02-26

## Summary
- Chapters processed: 12
- Chapters modified: 9
- Total fixes: 147

---

## ch001.xhtml — 12 fixes

| # | Original | Fixed |
|---|----------|-------|
| 1 | He runed quickly. | He ran quickly. |
| 2 | She don't know. | She doesn't know. |

## ch002.xhtml — 0 fixes
_No changes._
```

---

## Files to Create

| File | Lines (est.) |
|------|-------------|
| `src/epub-processor.ts` | ~90 |
| `src/grammar-fixer.ts` | ~100 |
| `src/fix-grammar.ts` | ~80 |

## Todo

- [ ] `src/epub-processor.ts` — extractEpub, packEpub
- [ ] `src/grammar-fixer.ts` — fixChapterGrammar, batch logic
- [ ] `src/fix-grammar.ts` — CLI, orchestration, report writer

## Success Criteria

- `npx tsx src/fix-grammar.ts mybook.epub` produces:
  - `mybook/` folder (extracted, fixed files in-place)
  - `mybook-fixed.epub` (valid, openable in ebook reader)
  - `mybook-changes.md` (markdown table per chapter)
- Console shows per-chapter progress + final summary
- Chapters with no grammar errors: 0 fixes, not modified on disk

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| JSON parse failure from Claude | Regex extract + fallback to original |
| Large chapter exceeds token limit | Batch 30 items max per API call |
| HTML tag corruption | Use innerHTML round-trip, instruct Claude to preserve tags |
| OPF path resolution errors | Use `path.posix.join`, handle empty opfDir |
| EPUB mimetype ordering/compression | Add mimetype first with STORE compression |
| extractDir already exists | `mkdirSync` with `recursive: true` (idempotent) |
