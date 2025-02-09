module.exports = {
  '*.{js,jsx,ts,tsx}': ['yarn prettier --write', 'yarn eslint --fix'],
  '*.{json,md,yml,yaml}': ['yarn prettier --write'],
};
