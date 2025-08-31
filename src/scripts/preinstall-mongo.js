import { MongoMemoryServer } from 'mongodb-memory-server';

console.log('Downloading MongoDB binary for tests (mongodb-memory-server)...');
const mongod = await MongoMemoryServer.create();
await mongod.stop();
console.log('MongoDB binary downloaded!');