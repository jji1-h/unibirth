import json, os

path = os.path.expanduser(r'~\.claude.json')

with open(path, 'r', encoding='utf-8') as f:
    config = json.load(f)

config['mcpServers'] = {
    'apps-in-toss': {
        'command': r'C:\Users\happy\AppData\Roaming\npm\ax.cmd',
        'args': ['mcp', 'start']
    },
    'apps-in-toss-docs': {
        'command': 'npx',
        'args': ['-y', 'mcp-remote', 'https://developers-apps-in-toss.toss.im/~gitbook/mcp']
    }
}

with open(path, 'w', encoding='utf-8') as f:
    json.dump(config, f, ensure_ascii=False, indent=2)

print('Done! mcpServers added to .claude.json')
