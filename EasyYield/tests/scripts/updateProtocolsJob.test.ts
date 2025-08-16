// tests/updateProtocolsJob.test.ts
import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  beforeEach,
} from 'vitest';
import { fetchTopOciswapPools } from '../../src/lib/server/api/ociswap/pools';

// - Mock the fetchTopOciswapPools function so your test doesn't depend on Ociswap API
vi.mock('../../src/lib/server/api/ociswap/pools', () => ({
  fetchTopOciswapPools: vi.fn().mockResolvedValue([
    {
      address: 'component_rdx1testproto1',
      name: 'TEST/XRD',
      apr: { '24h': '0.01' },
      total_value_locked: { usd: { now: '100000' } },
      // ...other fields as required
    },
    {
      address: 'component_rdx1testproto2',
      name: 'FOO/XRD',
      apr: { '24h': '0.02' },
      total_value_locked: { usd: { now: '200000' } },
    },
  ]),
}));
import mongoose from 'mongoose';

import { MongoMemoryServer } from 'mongodb-memory-server';
import { ProtocolModel } from '$server/mongo/models/Protocol';
import { HistoricalYieldModel } from '$server/mongo/models/HistoricalYieldDoc';
import { configDotenv } from 'dotenv';
import { updateProtocolsJob } from '$server/workers/updateProtocols';

configDotenv();

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  console.log('\x1b[34m[INFO]\x1b[0m Connecting to MongoDB…');
  await mongoose.connect(mongoServer.getUri());
  console.log('\x1b[32m[SUCCESS]\x1b[0m Connected to MongoDB.');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await ProtocolModel.deleteMany({});
  await HistoricalYieldModel.deleteMany({});
});

describe('updateProtocolsJob', () => {
  it('updates or inserts protocol records and writes historical yield', async () => {
    await updateProtocolsJob();

    const protocols = await ProtocolModel.find();
    expect(protocols.length).toEqual(2);
    expect(protocols.map((p) => p.protocolId)).toContain(
      'component_rdx1testproto1'
    );

    const hist1 = await HistoricalYieldModel.find({
      protocolId: 'component_rdx1testproto1',
    });
    expect(hist1.length).toBe(1);
    expect(hist1[0].apy).toBe('0.01');
    expect(hist1[0].tvl).toBe('100000');

    const hist2 = await HistoricalYieldModel.find({
      protocolId: 'component_rdx1testproto2',
    });
    expect(hist2[0].apy).toBe('0.02');
    expect(hist2[0].tvl).toBe('200000');
  });

  it('does not run concurrently', async () => {
    // First call sets the lock so second call is a no-op (could test the log)
    const spy = vi.spyOn(console, 'warn');
    let p1 = updateProtocolsJob();
    let p2 = updateProtocolsJob();
    await Promise.all([p1, p2]);

    expect(spy).toHaveBeenCalledWith(
      '[WARN] Skipping: updateProtocolsJob still running.'
    );
    spy.mockRestore();
  });
});
