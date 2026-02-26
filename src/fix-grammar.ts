import * as fs from 'fs';
import * as path from 'path';
import { extractEpub, packEpub } from './epub-processor';
import { fixChapterGrammar, FixResult } from './grammar-fixer';

/** Strips HTML tags from a string for plain-text display in the report. */
function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

/** Writes a markdown changes report with a per-chapter before/after table. */
function writeChangesReport(
  reportPath: string,
  inputName: string,
  results: Array<{ name: string; result: FixResult }>
): void {
  const totalFixes = results.reduce((sum, r) => sum + r.result.changesCount, 0);
  const modifiedCount = results.filter(r => r.result.changesCount > 0).length;

  const lines: string[] = [
    `# Grammar Fix Report: ${inputName}`,
    `Generated: ${new Date().toISOString().split('T')[0]}`,
    '',
    '## Summary',
    `- Chapters processed: ${results.length}`,
    `- Chapters modified: ${modifiedCount}`,
    `- Total fixes: ${totalFixes}`,
    '',
    '---',
    '',
  ];

  for (const { name, result } of results) {
    lines.push(`## ${name} — ${result.changesCount} fix(es)`);
    if (result.changesCount === 0) {
      lines.push('_No changes._');
    } else {
      lines.push('', '| # | Original | Fixed |', '|---|----------|-------|');
      result.changes.forEach((c, i) => {
        const original = stripTags(c.original).replace(/\|/g, '\\|');
        const fixed = stripTags(c.fixed).replace(/\|/g, '\\|');
        lines.push(`| ${i + 1} | ${original} | ${fixed} |`);
      });
    }
    lines.push('');
  }

  fs.writeFileSync(reportPath, lines.join('\n'));
}

async function main(): Promise<void> {
  const inputPath = process.argv[2];

  if (!inputPath) {
    console.error('Usage: npx tsx src/fix-grammar.ts <input.epub>');
    process.exit(1);
  }

  const resolvedPath = path.resolve(inputPath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    process.exit(1);
  }

  const inputDir = path.dirname(resolvedPath);
  const basename = path.basename(resolvedPath, path.extname(resolvedPath));
  const extractDir = path.join(inputDir, basename);
  const outputEpub = path.join(inputDir, `${basename}-fixed.epub`);
  const changesReport = path.join(inputDir, `${basename}-changes.md`);

  fs.mkdirSync(extractDir, { recursive: true });

  console.log(`\n📚 ${path.basename(resolvedPath)}`);
  const chapters = await extractEpub(resolvedPath, extractDir);
  console.log(`   Extracted to : ${extractDir}`);
  console.log(`   Chapters     : ${chapters.length}\n`);

  const CHUNK_SIZE = 4; // process up to 4 chapters concurrently
  const results: Array<{ name: string; result: FixResult }> = new Array(chapters.length);

  for (let i = 0; i < chapters.length; i += CHUNK_SIZE) {
    const chunk = chapters.slice(i, i + CHUNK_SIZE);
    const end = Math.min(i + CHUNK_SIZE, chapters.length);
    console.log(`  Processing chapters ${i + 1}–${end} of ${chapters.length}...`);

    const chunkResults = await Promise.all(
      chunk.map(async (chapter) => {
        const name = path.basename(chapter.filePath);
        const result = await fixChapterGrammar(chapter.filePath, name);
        fs.writeFileSync(chapter.filePath, result.content); // write fixed content back in-place
        return { name, result };
      })
    );

    // Print results for this chunk in order, then store
    chunkResults.forEach(({ name, result }, j) => {
      console.log(`    [${i + j + 1}/${chapters.length}] ${name}: ${result.changesCount} fix(es)`);
      results[i + j] = { name, result };
    });
  }

  await packEpub(extractDir, outputEpub);
  writeChangesReport(changesReport, path.basename(resolvedPath), results);

  const totalFixes = results.reduce((sum, r) => sum + r.result.changesCount, 0);
  const modified = results.filter(r => r.result.changesCount > 0);

  console.log('\n──────────────────────────────────');
  console.log('📝 Summary');
  console.log(`   Chapters processed : ${chapters.length}`);
  console.log(`   Chapters modified  : ${modified.length}`);
  console.log(`   Total fixes        : ${totalFixes}`);
  console.log(`   Extracted folder   : ${extractDir}`);
  console.log(`   Output EPUB        : ${outputEpub}`);
  console.log(`   Changes report     : ${changesReport}`);
  if (modified.length > 0) {
    console.log('\n   Modified chapters:');
    modified.forEach(r => console.log(`     • ${r.name} — ${r.result.changesCount} fix(es)`));
  }
  console.log('──────────────────────────────────\n');
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
