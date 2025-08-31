// @ts-nocheck
import { getCachedDappDefinitions } from '$server/api/radixApi/radixApi';
import { RadixNetwork } from '@radixdlt/babylon-gateway-api-sdk';
import type { PageServerLoad } from './$types';

export const load = async ({ url }: Parameters<PageServerLoad>[0]) => {
  try {
    // Get all dApp definitions (cached)
    const allDapps = await getCachedDappDefinitions();

    // Get pagination parameters from URL
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
    const search = url.searchParams.get('search') ?? '';

    // Filter dApps based on search term
    let filteredDapps = allDapps;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredDapps = allDapps.filter(
        (dapp) =>
          dapp.name?.toLowerCase().includes(searchLower) ||
          dapp.description?.toLowerCase().includes(searchLower) ||
          dapp.address?.toLowerCase().includes(searchLower) ||
          dapp.website?.toLowerCase().includes(searchLower)
      );
    }

    // Calculate pagination
    const totalItems = filteredDapps.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedDapps = filteredDapps.slice(startIndex, endIndex);

    return {
      dapps: paginatedDapps,
      pagination: {
        currentPage: page,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      search,
      network: process.env.NETWORK_NAME || RadixNetwork.Mainnet,
      endpoint:
        process.env.NETWORK_NAME === 'stokenet'
          ? 'https://stokenet.radixapi.net/v1/entity/dapp_definitions'
          : 'https://api.radixapi.net/v1/entity/dapp_definitions',
    };
  } catch (error) {
    console.error('Error loading dApp definitions:', error);

    return {
      dapps: [],
      pagination: {
        currentPage: 1,
        pageSize: 20,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
      search: '',
      network: process.env.NETWORK_NAME || RadixNetwork.Mainnet,
      endpoint: '',
      error:
        error instanceof Error
          ? error.message
          : 'Failed to load dApp definitions',
    };
  }
};
