import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, readdir, rename, unlink, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'output');
const videoDir = path.join(outDir, 'raw');
const demoPath = path.join(__dirname, 'demo.html');
const finalMp4 = path.join(outDir, 'stablepad-demo.mp4');
const desktopMp4 = path.join(process.env.HOME || '', 'Desktop', 'stablepad-demo.mp4');

await mkdir(videoDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  recordVideo: {
    dir: videoDir,
    size: { width: 1920, height: 1080 },
  },
});
const page = await context.newPage();
await page.goto(`file://${demoPath}`);
await page.waitForTimeout(25000);
await context.close();
await browser.close();

const files = await readdir(videoDir);
const webm = files.find((f) => f.endsWith('.webm'));
if (!webm) throw new Error('No recording found');

const webmPath = path.join(videoDir, webm);
await new Promise((resolve, reject) => {
  const ffmpeg = spawn('ffmpeg', [
    '-y',
    '-i', webmPath,
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    finalMp4,
  ], { stdio: 'inherit' });
  ffmpeg.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`))));
});

await unlink(webmPath);
await copyFile(finalMp4, desktopMp4);
console.log(`Demo saved to ${finalMp4}`);
console.log(`Copied to ${desktopMp4}`);