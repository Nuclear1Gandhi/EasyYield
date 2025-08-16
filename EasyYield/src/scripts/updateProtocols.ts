import { MONGODB_URI } from '$env/static/private';
import { updateProtocolsJob } from '$server/workers/updateProtocols';
import mongoose from 'mongoose';

if (import.meta.main) {
  (async () => {
    await mongoose.connect(MONGODB_URI);
    await updateProtocolsJob();
    await mongoose.disconnect();
    process.exit(0);
  })();
}
