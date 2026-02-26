import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as cheerio from 'cheerio';

const client = new Anthropic();
const BATCH_SIZE = 30;
const TEXT_SELECTORS = 'p, h1, h2, h3, h4, h5, h6, li, blockquote';

export interface FixResult {
  content: string;
  changesCount: number;
  changes: Array<{ original: string; fixed: string }>; // innerHTML before/after
}

interface TextItem {
  id: number;
  html: string;
}

/**
 * Sends a batch of HTML fragments to Claude Haiku for grammar correction.
 * Returns a map of element id → corrected innerHTML.
 */
async function fixBatch(items: TextItem[], chapterName: string): Promise<Map<number, string>> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `You are a grammar proofreader. Fix ONLY clear grammar errors, spelling mistakes, and punctuation errors in the HTML fragments below.

Rules:
1. Preserve the author's original voice, style, tone, and word choices exactly — do NOT rephrase, restructure, or paraphrase.
2. If a sentence is stylistically unusual but grammatically correct, leave it unchanged.
3. Detect the natural language of the text (English, French, Spanish, Vietnamese, etc.) and fix errors in that language. Do NOT translate.
4. Preserve all HTML tags and attributes exactly — only change text content.
5. Return ONLY a JSON array with structure [{id: number, html: string}].

Input: ${JSON.stringify(items)}`,
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) {
    console.warn(`\n  ⚠️  No JSON in response for ${chapterName}`);
    return new Map();
  }

  const fixed: TextItem[] = JSON.parse(match[0]);
  return new Map(fixed.map(f => [f.id, f.html]));
}

/**
 * Reads a chapter XHTML file, fixes grammar via Claude, returns corrected content.
 * Does NOT write to disk — caller is responsible for persisting the result.
 */
export async function fixChapterGrammar(chapterPath: string, chapterName: string): Promise<FixResult> {
  const rawContent = fs.readFileSync(chapterPath, 'utf8');
  const $ = cheerio.load(rawContent, { xmlMode: false });

  // Collect text-bearing elements with their innerHTML and a stable numeric index
  const elements: Array<{ el: ReturnType<typeof $>[number]; originalHtml: string; index: number }> = [];
  $(TEXT_SELECTORS).each((i, el) => {
    const text = $(el).text().trim();
    if (text.length > 15) {
      elements.push({ el, originalHtml: $(el).html() ?? '', index: i });
    }
  });

  if (elements.length === 0) {
    return { content: rawContent, changesCount: 0, changes: [] };
  }

  // Gather all fixes across batches
  const allFixed = new Map<number, string>();
  for (let i = 0; i < elements.length; i += BATCH_SIZE) {
    const batch = elements.slice(i, i + BATCH_SIZE).map(e => ({ id: e.index, html: e.originalHtml }));
    try {
      const result = await fixBatch(batch, chapterName);
      for (const [id, html] of result) allFixed.set(id, html);
    } catch (err) {
      console.warn(`\n  ⚠️  Batch ${Math.floor(i / BATCH_SIZE) + 1} failed for ${chapterName}: ${(err as Error).message}`);
    }
  }

  // Apply fixes and track changes (store original before mutation)
  const changes: Array<{ original: string; fixed: string }> = [];
  elements.forEach(({ el, originalHtml, index }) => {
    const fixedHtml = allFixed.get(index);
    if (fixedHtml && fixedHtml !== originalHtml) {
      changes.push({ original: originalHtml, fixed: fixedHtml });
      $(el).html(fixedHtml);
    }
  });

  return { content: $.html(), changesCount: changes.length, changes };
}
