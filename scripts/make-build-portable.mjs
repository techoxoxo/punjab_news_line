import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = path.resolve(__dirname, '../.next');
const searchStr = '/Users/macbook/Anuj/Punjab_newsline/next_punjabnewsline/';
const replaceStr = ''; // Make paths relative

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else {
      results.push(filePath);
    }
  });
  return results;
}

async function run() {
  console.log(`Scanning build directory: ${targetDir}`);
  if (!fs.existsSync(targetDir)) {
    console.error('Build directory does not exist!');
    return;
  }

  const files = walk(targetDir);
  let count = 0;

  for (const file of files) {
    // Only inspect text files (JSON, JS, html, txt)
    if (file.endsWith('.js') || file.endsWith('.json') || file.endsWith('.html') || file.endsWith('.txt')) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes(searchStr)) {
        console.log(`Fixing absolute path in: ${path.relative(targetDir, file)}`);
        const updatedContent = content.replaceAll(searchStr, replaceStr);
        fs.writeFileSync(file, updatedContent, 'utf8');
        count++;
      }
    }
  }

  console.log(`Successfully replaced absolute paths in ${count} files.`);
}

run().catch(console.error);
