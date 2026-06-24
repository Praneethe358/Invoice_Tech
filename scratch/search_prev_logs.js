const fs = require('fs');
const logPath = '/home/pranii/.gemini/antigravity/brain/28288046-1cdb-4aca-a1aa-f147e9ff6704/.system_generated/logs/overview.txt';
if (fs.existsSync(logPath)) {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  console.log('Total log lines:', lines.length);
  for (let i = 2000; i <= 2028; i++) {
    console.log('Line ' + i + ': ' + lines[i]);
  }
} else {
  console.log('Log file does not exist.');
}
