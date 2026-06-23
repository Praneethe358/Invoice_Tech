const fs = require('fs');
const path = require('path');

const dir = '/home/pranii/.gemini/antigravity/conversations/';
const files = fs.readdirSync(dir);
for (const file of files) {
  if (file.endsWith('.pb')) {
    const filePath = path.join(dir, file);
    const buf = fs.readFileSync(filePath);
    
    let idx = buf.indexOf(Buffer.from('Sri Murugan'));
    if (idx !== -1) {
      console.log(`Found 'Sri Murugan' in ${file} at byte index ${idx}:`);
      console.log(buf.slice(Math.max(0, idx - 100), Math.min(buf.length, idx + 1000)).toString('utf8'));
      console.log('==================================================');
    }
    
    let idx2 = buf.indexOf(Buffer.from('Senthil'));
    if (idx2 !== -1) {
      console.log(`Found 'Senthil' in ${file} at byte index ${idx2}:`);
      console.log(buf.slice(Math.max(0, idx2 - 100), Math.min(buf.length, idx2 + 1000)).toString('utf8'));
      console.log('==================================================');
    }
  }
}
