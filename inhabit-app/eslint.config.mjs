// eslint-config-next 16 fournit directement une configuration « flat » :
// l'ancien pont FlatCompat plantait (« Converting circular structure to JSON »).
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
        },
      ],
    },
  },
  {
    ignores: ['.next/', '.next-static/', 'out/', 'src/app/(payload)/admin/importMap.js', 'src/migrations/*.json', 'src/payload-types.ts', 'src/payload-generated-schema.ts'],
  },
]

export default eslintConfig
