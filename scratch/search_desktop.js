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
      if (file !== 'node_modules' && file !== '.git' && file !== '.next' && file !== '.venv' && file !== 'dist') {
        searchDir(fullPath);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(file).toLowerCase();
      if (['.txt', '.json', '.md', '.log', '.js', '.ts', '.sql'].includes(ext)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const idx = content.toLowerCase().indexOf('senthil');
          if (idx !== -1) {
            console.log(`Found 'senthil' in: ${fullPath}`);
          }
        } catch (e) {
          // ignore
        }
      }
    }
  }
}

searchDir('/home/pranii/Desktop');
