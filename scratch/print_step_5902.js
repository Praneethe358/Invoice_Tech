const fs = require('fs');
const logPath = '/home/pranii/.gemini/antigravity/brain/28288046-1cdb-4aca-a1aa-f147e9ff6704/.system_generated/logs/overview.txt';
if (fs.existsSync(logPath)) {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('"step_index":5902')) {
      const obj = JSON.parse(lines[i]);
      fs.writeFileSync('/home/pranii/Desktop/Shipped /Invoice_startup/scratch/untruncated_bug_fix_prompt.txt', obj.content);
      console.log('Successfully wrote to scratch/untruncated_bug_fix_prompt.txt');
      break;
    }
  }
} else {
  console.log('Log file does not exist.');
}
