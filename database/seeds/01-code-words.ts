import { Knex } from 'knex';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Tables } from '@libs/tables';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function seed(knex: Knex): Promise<void> {
  const { count } = await knex(Tables.codeWords).count().first();

  if (!+count) {
    const filePath = path.join(
      __dirname,
      '../../../../russian-words/data/ru-nouns-clean.json',
    );
    const allWords: string[] = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const minLength = 4;
    const maxLength = 8;
    const count = 5000;

    const filtered = allWords.filter(
      (w) => w.length >= minLength && w.length <= maxLength,
    );

    // тасуем массив (Fisher–Yates)
    for (let i = filtered.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
    }

    const selected = filtered.slice(0, Math.min(count, filtered.length));

    await knex(Tables.codeWords).insert(
      selected.map((item) => ({ word: item, isActive: true })),
    );
  }
}
