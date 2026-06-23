const fs = require('fs');
const logPath = '/home/pranii/.gemini/antigravity/brain/8dc15959-d37b-4464-9129-2a3f3393718f/.system_generated/logs/overview.txt';
if (fs.existsSync(logPath)) {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  console.log('Total log lines in previous conversation:', lines.length);
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    console.log(`Line ${i}:`, lines[i].substring(0, 500));
  }
} else {
  console.log('Previous log file does not exist.');
}
