import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { taiBienMoiTruong } from './moi-truong';

describe('shared environment loader', () => {
  it('loads root configuration from an API workspace without overwriting injected values', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'brewlite-env-'));
    const cwd = process.cwd();
    const originalEnv = process.env;
    try {
      fs.mkdirSync(path.join(root, 'apps/api'), { recursive: true });
      fs.writeFileSync(path.join(root, '.env'), 'BREWLITE_ENV_TEST="root-value"\nBREWLITE_INJECTED=file-value\n');
      process.env = { ...originalEnv, BREWLITE_INJECTED: 'container-value' };
      delete process.env.BREWLITE_ENV_TEST;
      process.chdir(path.join(root, 'apps/api'));
      taiBienMoiTruong();
      expect(process.env.BREWLITE_ENV_TEST).toBe('root-value');
      expect(process.env.BREWLITE_INJECTED).toBe('container-value');
    } finally {
      process.chdir(cwd);
      process.env = originalEnv;
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
