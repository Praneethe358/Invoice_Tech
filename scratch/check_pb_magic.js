const fs = require('fs');
const filePath = '/home/pranii/.gemini/antigravity/conversations/bed872c3-a760-4106-b015-49ccdf6fdadc.pb';
if (fs.existsSync(filePath)) {
  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(4);
  fs.readSync(fd, buffer, 0, 4, 0);
  console.log('Magic bytes:', buffer.toString('hex'), buffer);
  fs.closeSync(fd);
} else {
  console.log('File does not exist');
}
