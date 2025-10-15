import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

const origin: string = process.argv[2] || 'https://mcp-for-next-js.vercel.app';

async function main(): Promise<void> {
  const transport = new SSEClientTransport(new URL(`${origin}/sse`));

  const client = new Client(
    {
      name: 'example-client',
      version: '1.0.0'
    },
    {
      capabilities: {
        prompts: {},
        resources: {},
        tools: {}
      }
    }
  );

  console.log('Connecting to', origin);
  await client.connect(transport);

  console.log('Connected', client.getServerCapabilities());

  const result = await client.listTools();
  console.log(result);
  client.close();
}

main().catch((error: Error) => {
  console.error('Error:', error);
  process.exit(1);
});
