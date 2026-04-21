const { FlatCompat } = require('@eslint/eslintrc')
const path = require('path')

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

module.exports = [
  ...compat.extends('airbnb'),
  {
    languageOptions: {
      parser: require('@babel/eslint-parser'),
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ['@babel/preset-react'],
        },
      },
    },
    rules: {
      semi: ['error', 'never'],
    },
  },
  {
    files: ['__tests__/**/*.js', '__tests__/**/*.jsx'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
        require: 'readonly',
      },
    },
    rules: {
      'global-require': 'off',
      'react/jsx-filename-extension': 'off',
    },
  },
  {
    files: ['scripts/**/*.js'],
    rules: {
      'import/no-extraneous-dependencies': 'off',
    },
  },
]
