module.exports = {
  '*.{js,jsx,ts,tsx}': ['prettier --write', 'eslint --fix'],
  '*.{json,md}': ['prettier --write'],
  'package.json': ['prettier --write'],
  'CHANGELOG.md': ['prettier --write'],
  '*.{yml,yaml}': ['prettier --write'],
};
