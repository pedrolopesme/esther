import fs from 'fs';
import path from 'path';

/**
 * Generate static params for [listId] routes by reading the public/data directory.
 * This runs at build time on the server, even though the page is a client component.
 */
export function generateStaticParamsForSubject(subject) {
  const dataDir = path.join(process.cwd(), 'public', 'data', subject);
  try {
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json') && f !== 'index.json');
    return files.map(file => ({
      listId: file.replace('.json', ''),
    }));
  } catch {
    return [];
  }
}
