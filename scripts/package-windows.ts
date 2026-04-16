import { $ } from 'bun';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const rootDir = process.cwd();
const releaseRoot = resolve(rootDir, 'release');
const appDir = resolve(releaseRoot, 'AgentBIU-windows');
const frontendDistDir = resolve(rootDir, 'frontend/dist');
const serverDistDir = resolve(rootDir, 'server/dist');

function resolveServerBinary(): string {
  const exe = join(serverDistDir, 'agentbiu-server.exe');
  const noExt = join(serverDistDir, 'agentbiu-server');
  if (existsSync(exe)) return exe;
  if (existsSync(noExt)) return noExt;
  throw new Error('Missing compiled server binary under server/dist');
}

async function main() {
  if (process.platform !== 'win32') {
    console.error('package:windows 仅支持在 Windows 上本机编译；macOS 请使用 GitHub Actions 产物。');
    process.exit(1);
  }

  console.log('Packaging AgentBIU for Windows...');

  rmSync(releaseRoot, { recursive: true, force: true });
  mkdirSync(appDir, { recursive: true });
  mkdirSync(join(appDir, 'logs'), { recursive: true });

  await $`bun run build`;
  await $`bun run build:server:bin`;

  const serverBinary = resolveServerBinary();
  ensureExists(frontendDistDir, 'frontend build output');

  cpSync(frontendDistDir, join(appDir, 'frontend-dist'), { recursive: true });
  cpSync(serverBinary, join(appDir, 'agentbiu-server.exe'));
  cpSync(resolve(rootDir, '.env.example'), join(appDir, '.env.example'));
  cpSync(resolve(rootDir, 'docs/user-guide.md'), join(appDir, '用户使用说明.md'));
  cpSync(resolve(rootDir, 'README.md'), join(appDir, 'README.md'));

  writeFileSync(
    join(appDir, 'start.bat'),
    `@echo off
setlocal
cd /d "%~dp0"
if not exist ".env" copy ".env.example" ".env" >nul 2>&1
if not exist "logs" mkdir logs
set "FRONTEND_DIST_DIR=%CD%\\frontend-dist"
if not defined PORT set PORT=3000
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://127.0.0.1:%PORT%"
agentbiu-server.exe
pause
`,
  );

  writeFileSync(
    join(appDir, 'stop.bat'),
    `@echo off
taskkill /F /IM agentbiu-server.exe >nul 2>&1
echo AgentBIU stopped.
pause
`,
  );

  console.log(`\nPackage ready: ${appDir}`);
  console.log('Double-click start.bat to launch.');
}

function ensureExists(path: string, label: string) {
  if (!existsSync(path)) {
    throw new Error(`Missing ${label}: ${path}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
