import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { GET } from './+server';
import { HistoricalYieldModel } from '$server/mongo/models/HistoricalYieldDoc';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  await HistoricalYieldModel.create([
    {
      protocolId: 'protocol1',
      timestamp: new Date('2024-01-01'),
      apy: '5.0',
      tvl: '100000',
    },
    {
      protocolId: 'protocol1',
      timestamp: new Date('2024-01-02'),
      apy: '5.5',
      tvl: '105000',
    },
    {
      protocolId: 'protocol2',
      timestamp: new Date('2024-01-01'),
      apy: '4.2',
      tvl: '87000',
    },
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('GET /api/v1/protected/historical', () => {
  it('returns all historical yields for specific protocol', async () => {
    const event: any = {
      params: { protocolId: 'protocol1' },
      request: new Request(
        'http://localhost/api/v1/protected/historical?protocolId=protocol1'
      ),
      url: new URL(
        'http://localhost/api/v1/protected/historical?protocolId=protocol1'
      ),
      locals: {},
    };

    const response = await GET(event);
    expect(response.status).toBe(200);

    const data = JSON.parse(await response.text());
    expect(Array.isArray(data.histories)).toBe(true);
    expect(data.histories.length).toBe(2);
    expect(data.histories[0]).toHaveProperty('apy');
    expect(typeof data.histories[0].apy).toBe('string');
  });

  it('returns empty array if protocolId not found', async () => {
    const event: any = {
      params: { protocolId: 'notfound' },
      request: new Request(
        'http://localhost/api/v1/protected/historical?protocolId=notfound'
      ),
      url: new URL(
        'http://localhost/api/v1/protected/historical?protocolId=notfound'
      ),
      locals: {},
    };

    const response = await GET(event);
    expect(response.status).toBe(200);

    const data = JSON.parse(await response.text());
    expect(Array.isArray(data.histories)).toBe(true);
    expect(data.histories).toHaveLength(0);
  });
});
