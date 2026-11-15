import * as fs from 'fs';
import * as path from 'path';

export function taiBienMoiTruong(): void {
  const candidates = [
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), '../../.env'),
    path.join(__dirname, '.env'),
    path.join(__dirname, '../.env'),
    path.join(__dirname, '../../.env'),
    path.join(__dirname, '../../../../.env'),
    path.join(__dirname, '../../../../../.env'),
  ];
  for (const file of candidates) {
    if (fs.existsSync(file)) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        for (const line of content.split(/\r?\n/)) {
          const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
          if (m && !m[1].startsWith('#')) {
            const val = m[2].replace(/^(['"])(.*)\1$/, '$2').trim();
            if (!process.env[m[1]] || process.env[m[1]] === '') {
              process.env[m[1]] = val;
            }
          }
        }
      } catch {}
    }
  }
}
