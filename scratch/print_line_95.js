const fs = require('fs');
const logPath = '/home/pranii/.gemini/antigravity/brain/bed872c3-a760-4106-b015-49ccdf6fdadc/.system_generated/logs/overview.txt';
if (fs.existsSync(logPath)) {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  const line95 = lines[95];
  try {
    const obj = JSON.parse(line95);
    console.log('Successfully parsed JSON!');
    fs.writeFileSync('scratch/full_simulation_prompt.txt', obj.content);
    console.log('Saved to scratch/full_simulation_prompt.txt. Length:', obj.content.length);
  } catch (err) {
    console.error('Failed to parse line 95:', err);
    console.log('Snippet of line 95:', line95.substring(0, 1000));
  }
} else {
  console.log('Log file does not exist.');
}
