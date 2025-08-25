import { fetchTokenMetadataMany, fetchTokenMetadataSingle } from "$server/api/gateway/gateway";
import { TokenCache } from "$server/services/tokenCache";

export const tokenCache = new TokenCache(fetchTokenMetadataSingle, fetchTokenMetadataMany);