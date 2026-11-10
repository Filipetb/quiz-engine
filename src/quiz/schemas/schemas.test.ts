import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { quizSchemaValidator } from '@/quiz/engine/schema';

const SCHEMAS_DIR = join(__dirname);
const files = readdirSync(SCHEMAS_DIR).filter((f) => f.endsWith('.json'));

describe('schemas de quiz', () => {
  it.each(files)('%s passa na validação do runtime', (file) => {
    const raw: unknown = JSON.parse(
      readFileSync(join(SCHEMAS_DIR, file), 'utf8'),
    );
    const result = quizSchemaValidator.safeParse(raw);
    const issues = result.success
      ? []
      : result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    expect(issues).toEqual([]);
  });

  it.each(files)('%s usa slug igual ao nome do arquivo', (file) => {
    const raw = JSON.parse(readFileSync(join(SCHEMAS_DIR, file), 'utf8')) as {
      quiz: { slug: string };
    };
    const allowedLegacy = new Set(['agent-sample.json']);
    if (allowedLegacy.has(file)) return;
    expect(`${raw.quiz.slug}.json`).toBe(file);
  });
});
