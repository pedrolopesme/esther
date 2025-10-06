import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

// Helper to safely parse JSON
async function readJsonFile(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  try {
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}

export async function GET() {
  try {
    const materiasDir = path.join(process.cwd(), 'src', 'app', 'materias');
    const subjects = await fs.readdir(materiasDir);

    const items = [];

    // Iterate subjects and collect lists
    for (const subject of subjects) {
      const dataDir = path.join(materiasDir, subject, 'data');
      try {
        const files = await fs.readdir(dataDir);
        const jsonFiles = files.filter((f) => f.endsWith('.json'));

        for (const file of jsonFiles) {
          const filePath = path.join(dataDir, file);
          const stat = await fs.stat(filePath);
          const json = await readJsonFile(filePath);
          if (!json) continue;

          const id = file.replace(/\.json$/, '');
          const title = json.nome || json.title || id;
          const dateString = json.data; // expected YYYY-MM-DD
          const date = dateString ? new Date(dateString) : stat.mtime;
          const materia = json.materia || subject;
          const questionCount = Array.isArray(json.exercises) ? json.exercises.length : 0;

          items.push({
            id,
            subject,
            title,
            materia,
            date: date.toISOString(),
            questionCount,
          });
        }
      } catch (e) {
        // Ignore subjects without data folder
        continue;
      }
    }

    // Sort by date desc and take top 10
    items.sort((a, b) => new Date(b.date) - new Date(a.date));
    const latest = items.slice(0, 10);

    return NextResponse.json(latest);
  } catch (err) {
    console.error('Erro ao carregar últimas listas:', err);
    return NextResponse.json({ error: 'Erro ao carregar últimas listas' }, { status: 500 });
  }
}
