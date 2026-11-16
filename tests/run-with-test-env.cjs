const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const args = process.argv.slice(2);
const root = path.resolve(__dirname, '..');
const env = {
  ...process.env,
  DATABASE_URL: 'postgresql://brewlite_test:test_only_password@127.0.0.1:55432/brewlite_assignment1_test?schema=public',
  ADMIN_EMAIL: 'admin@brewlite.local',
  ADMIN_PASSWORD: 'Admin123!',
  STAFF_KEY: 'local-staff-key-change-me',
  JWT_SECRET: 'assignment1-isolated-test-jwt-key',
  VNPAY_TMN_CODE: 'TESTONLY',
  VNPAY_HASH_SECRET: 'assignment1-isolated-test-signing-key',
  VNPAY_RETURN_URL: 'http://localhost:4100/payments/vnpay/return',
  WEB_ORIGIN: 'http://localhost:3100',
  NEXT_PUBLIC_API_URL: 'http://localhost:4100',
  TEST_API_URL: 'http://localhost:4100',
  TEST_WEB_URL: 'http://localhost:3100',
  PORT: '4100',
};
if (!args.length) throw new Error('Usage: node tests/run-with-test-env.cjs <npm arguments>');
// Resolve npm CLI without passing arguments through a shell.
const npmCli = process.env.npm_execpath || path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
if (!fs.existsSync(npmCli)) throw new Error('npm CLI not found');
const child = spawn(process.execPath, [npmCli, ...args], { cwd: root, env, stdio: 'inherit' });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
