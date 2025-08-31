// src/routes/api/dev/dapps/+server.ts
import { getCachedDappDefinitions } from '$server/api/radixApi/radixApi';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
  try {
    const dapps = await getCachedDappDefinitions();

    return json({
      dapps,
      count: dapps.length,
    });
  } catch (error) {
    console.error('Error fetching dApp definitions:', error);
    return json(
      {
        error: 'Failed to fetch dApp definitions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};
