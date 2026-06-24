const fs = require('fs');
const path = require('path');

const brainDir = '/home/pranii/.gemini/antigravity/brain';
let longestContent = '';

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
      for (const line of lines) {
        if (line.includes('Sri Murugan Textiles')) {
          try {
            const parsed = JSON.parse(line);
            const text = parsed.content || '';
            if (text.includes('Sri Murugan Textiles') && text.length > longestContent.length) {
              longestContent = text;
            }
          } catch (err) {
            // Ignore parse errors
          }
        }
      }
    }
  }
}

searchLogs(brainDir);

if (longestContent) {
  console.log(`Found longest text of size ${longestContent.length}`);
  fs.writeFileSync('/home/pranii/Desktop/Shipped /Invoice_startup/scratch/untruncated_simulation_prompt.txt', longestContent);
} else {
  console.log('No matches found.');
}
