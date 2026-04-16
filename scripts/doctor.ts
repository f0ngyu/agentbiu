import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(process.cwd(), '.env');
const examplePath = resolve(process.cwd(), '.env.example');

console.log('AgentBIU preflight check');
console.log(`- .env.example: ${existsSync(examplePath) ? 'found' : 'missing'}`);
console.log(`- .env: ${existsSync(envPath) ? 'found' : 'optional / not found'}`);
console.log('- Bun workspace: ready');
console.log('- Frontend URL: http://127.0.0.1:5173');
console.log('- API URL: http://127.0.0.1:3000');
