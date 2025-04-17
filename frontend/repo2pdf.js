const fs = require('fs');
const path = require('path');

// Configuration
const rootDir = '.';
const outputMdPath = './nlp-project.md';
const fileTypesToInclude = ['.ts', '.tsx', '.jsx','.js', '.md', '.json', "tailwind.config.js", "postcss.config.mjs", "next.config.js"];
const maxFileSizeBytes = 1000000; // 1MB max file size
const excludedDirs = ['node_modules', '__pycache__', '.git', 'venv', 'env', '.venv'];

// Helper to write to markdown file
function appendToMarkdown(content) {
  fs.appendFileSync(outputMdPath, content + '\n');
}

// Clear previous output
fs.writeFileSync(outputMdPath, '');

// Add a title section
appendToMarkdown(`# RL_Hex_game Project Documentation\n`);
const dateStr = new Date().toLocaleDateString();
appendToMarkdown(`_Generated on ${dateStr}_\n`);
appendToMarkdown(`This document contains code files from the RL_Hex_game project.\n`);

// Add a table of contents section
appendToMarkdown(`\n## Table of Contents\n`);

// Store file paths for TOC
const filePaths = [];
const tocLines = [];

// Recursive function to traverse directories
function traverseDirectory(dirPath, indent = 0) {
  const items = fs.readdirSync(dirPath).sort();
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    let stats;
    try {
      stats = fs.statSync(itemPath);
    } catch (statError) {
      continue;
    }
    if (stats.isDirectory()) {
      if (excludedDirs.includes(item)) {
        continue;
      }
      tocLines.push(`${'  '.repeat(indent)}- 📁 **${item}/**`);
      traverseDirectory(itemPath, indent + 1);
    } else {
      const ext = path.extname(item).toLowerCase();
      if (fileTypesToInclude.includes(ext)) {
        if (stats.size > maxFileSizeBytes) {
          tocLines.push(`${'  '.repeat(indent)}- 📄 ${item} _(File too large - ${(stats.size / 1024).toFixed(1)} KB)_`);
          continue;
        }
        tocLines.push(`${'  '.repeat(indent)}- [📄 ${item}](#${itemPath.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()})`);
        filePaths.push(itemPath);
      }
    }
  }
}

traverseDirectory(rootDir);
appendToMarkdown(tocLines.join('\n'));

// Add each file content to the Markdown
filePaths.forEach(filePath => {
  const relativePath = path.relative(rootDir, filePath);
  const anchor = filePath.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  appendToMarkdown(`\n---\n`);
  appendToMarkdown(`\n### <a name="${anchor}"></a>${relativePath}\n`);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Add file content as code block
    const ext = path.extname(filePath).slice(1);
    appendToMarkdown(`\n\`\`\`${ext}\n${content}\n\`\`\`\n`);
  } catch (error) {
    appendToMarkdown(`\n_Error processing file: ${relativePath}_\n\n${error.message}\n`);
  }
});

console.log(`Markdown successfully created at ${outputMdPath}`);
