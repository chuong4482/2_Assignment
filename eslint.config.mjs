import tsParser from '@typescript-eslint/parser';
export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/next-env.d.ts', '**/coverage/**'] },
  {
    files: ['apps/**/*.{ts,tsx}', 'tests/**/*.{js,cjs,ts}', 'scripts/**/*.{js,cjs,mjs}'],
    languageOptions: { parser: tsParser, ecmaVersion: 'latest', sourceType: 'module' },
    rules: {
      'no-debugger': 'error', 'no-duplicate-case': 'error', 'no-unreachable': 'error',
      'no-unsafe-finally': 'error', 'no-constant-condition': ['error', { checkLoops: false }],
      'valid-typeof': 'error',
    },
  },
];
