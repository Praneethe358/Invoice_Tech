const fs = require('fs');
const logPath = '/home/pranii/.gemini/antigravity/brain/bed872c3-a760-4106-b015-49ccdf6fdadc/.system_generated/logs/overview.txt';
if (fs.existsSync(logPath)) {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  console.log(`Printing from line 280 to ${lines.length}:`);
  for (let i = 280; i < lines.length; i++) {
    console.log(`Line ${i}:`, lines[i].substring(0, 300));
  }
} else {
  console.log('Log file does not exist');
}
