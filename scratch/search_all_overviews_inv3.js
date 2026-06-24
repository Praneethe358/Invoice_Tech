const fs = require('fs');
const path = require('path');

const brainDir = '/home/pranii/.gemini/antigravity/brain';

function searchLogs(dir) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);
    if (stat.isDirectory()) {
      searchLogs(itemPath);
    } else if (item === 'overview.txt') {
      const content = fs.readFileSync(itemPath, 'utf8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('CN-002') || line.includes('INV-0003') || line.includes('37,800') || line.includes('37800')) {
          console.log(`File: ${itemPath} | Line: ${i} | Text: ${line.substring(0, 500)}`);
        }
      }
    }
  }
}

searchLogs(brainDir);
