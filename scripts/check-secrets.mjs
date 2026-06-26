#!/usr/bin/env node
/**
 * Scans tracked project files for common secret patterns.
 * Run before pushing: npm run check:secrets
 */
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const FORBIDDEN_PATHS = ['.env', '.vercel', 'node_modules', 'output'];
const PATTERNS = [
  { name: 'GitHub token', re: /gh[oapus]_[A-Za-z0-9_]{20,}/ },
  { name: 'OpenAI key', re: /sk-[A-Za-z0-9]{20,}/ },
  { name: 'xAI key', re: /xai-[A-Za-z0-9]{20,}/ },
  { name: 'AWS key', re: /AKIA[0-9A-Z]{16}/ },
  { name: 'Private key block', re: /-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/ },
  { name: 'Bearer token', re: /Bearer\s+[A-Za-z0-9._-]{30,}/ },
  { name: 'Hardcoded api_key', re: /api[_-]?key\s*[:=]\s*['"][^'"]{8,}['"]/i },
  { name: 'Hardcoded secret', re: /secret\s*[:=]\s*['"][^'"]{8,}['"]/i },
  { name: 'Hardcoded password', re: /password\s*[:=]\s*['"][^'"]{4,}['"]/i },
  { name: 'Mnemonic phrase', re: /(?:\b[a-z]+\b\s+){11,23}\b[a-z]+\b/ },
];

function trackedFiles() {
  const out = execSync('git ls-files', { cwd: root, encoding: 'utf8' });
  return out.split('\n').filter(Boolean);
}

let failed = false;

for (const rel of FORBIDDEN_PATHS) {
  try {
    const listed = execSync(`git ls-files ${rel}`, { cwd: root, encoding: 'utf8' }).trim();
    if (listed) {
      console.error(`FAIL: forbidden path tracked by git: ${rel}`);
      console.error(listed);
      failed = true;
    }
  } catch {
    // git ls-files returns non-zero when no matches
  }
}

for (const file of trackedFiles()) {
  const abs = path.join(root, file);
  if (!existsSync(abs)) continue;
  const text = readFileSync(abs, 'utf8');
  for (const { name, re } of PATTERNS) {
    if (name === 'Mnemonic phrase' && !file.endsWith('.env')) continue;
    const match = text.match(re);
    if (match) {
      console.error(`FAIL: ${name} in ${file}`);
      failed = true;
    }
  }
}

if (failed) {
  console.error('\nSecret check failed. Remove credentials before pushing.');
  process.exit(1);
}

console.log('OK: no secrets detected in tracked files.');
console.log('OK: .env, .vercel, node_modules, output are not tracked.');