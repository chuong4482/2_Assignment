module.exports = {
  testDir: './e2e',
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: process.env.TEST_WEB_URL || 'http://localhost:3100',
    viewport: { width: 390, height: 844 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  outputDir: './test-results',
  webServer: {
    cwd: require('node:path').resolve(__dirname, '..'),
    command: 'npm run dev -w apps/web -- --port 3100',
    url: process.env.TEST_WEB_URL || 'http://localhost:3100',
    reuseExistingServer: false,
    timeout: 120000,
    env: { NEXT_PUBLIC_API_URL: process.env.TEST_API_URL || 'http://localhost:4100' },
  },
};
