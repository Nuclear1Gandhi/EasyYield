import { ProtocolModel } from '$server/mongo/models/Protocol';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
  try {
    // Fetch all protocols (add filters if you want only specific ones)
    const protocols = await ProtocolModel.find({}).lean();

    return new Response(JSON.stringify({ protocols }), {
      status: 200,
    });
  } catch (err) {
    console.error('DB Error', err);
    return new Response('Error querying protocols', { status: 500 });
  }
};
