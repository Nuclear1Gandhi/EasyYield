import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ProtocolModel } from '$server/mongo/models/Protocol';
import { GET } from './+server';
import { ProtocolType } from '$shared/typings/Protocol';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  await ProtocolModel.create([
    {
      protocolId: 'protocol1',
      name: 'CaviarNine',
      type: ProtocolType.LSU_POOL, // enum
      currentApy: '6.0001',
      tvl: '1000000.567',
      lastUpdated: new Date(),
      raw: {}, // supply Ociswap/CaviarNine raw pool data if relevant
    },
    {
      protocolId: 'protocol2',
      name: 'Ociswap',
      type: ProtocolType.DEX_PAIR,
      currentApy: '4.123',
      tvl: '200000.00',
      lastUpdated: new Date(),
      raw: {},
    },
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

const mockEvent: any = {
  params: {},
  request: new Request('http://localhost/api/protocols'),
  url: new URL('http://localhost/api/protocols'),
  locals: {}, // add if your handler uses it
};

describe('GET /api/protocols', () => {
  it('returns all protocols from the database', async () => {
    // Handler follows SvelteKit "endpoint" spec
    const response = await GET(mockEvent);

    expect(response.status).toBe(200);

    const data = JSON.parse(await response.text());
    expect(data).toHaveProperty('protocols');
    expect(Array.isArray(data.protocols)).toBe(true);
    expect(data.protocols.length).toBe(2);

    // Check structure
    expect(data.protocols[0]).toHaveProperty('protocolId');
    expect(data.protocols[0]).toHaveProperty('currentApy');
    expect(typeof data.protocols[0].currentApy).toBe('string');
  });
});
