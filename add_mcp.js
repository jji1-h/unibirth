import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const filePath = join(process.env.USERPROFILE, '.claude.json');
const config = JSON.parse(readFileSync(filePath, 'utf-8'));

config.mcpServers = {
  'apps-in-toss': {
    command: 'C:\\Users\\happy\\AppData\\Roaming\\npm\\ax.cmd',
    args: ['mcp', 'start']
  },
  'apps-in-toss-docs': {
    command: 'npx',
    args: ['-y', 'mcp-remote', 'https://developers-apps-in-toss.toss.im/~gitbook/mcp']
  }
};

writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');
console.log('Done! mcpServers added to .claude.json');
