const fs = require('fs');
const path = require('path');

// File path
const filePath = path.join(__dirname, 'app.js');

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Count occurrences before replacement
const countBefore = (content.match(/mysql\.query/g) || []).length;
console.log(`Found ${countBefore} occurrences of mysql.query`);

// Replace mysql.query with safeQuery
content = content.replace(/mysql\.query\(/g, 'safeQuery(');

// Count occurrences after replacement
const countAfter = (content.match(/mysql\.query/g) || []).length;
const replacedCount = countBefore - countAfter;
console.log(`Replaced ${replacedCount} occurrences of mysql.query with safeQuery`);

// Write the modified content back to the file
fs.writeFileSync(filePath, content, 'utf8');
console.log('File updated successfully!'); 