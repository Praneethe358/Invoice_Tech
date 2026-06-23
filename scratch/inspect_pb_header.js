const fs = require('fs');
const filePath = '/home/pranii/.gemini/antigravity/conversations/bed872c3-a760-4106-b015-49ccdf6fdadc.pb';
if (fs.existsSync(filePath)) {
  const buf = fs.readFileSync(filePath);
  console.log('File size:', buf.length);
  console.log('First 100 bytes (hex):', buf.slice(0, 100).toString('hex'));
  console.log('First 100 bytes (ascii):', buf.slice(0, 100).toString('ascii').replace(/[^\x20-\x7E]/g, '.'));
} else {
  console.log('File does not exist');
}
