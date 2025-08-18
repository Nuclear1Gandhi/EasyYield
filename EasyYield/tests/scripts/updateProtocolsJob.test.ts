// src/lib/server/protocolMetrics/tests/updateProtocolsJob.test.ts

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ProtocolModel } from '$server/mongo/models/Protocol';
import { HistoricalYieldModel } from '$server/mongo/models/HistoricalYieldDoc';
import { updateProtocolsJob } from '$server/jobs/updateProtocols/updateProtocols';

// 1) Mock Ociswap updater to insert two protocols
vi.mock('$server/jobs/updateProtocols/ociswap', () => ({
  updateOciswapProtocols: vi.fn().mockImplementation(async () => {
    // Insert into DB
    await ProtocolModel.create([
      {
        protocolId: 'component_rdx1testproto1',
        name: 'TEST/XRD',
        type: 'DEX_PAIR',
        currentApy: '0.01',
        tvl: '100000',
        lastUpdated: new Date(),
        raw: {},
      },
      {
        protocolId: 'component_rdx1testproto2',
        name: 'FOO/XRD',
        type: 'DEX_PAIR',
        currentApy: '0.02',
        tvl: '200000',
        lastUpdated: new Date(),
        raw: {},
      },
    ]);
    // Also write historical yields
    await HistoricalYieldModel.create([
      {
        protocolId: 'component_rdx1testproto1',
        apy: '0.01',
        tvl: '100000',
        timestamp: new Date(),
      },
      {
        protocolId: 'component_rdx1testproto2',
        apy: '0.02',
        tvl: '200000',
        timestamp: new Date(),
      },
    ]);
    return {
      updates: 2,
      errors: 0,
      protocolIds: ['component_rdx1testproto1', 'component_rdx1testproto2'],
    };
  }),
}));

// 2) Mock CaviarNine updater to insert one protocol
vi.mock('$server/jobs/updateProtocols/caviarNine', () => ({
  updateCaviarNineProtocols: vi.fn().mockImplementation(async () => {
    await ProtocolModel.create({
      protocolId: 'component_caviar_test1',
      name: 'CAVIAR/POOL',
      type: 'LSU_POOL',
      currentApy: '0.05',
      tvl: '500000',
      lastUpdated: new Date(),
      raw: {},
    });
    await HistoricalYieldModel.create({
      protocolId: 'component_caviar_test1',
      apy: '0.05',
      tvl: '500000',
      timestamp: new Date(),
    });
    return {
      updates: 1,
      errors: 0,
      protocolIds: ['component_caviar_test1'],
    };
  }),
}));

describe('updateProtocolsJob', () => {
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
    await HistoricalYieldModel.deleteMany({});
  });

  it('inserts and updates protocols from both updaters', async () => {
    const result = await updateProtocolsJob();
    // Should have processed 3 updates total, 0 errors
    expect(result).toEqual({ updates: 3, errors: 0 });

    const protocols = await ProtocolModel.find();
    expect(protocols.length).toBe(3);
    const ids = protocols.map((p) => p.protocolId);
    expect(ids).toContain('component_rdx1testproto1');
    expect(ids).toContain('component_rdx1testproto2');
    expect(ids).toContain('component_caviar_test1');

    const histCount = await HistoricalYieldModel.countDocuments();
    expect(histCount).toBe(3);
  });

  it('does not run concurrently', async () => {
    const warnSpy = vi.spyOn(console, 'warn');
    // Kick off two calls in parallel
    await Promise.all([updateProtocolsJob(), updateProtocolsJob()]);
    expect(warnSpy).toHaveBeenCalledWith(
      '[WARN] Skipping: updateProtocolsJob still running.'
    );
    warnSpy.mockRestore();
  });
});
