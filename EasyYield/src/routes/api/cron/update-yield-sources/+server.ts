import { updateYieldSourcesJob } from '$server/jobs/updateYieldSources/updateYieldSources';
import type { RequestHandler } from '@sveltejs/kit';
import mongoose from 'mongoose';
export const GET: RequestHandler = async ({}) => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return new Response(JSON.stringify('MONGODB_URI not configured'), {
      status: 500,
    });
  }

  try {
    await mongoose.connect(uri);
    const result = await updateYieldSourcesJob();
    await mongoose.disconnect();
    return new Response(
      JSON.stringify({
        success: true,
        updates: result?.updates || 0,
        errors: result?.errors || 0,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    await mongoose.disconnect();
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
      }),
      {
        status: 500,
      }
    );
  }
};
