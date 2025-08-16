import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ProtocolModel } from '$server/mongo/models/Protocol';
import { seedProtocols } from '../../src/scripts/seedProtocols';
import { configDotenv } from 'dotenv';

configDotenv();

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await ProtocolModel.deleteMany({});
});

describe('seedProtocols', () => {
  it('inserts Ociswap pool protocols', async () => {
    await seedProtocols();
    const protocols = await ProtocolModel.find();
    expect(protocols.length).toBeGreaterThan(0);
  });

  it('does not insert duplicates on repeated calls', async () => {
    await seedProtocols();
    await seedProtocols();
    const protocols = await ProtocolModel.find();
    const uniqueIds = new Set(protocols.map((p) => p.protocolId));
    expect(protocols.length).toBe(uniqueIds.size);
  });

  it('protocols have required properties', async () => {
    await seedProtocols();
    const protocols = await ProtocolModel.find();
    protocols.forEach((p) => {
      expect(p.name).toBeDefined();
      expect(p.protocolId).toBeDefined();
      expect(p.type).toBeDefined();
      expect(p.raw).toBeDefined();
    });
  });
});
