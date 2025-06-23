const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app.js');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Simple mysql.query with no parameters
content = content.replace(
  /mysql\.query\(\s*`([^`]+)`\s*,\s*(?:function|async function|\()\s*\(\s*(?:error|[a-zA-Z]+(?:Error)?)\s*,\s*(?:results|result|[a-zA-Z]+(?:Results)?)\s*\)\s*(?:=>)?\s*{/g,
  (match, query) => {
    // Check if the query has parameters that need to be replaced
    if (query.includes('${')) {
      // Extract parameters from the template string
      const params = [];
      const newQuery = query.replace(/\${([^}]+)}/g, (_, param) => {
        params.push(param.trim());
        return '?';
      });
      
      return `executeQuery(\`${newQuery}\`, [${params.join(', ')}], function(error, results) {`;
    } else {
      // No parameters
      return `executeQuery(\`${query}\`, [], function(error, results) {`;
    }
  }
);

// MySQL queries with prepared statements
content = content.replace(
  /mysql\.query\(\s*`([^`]+)`\s*,\s*\[([^\]]+)\]\s*,\s*(?:async function|\()\s*\(\s*(?:error|[a-zA-Z]+(?:Error)?)\s*,\s*(?:results|result|[a-zA-Z]+(?:Results)?)\s*\)\s*(?:=>)?\s*{/g,
  "executeQuery(`$1`, [$2], function(error, results) {"
);

// Write the updated content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Database queries updated successfully'); 