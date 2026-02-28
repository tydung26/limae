---
name: vn-grammar-fix
description: "Interactive Vietnamese ebook grammar fixer. Extracts EPUB, Claude Code reads each chapter to find Vietnamese grammar/spelling/punctuation mistakes, asks user approval for each fix, then repacks into fixed EPUB. No API key needed."
argument-hint: "<path-to-epub>"
license: MIT
---

# Vietnamese Grammar Fix Skill

## When to Use
- Fix Vietnamese grammar, spelling, punctuation in EPUB ebooks
- Interactive chapter-by-chapter review with user approval
- No external API key required — Claude Code does the analysis directly

## Usage
```
/vn-grammar-fix path/to/book.epub
```

## Workflow

### Step 1: Extract EPUB
Run the extraction using the project's existing epub-processor:
```bash
npx tsx -e "
const { extractEpub } = require('./src/epub-processor');
const path = require('path');
const input = process.argv[1];
const base = path.join(path.dirname(input), path.basename(input, '.epub'));
extractEpub(input, base).then(chapters => {
  console.log(JSON.stringify(chapters, null, 2));
});
" "<epub-path>"
```

**If the above fails**, extract manually:
1. Copy the EPUB to `{basename}/` folder next to the original
2. Use `unzip` to extract: `unzip -o "<epub-path>" -d "<basename>/"`
3. Find chapter XHTML files in the extracted folder (usually under `OEBPS/Text/` or `text/`)
4. Sort chapters by filename to maintain reading order

### Step 2: Process Each Chapter (Interactive)
For each chapter XHTML file, in order:

1. **Read** the chapter file using the Read tool
2. **Analyze** the Vietnamese text for grammar/spelling/punctuation mistakes ONLY:
   - Sai chính tả (spelling errors)
   - Sai ngữ pháp (grammar errors)
   - Sai dấu câu (punctuation errors)
   - Thiếu dấu tiếng Việt (missing Vietnamese diacritics)
   - Dùng sai từ đồng âm (wrong homophone usage)
3. **DO NOT** change:
   - Author's writing style or voice
   - Word choices that are stylistic (not errors)
   - Content, meaning, or structure
   - HTML tags or attributes
   - Formatting or layout
   - Do NOT translate anything
4. **Present findings** to the user using `AskUserQuestion`:
   - Show each mistake with: original text → proposed fix
   - Group by type (spelling, grammar, punctuation)
   - Let user approve/reject each fix individually or in batch
5. **Apply only approved fixes** using the Edit tool on the chapter file
6. **Confirm** changes applied, then move to next chapter

### Step 3: Repack EPUB
After all chapters are processed:
```bash
npx tsx -e "
const { packEpub } = require('./src/epub-processor');
packEpub(process.argv[1], process.argv[2]);
" "<extracted-dir>" "<output-fixed.epub>"
```

**If the above fails**, repack manually:
```bash
cd "<extracted-dir>" && zip -X0 "../<basename>-fixed.epub" mimetype && zip -rX9 "../<basename>-fixed.epub" . -x mimetype
```

### Step 4: Summary Report
Generate a changes report at `<basename>-vn-grammar-changes.md` with:
- Total chapters processed
- Total fixes per chapter
- Table of all changes (original → fixed) grouped by chapter

## Output Files
| File | Description |
|------|-------------|
| `{basename}/` | Extracted EPUB folder |
| `{basename}-fixed.epub` | Repacked corrected EPUB |
| `{basename}-vn-grammar-changes.md` | Per-chapter changes report |

## Important Rules
- **Vietnamese only**: Only fix Vietnamese language grammar mistakes
- **Ask first**: ALWAYS present mistakes to user and wait for approval before editing
- **One chapter at a time**: Complete one chapter fully before moving to the next
- **Preserve everything else**: Do not touch HTML structure, CSS, images, metadata
- **No API key**: Claude Code reads and analyzes the text directly — no external AI calls
- **Be conservative**: When unsure if something is a mistake or stylistic choice, ask the user

## Error Handling
- If EPUB extraction fails, try manual unzip
- If a chapter has no Vietnamese text, skip it
- If repacking fails, try manual zip command
- Always keep the extracted folder for manual inspection

## Example Interaction
```
📖 Chapter 1: chuong-01.xhtml (2,847 words)

Found 3 grammar issues:

1. [Chính tả] Line 45:
   "anh ấy đã di về nhà" → "anh ấy đã đi về nhà"
   (Missing dấu: di → đi)

2. [Ngữ pháp] Line 78:
   "cô ấy rất là đẹp" → "cô ấy rất đẹp"
   (Redundant "là" after "rất")

3. [Dấu câu] Line 102:
   "Tại sao anh lại làm vậy ." → "Tại sao anh lại làm vậy?"
   (Wrong punctuation: period → question mark)

Which fixes do you approve?
```
