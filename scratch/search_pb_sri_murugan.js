const fs = require('fs');
const path = require('path');

const dir = '/home/pranii/.gemini/antigravity/conversations/';
const files = fs.readdirSync(dir);
for (const file of files) {
  if (file.endsWith('.pb')) {
    const filePath = path.join(dir, file);
    const buf = fs.readFileSync(filePath);
    const ascii = buf.toString('utf8');
    const idx = ascii.toLowerCase().indexOf('sri murugan');
    if (idx !== -1) {
      console.log(`Found 'sri murugan' in ascii of ${file} at ${idx}:`);
      console.log(ascii.slice(idx - 100, idx + 1000));
      console.log('==================================================');
    }
  }
}
