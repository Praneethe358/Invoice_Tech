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
      if (content.includes('Sri Murugan Textiles')) {
        console.log(`Found "Sri Murugan Textiles" in: ${itemPath}`);
        // Let's find if it contains Senthil Kumar and CN-002 details
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('Sri Murugan Textiles') && lines[i].includes('Senthil') && !lines[i].includes('truncated')) {
            console.log(`Line ${i} matches both and is untruncated!`);
            try {
              const parsed = JSON.parse(lines[i]);
              if (parsed.content) {
                console.log("Found untruncated content! Writing to scratch/untruncated_simulation_prompt.txt");
                fs.writeFileSync('/home/pranii/Desktop/Shipped /Invoice_startup/scratch/untruncated_simulation_prompt.txt', parsed.content);
              }
            } catch (err) {
              console.log("Failed to parse JSON, raw text slice: " + lines[i].substring(0, 1000));
            }
          }
        }
      }
    }
  }
}

searchLogs(brainDir);
