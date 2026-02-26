import JSZip from 'jszip';
import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';

export interface Chapter {
  id: string;
  filePath: string; // absolute path on disk
  zipPath: string;  // relative path inside ZIP
}

/**
 * Extracts all EPUB contents to disk and returns ordered chapter list.
 * Parses META-INF/container.xml → OPF → spine to determine chapter order.
 */
export async function extractEpub(inputPath: string, extractDir: string): Promise<Chapter[]> {
  const data = fs.readFileSync(inputPath);
  const zip = await JSZip.loadAsync(data);

  // Extract all files to disk preserving structure
  for (const [zipPath, file] of Object.entries(zip.files)) {
    if (file.dir) continue;
    const filePath = path.join(extractDir, zipPath.replace(/\//g, path.sep));
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, await file.async('nodebuffer'));
  }

  // Find OPF path via container.xml
  const containerXml = fs.readFileSync(path.join(extractDir, 'META-INF', 'container.xml'), 'utf8');
  const $c = cheerio.load(containerXml, { xmlMode: true });
  const opfZipPath = $c('rootfile').attr('full-path') ?? '';
  const opfDir = path.posix.dirname(opfZipPath); // e.g. "OEBPS" or "."

  // Parse OPF manifest + spine
  const opfDiskPath = path.join(extractDir, opfZipPath.replace(/\//g, path.sep));
  const $opf = cheerio.load(fs.readFileSync(opfDiskPath, 'utf8'), { xmlMode: true });

  // manifest: id → zipPath (xhtml items only)
  const manifest = new Map<string, string>();
  $opf('manifest item').each((_, el) => {
    const id = $opf(el).attr('id');
    const href = $opf(el).attr('href');
    const mediaType = $opf(el).attr('media-type') ?? '';
    if (id && href && mediaType.includes('xhtml')) {
      const zipPath = opfDir === '.' ? href : `${opfDir}/${href}`;
      manifest.set(id, zipPath);
    }
  });

  // Build spine-ordered chapters
  const chapters: Chapter[] = [];
  $opf('spine itemref').each((_, el) => {
    const idref = $opf(el).attr('idref');
    if (!idref) return;
    const zipPath = manifest.get(idref);
    if (!zipPath) return;
    chapters.push({
      id: idref,
      zipPath,
      filePath: path.join(extractDir, zipPath.replace(/\//g, path.sep)),
    });
  });

  return chapters;
}

/**
 * Repacks an extracted EPUB folder back into a .epub file.
 * Ensures mimetype is stored first and uncompressed (per EPUB spec).
 */
export async function packEpub(extractDir: string, outputPath: string): Promise<void> {
  const zip = new JSZip();

  // mimetype must be first and uncompressed
  const mimetypeDisk = path.join(extractDir, 'mimetype');
  if (fs.existsSync(mimetypeDisk)) {
    zip.file('mimetype', fs.readFileSync(mimetypeDisk), { compression: 'STORE' });
  }

  // Walk all other files
  function walkDir(dir: string): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else {
        const zipPath = path.relative(extractDir, fullPath).replace(/\\/g, '/');
        if (zipPath === 'mimetype') continue; // already added
        zip.file(zipPath, fs.readFileSync(fullPath), { compression: 'DEFLATE' });
      }
    }
  }
  walkDir(extractDir);

  fs.writeFileSync(outputPath, await zip.generateAsync({ type: 'nodebuffer' }));
}
