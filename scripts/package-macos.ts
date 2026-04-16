import { $ } from 'bun';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync, chmodSync } from 'node:fs';
import { join, resolve } from 'node:path';

const rootDir = process.cwd();
const releaseRoot = resolve(rootDir, 'release');
const appDir = resolve(releaseRoot, 'AgentBIU-macos');
const frontendDistDir = resolve(rootDir, 'frontend/dist');
const serverBinary = resolve(rootDir, 'server/dist/agentbiu-server');
const logsDir = resolve(appDir, 'logs');

async function main() {
  console.log('Packaging AgentBIU for macOS...');

  rmSync(releaseRoot, { recursive: true, force: true });
  mkdirSync(appDir, { recursive: true });
  mkdirSync(logsDir, { recursive: true });

  await $`bun run build`;
  await $`bun run build:server:bin`;

  ensureExists(frontendDistDir, 'frontend build output');
  ensureExists(serverBinary, 'compiled server binary');

  cpSync(frontendDistDir, join(appDir, 'frontend-dist'), { recursive: true });
  cpSync(serverBinary, join(appDir, 'agentbiu-server'));
  cpSync(resolve(rootDir, '.env.example'), join(appDir, '.env.example'));
  cpSync(resolve(rootDir, 'docs/user-guide.md'), join(appDir, '用户使用说明.md'));
  cpSync(resolve(rootDir, 'README.md'), join(appDir, 'README.md'));

  writeFileSync(
    join(appDir, 'start.command'),
    `#!/bin/bash
set -e
cd "$(dirname "$0")"
if [ ! -f ".env" ]; then
  cp ".env.example" ".env"
fi
mkdir -p logs
PORT=\${PORT:-3000}
export PORT
export FRONTEND_DIST_DIR="$PWD/frontend-dist"
(sleep 2; open "http://127.0.0.1:\${PORT}") >/dev/null 2>&1 &
./agentbiu-server 2>&1 | tee "logs/app.log"
`,
  );
  chmodSync(join(appDir, 'start.command'), 0o755);

  writeFileSync(
    join(appDir, 'stop.command'),
    `#!/bin/bash
pkill -f agentbiu-server || true
echo "AgentBIU stopped."
`,
  );
  chmodSync(join(appDir, 'stop.command'), 0o755);

  console.log(`\nPackage ready: ${appDir}`);
  console.log('Double-click start.command to launch.');
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
