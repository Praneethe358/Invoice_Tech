const fs = require('fs');
const logPath = '/home/pranii/.gemini/antigravity/brain/8dc15959-d37b-4464-9129-2a3f3393718f/.system_generated/logs/overview.txt';
if (fs.existsSync(logPath)) {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  console.log('Total lines:', lines.length);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('INV') || line.includes('CN') || line.includes('Senthil') || line.includes('Meena')) {
      console.log(`Line ${i}:`, line.substring(0, 500));
    }
  }
} else {
  console.log('Log file does not exist.');
}
