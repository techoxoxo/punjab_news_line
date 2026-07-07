import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const nextDir = path.resolve(projectRoot, '.next');
const standaloneDir = path.resolve(nextDir, 'standalone');
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

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`  [skip] source does not exist: ${src}`);
    return;
  }
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function run() {
  console.log(`Scanning build directory: ${nextDir}`);
  if (!fs.existsSync(nextDir)) {
    console.error('Build directory does not exist!');
    return;
  }

  // ─── Step 1: Fix absolute paths in the entire .next directory ───────────────
  const files = walk(nextDir);
  let count = 0;

  for (const file of files) {
    // Only inspect text files (JSON, JS, html, txt)
    if (file.endsWith('.js') || file.endsWith('.json') || file.endsWith('.html') || file.endsWith('.txt')) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes(searchStr)) {
        console.log(`Fixing absolute path in: ${path.relative(nextDir, file)}`);
        const updatedContent = content.replaceAll(searchStr, replaceStr);
        fs.writeFileSync(file, updatedContent, 'utf8');
        count++;
      }
    }
  }

  console.log(`Successfully replaced absolute paths in ${count} files.`);

  // ─── Step 2: Copy static assets into standalone (required for CSS/JS to load) ─
  if (fs.existsSync(standaloneDir)) {
    console.log('\nCopying static assets into standalone...');

    // .next/static → standalone/.next/static
    const staticSrc = path.join(nextDir, 'static');
    const staticDest = path.join(standaloneDir, '.next', 'static');
    console.log(`  Copying .next/static → standalone/.next/static`);
    copyDirSync(staticSrc, staticDest);

    // public → standalone/public
    const publicSrc = path.join(projectRoot, 'public');
    const publicDest = path.join(standaloneDir, 'public');
    console.log(`  Copying public/ → standalone/public/`);
    copyDirSync(publicSrc, publicDest);

    console.log('Static assets copied successfully.');
  } else {
    console.warn('\n[warn] standalone directory not found at .next/standalone — skipping asset copy.');
    console.warn('       Make sure next.config has output: "standalone"');
  }
}

run().catch(console.error);
