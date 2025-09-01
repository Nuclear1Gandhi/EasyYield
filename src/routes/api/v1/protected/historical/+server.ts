import { HistoricalYieldModel } from '$server/mongo/models/HistoricalYieldDoc';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const yieldSourceAddress = url.searchParams.get('yieldSourceAddress');
    const limit = Number(url.searchParams.get('limit') ?? '50');
    const skip = Number(url.searchParams.get('skip') ?? '0');

    if (!yieldSourceAddress) {
      return new Response(
        JSON.stringify({ error: 'yieldSourceAddress query param required' }),
        { status: 400 }
      );
    }

    const histories = await HistoricalYieldModel.find({
      yieldSourceAddress: yieldSourceAddress,
    })
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
