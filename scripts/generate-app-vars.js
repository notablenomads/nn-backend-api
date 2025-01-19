const fs = require('fs');
const path = require('path');

// Read package.json
const packageJson = require('../package.json');

// Create environment variables content
const envContent = `
# Auto-generated from package.json - DO NOT EDIT MANUALLY
APP_NAME=${packageJson.name}
APP_DESCRIPTION="${packageJson.description}"
APP_VERSION=${packageJson.version}
`;

// Write to .env.app file
fs.writeFileSync(path.join(__dirname, '../.env.app'), envContent.trim());

console.log('Generated app variables from package.json');
