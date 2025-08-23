import { HistoricalYieldModel } from '$server/mongo/models/HistoricalYieldDoc';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const yieldSourceId = url.searchParams.get('yieldSourceId');
    const limit = Number(url.searchParams.get('limit') ?? '50');
    const skip = Number(url.searchParams.get('skip') ?? '0');

    if (!yieldSourceId) {
      return new Response(
        JSON.stringify({ error: 'yieldSourceId query param required' }),
        { status: 400 }
      );
    }

    const histories = await HistoricalYieldModel.find({ yieldSourceId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .lean()
      .exec();
    return new Response(JSON.stringify({ histories }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
};
