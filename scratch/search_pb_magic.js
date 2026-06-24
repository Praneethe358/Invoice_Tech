const fs = require('fs');
const path = require('path');

const dir = '/home/pranii/.gemini/antigravity/conversations/';
const files = fs.readdirSync(dir);

for (const file of files) {
  if (file.endsWith('.pb')) {
    const filePath = path.join(dir, file);
    const buf = fs.readFileSync(filePath);
    
    // Search for CN-002
    let idx = buf.indexOf(Buffer.from('CN-002'));
    if (idx !== -1) {
      console.log(`Found 'CN-002' in ${file} at index ${idx}`);
      
      // Extract a large portion around it
      const start = Math.max(0, idx - 2000);
      const end = Math.min(buf.length, idx + 8000);
      const slice = buf.slice(start, end);
      
      // Clean up non-printable characters for readability
      let cleanText = '';
      for (let i = 0; i < slice.length; i++) {
        const c = slice[i];
        if ((c >= 32 && c <= 126) || c === 10 || c === 13 || c === 9) {
          cleanText += String.fromCharCode(c);
        } else {
          // keep a dot or space
          cleanText += ' ';
        }
      }
      
      console.log('--- SURROUNDINGS ---');
      console.log(cleanText);
      console.log('--------------------');
      
      // Save it to scratch
      fs.writeFileSync('/home/pranii/Desktop/Shipped /Invoice_startup/scratch/extracted_pb_content.txt', cleanText);
      break;
    }
  }
}
