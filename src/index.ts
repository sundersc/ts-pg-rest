import { AutoRestServer } from './server';

async function main() {
  const server = new AutoRestServer();
  await server.initialize();
  server.start(3000);
}

main().catch(console.error);