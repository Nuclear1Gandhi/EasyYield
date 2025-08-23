// src/server/api/caviarNine/mockPools.ts
import type { CaviarNinePoolWithVault } from '$shared/typings/CaviarNine';
import type { YieldSourceDocRaw } from '$shared/typings/YieldSource';
import { YieldSourceType } from '$shared/typings/YieldSource';

export const MOCK_CAVIARNINE_POOLS: YieldSourceDocRaw<CaviarNinePoolWithVault>[] =
  [
    {
      yieldSourceId: 'component_tdx_2_1mock_caviarnine_xrd_usdc_pool_123456',
      name: 'CaviarNine resource_tdx_2_1mock_xrd_resource/resource_tdx_2_1mock_usdc_resource',
      displayName: 'CaviarNine XRD/USDC',
      type: YieldSourceType.LSU_POOL,
      currentApy: '12.45',
      tvl: '2150000',
      lastUpdated: new Date(),
      raw: {
        address: 'component_tdx_2_1mock_caviarnine_xrd_usdc_pool_123456',
        name: 'resource_tdx_2_1mock_xrd_resource/resource_tdx_2_1mock_usdc_resource',
        type: 'LSU',
        apy: '12.45',
        tvl: '2150000',
        token0: {
          symbol: 'XRD',
          address: 'resource_tdx_2_1mock_xrd_resource_123456789',
        },
        token1: {
          symbol: 'USDC',
          address: 'resource_tdx_2_1mock_usdc_resource_987654321',
        },
        feeVaultData: {
          component_address:
            'component_tdx_2_1mock_caviarnine_xrd_usdc_pool_123456',
          vault_address: 'internal_vault_tdx_2_1mock_fee_vault_123456',
          total_fees_collected: '1250.75',
        },
      },
    },
    {
      yieldSourceId: 'component_tdx_2_1mock_caviarnine_lsulp_xrd_pool_456789',
      name: 'CaviarNine resource_tdx_2_1mock_lsulp_resource/resource_tdx_2_1mock_xrd_resource',
      displayName: 'CaviarNine LSULP/XRD',
      type: YieldSourceType.LSU_POOL,
      currentApy: '15.23',
      tvl: '3200000',
      lastUpdated: new Date(),
      raw: {
        address: 'component_tdx_2_1mock_caviarnine_lsulp_xrd_pool_456789',
        name: 'resource_tdx_2_1mock_lsulp_resource/resource_tdx_2_1mock_xrd_resource',
        type: 'LSU',
        apy: '15.23',
        tvl: '3200000',
        token0: {
          symbol: 'LSULP',
          address: 'resource_tdx_2_1mock_lsulp_resource_789123456',
        },
        token1: {
          symbol: 'XRD',
          address: 'resource_tdx_2_1mock_xrd_resource_123456789',
        },
        feeVaultData: {
          component_address:
            'component_tdx_2_1mock_caviarnine_lsulp_xrd_pool_456789',
          vault_address: 'internal_vault_tdx_2_1mock_fee_vault_456789',
          total_fees_collected: '2100.45',
        },
      },
    },
    {
      yieldSourceId: 'component_tdx_2_1mock_caviarnine_single_xrd_pool_987654',
      name: 'CaviarNine Single XRD Staking Pool',
      displayName: 'CaviarNine Single XRD Pool',
      type: YieldSourceType.LSU_POOL,
      currentApy: '8.95',
      tvl: '5500000',
      lastUpdated: new Date(),
      raw: {
        address: 'component_tdx_2_1mock_caviarnine_single_xrd_pool_987654',
        name: 'Single XRD Liquid Staking Pool',
        type: 'LSU',
        apy: '8.95',
        tvl: '5500000',
        token0: {
          symbol: 'XRD',
          address: 'resource_tdx_2_1mock_xrd_resource_123456789',
        },
        token1: null,
        feeVaultData: {
          component_address:
            'component_tdx_2_1mock_caviarnine_single_xrd_pool_987654',
          vault_address: 'internal_vault_tdx_2_1mock_fee_vault_987654',
          total_fees_collected: '2450.75',
        },
      },
    },
  ];

export function getMockCaviarNinePools(): YieldSourceDocRaw<CaviarNinePoolWithVault>[] {
  // Add some randomization to make it feel realistic
  return MOCK_CAVIARNINE_POOLS.map((pool) => ({
    ...pool,
    currentApy: (parseFloat(pool.currentApy) + (Math.random() * 2 - 1)).toFixed(
      2
    ),
    tvl: (parseFloat(pool.tvl) * (0.95 + Math.random() * 0.1)).toFixed(0),
    lastUpdated: new Date(),
    raw: {
      ...pool.raw,
      apy: (parseFloat(pool.raw.apy!) + (Math.random() * 2 - 1)).toFixed(2),
      tvl: (parseFloat(pool.raw.tvl!) * (0.95 + Math.random() * 0.1)).toFixed(
        0
      ),
    },
  }));
}
