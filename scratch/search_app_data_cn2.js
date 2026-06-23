const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch (err) {
    return;
  }
  for (const file of files) {
    const fullPath = path.join(dir, file);
    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch (e) {
      continue;
    }
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        searchDir(fullPath);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(file).toLowerCase();
      if (['.txt', '.json', '.md', '.pb', '.log', '.js', '.ts'].includes(ext) || file.startsWith('dom_')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const idx = content.toLowerCase().indexOf('cn-002');
          if (idx !== -1) {
            console.log(`Found 'CN-002' in file: ${fullPath}`);
            console.log(content.substring(Math.max(0, idx - 300), Math.min(content.length, idx + 1000)));
            console.log('--------------------------------------------------');
          }
        } catch (e) {
          // ignore
        }
      }
    }
  }
}

searchDir('/home/pranii/.gemini/antigravity');
