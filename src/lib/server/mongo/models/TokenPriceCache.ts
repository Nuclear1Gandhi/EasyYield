import mongoose from 'mongoose';

const TokenPriceCacheSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true,
  },
  priceUSD: { type: Number, required: true },
  lastUpdated: { type: Date, required: true, index: true },
});

export const TokenPriceCache = mongoose.model(
  'TokenPriceCache',
  TokenPriceCacheSchema
);
