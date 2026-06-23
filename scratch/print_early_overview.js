const fs = require('fs');
const logPath = '/home/pranii/.gemini/antigravity/brain/bed872c3-a760-4106-b015-49ccdf6fdadc/.system_generated/logs/overview.txt';
if (fs.existsSync(logPath)) {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  console.log('=== First 10 Lines ===');
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    console.log(`Line ${i}:`, lines[i].substring(0, 500));
  }
} else {
  console.log('Log file does not exist.');
}
