const fs = require('fs');
const logPath = '/home/pranii/.gemini/antigravity/brain/bed872c3-a760-4106-b015-49ccdf6fdadc/.system_generated/logs/overview.txt';
if (fs.existsSync(logPath)) {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  console.log('Total log lines:', lines.length);
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('"USER_INPUT"')) {
      console.log(`Line ${i} USER_INPUT:`, lines[i].substring(0, 300));
    }
  }
} else {
  console.log('Log file does not exist.');
}
