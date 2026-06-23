const fs = require('fs');
const path = require('path');

const dir = '/home/pranii/.gemini/antigravity/conversations/';
const files = fs.readdirSync(dir);
for (const file of files) {
  if (file.endsWith('.pb')) {
    const filePath = path.join(dir, file);
    const buf = fs.readFileSync(filePath);
    const ascii = buf.toString('ascii');
    const idx = ascii.toLowerCase().indexOf('senthil');
    if (idx !== -1) {
      console.log(`Found in ascii of ${file} at ${idx}:`);
      console.log(ascii.slice(idx - 200, idx + 1000));
    }
    const utf16 = buf.toString('utf16le');
    const idx2 = utf16.toLowerCase().indexOf('senthil');
    if (idx2 !== -1) {
      console.log(`Found in utf16le of ${file} at ${idx2}:`);
      console.log(utf16.slice(idx2 - 200, idx2 + 1000));
    }
  }
}
