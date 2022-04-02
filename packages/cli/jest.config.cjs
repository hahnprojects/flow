module.exports = {
  moduleFileExtensions: ['js', 'mjs'],
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/*.spec.mjs'],
  transform: {},
  moduleNameMapper: {
    chalk: 'chalk/source/index.js',
    '#ansi-styles': 'chalk/source/vendor/ansi-styles/index.js',
    '#supports-color': 'chalk/source/vendor/supports-color/index.js',
  },
};
